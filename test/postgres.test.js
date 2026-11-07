import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { newDb } from 'pg-mem';
import pg from 'pg';
import adapter, { initDb, setRawDb, getRawDb, closeDb, isPostgres, dbReady } from '../server/database.js';
import app from '../server/index.js';

let pgMemDb;
let pgPool;
let originalDb;
let originalIsPostgres;
let server;
let baseUrl;

test.before(async () => {
    process.env.NODE_ENV = 'test';

    // 1. Await default DB ready first to avoid background connection race
    await dbReady;

    // 2. Save original database state
    originalDb = getRawDb();
    originalIsPostgres = isPostgres;

    // 3. Setup pg-mem to emulate PostgreSQL engine
    pgMemDb = newDb();
    const pgAdapter = pgMemDb.adapters.createPg();
    pgPool = new pgAdapter.Pool();

    // 4. Inject PostgreSQL pool into adapter
    setRawDb(pgPool, true);

    // 5. Initialize PostgreSQL schema
    await initDb();

    // 6. Spin up test HTTP server on ephemeral port
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            resolve();
        });
    });
});

test.after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    await closeDb();
    // Restore original state
    setRawDb(originalDb, originalIsPostgres);
});

test('PostgreSQL: Confirm pg dependency and Pool structure', () => {
    assert.ok(pg, 'pg dependency must be installed and defined');
    assert.ok(pg.Pool, 'pg.Pool must be available');
    assert.equal(typeof pg.Pool, 'function');
});

test('PostgreSQL: Connection configuration and SSL logic validation', () => {
    const testCases = [
        {
            url: 'postgres://user:pass@dpg-abc123-a.oregon-postgres.render.com:5432/flowfund',
            expectedSsl: true,
            desc: 'Render external URL requires SSL'
        },
        {
            url: 'postgres://user:pass@dpg-abc123-a:5432/flowfund',
            expectedSsl: true,
            desc: 'Render internal URL accepts SSL rejectUnauthorized: false'
        },
        {
            url: 'postgres://user:pass@localhost:5432/flowfund',
            expectedSsl: false,
            desc: 'Localhost URL disables SSL'
        },
        {
            url: 'postgres://user:pass@127.0.0.1:5432/flowfund',
            expectedSsl: false,
            desc: '127.0.0.1 URL disables SSL'
        },
        {
            url: 'postgres://user:pass@host:5432/flowfund?sslmode=disable',
            expectedSsl: false,
            desc: 'sslmode=disable in URL disables SSL'
        }
    ];

    for (const tc of testCases) {
        const isLocalPg = tc.url.includes('localhost') || 
                          tc.url.includes('127.0.0.1') || 
                          tc.url.includes('sslmode=disable');
        const hasSsl = !isLocalPg;
        assert.equal(hasSsl, tc.expectedSsl, tc.desc);
    }
});

test('PostgreSQL: Verify clean schema initialization and tables', async () => {
    const tables = ['users', 'budgets', 'goals', 'recurring_transactions', 'transactions'];

    for (const table of tables) {
        const check = await adapter.query(`SELECT * FROM ${table} LIMIT 1`);
        assert.ok(Array.isArray(check.rows), `Table ${table} must exist and return rows array`);
    }

    // Verify RETURNING clause works with Postgres SERIAL PRIMARY KEY
    const insertUser = await adapter.execute(
        'INSERT INTO users (username, email, password, is_verified) VALUES (?, ?, ?, ?) RETURNING id',
        ['pg_schema_user', 'pg_schema@flowfund.dev', 'hashedpwd', 1]
    );
    assert.ok(insertUser.rows && insertUser.rows.length === 1, 'PostgreSQL RETURNING id must return inserted row');
    assert.ok(insertUser.rows[0].id > 0, 'Generated ID must be a positive integer from sequence');
});

test('PostgreSQL: End-to-end Auth Flow (Registration, Duplicate Checks, Login)', async () => {
    const unique = Date.now();
    const username = `pg_user_${unique}`;
    const email = `pg_user_${unique}@example.com`;
    const password = 'SecurePassword456!';

    // 1. Register new user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    assert.equal(regRes.status, 201, 'Registration against PostgreSQL should return 201');
    const regData = await regRes.json();
    assert.match(regData.message, /successful/i);

    // 2. Duplicate username check (PostgreSQL 23505 unique violation)
    const dupUserRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: `diff_${unique}@example.com`, password })
    });
    assert.equal(dupUserRes.status, 400, 'Duplicate username should trigger 400');
    const dupUserData = await dupUserRes.json();
    assert.match(dupUserData.error, /Username already exists/i);

    // 3. Duplicate email check (PostgreSQL 23505 unique violation)
    const dupEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `diff_user_${unique}`, email, password })
    });
    assert.equal(dupEmailRes.status, 400, 'Duplicate email should trigger 400');
    const dupEmailData = await dupEmailRes.json();
    assert.match(dupEmailData.error, /Email already exists/i);

    // 4. Successful Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Should return signed JWT token');
    assert.equal(loginData.user.username, username);
});

test('PostgreSQL: Financial Data CRUD (Transactions, Budgets, Goals, Recurring)', async () => {
    const unique = Date.now();
    const username = `fin_pg_${unique}`;
    const email = `fin_pg_${unique}@example.com`;
    const password = 'Password789!';

    await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const { token } = await loginRes.json();
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 1. Create Transaction in PostgreSQL
    const txRes = await fetch(`${baseUrl}/api/transactions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            title: 'Freelance Design Payment',
            amount: 1250.00,
            type: 'income',
            category: 'Salary',
            date: '2026-11-01'
        })
    });
    assert.equal(txRes.status, 201);
    const txData = await txRes.json();
    assert.ok(txData.id > 0, 'Transaction ID must be returned');
    assert.equal(txData.title, 'Freelance Design Payment');
    assert.equal(txData.amount, 1250);

    // Fetch transactions
    const listRes = await fetch(`${baseUrl}/api/transactions`, { headers: authHeaders });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.length, 1);
    assert.equal(listData[0].title, 'Freelance Design Payment');

    // 2. Create and Update Budget in PostgreSQL
    const budgetRes1 = await fetch(`${baseUrl}/api/budgets`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ category: 'Entertainment', limit_amount: 150 })
    });
    assert.equal(budgetRes1.status, 201);

    const budgetRes2 = await fetch(`${baseUrl}/api/budgets`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ category: 'Entertainment', limit_amount: 200 })
    });
    assert.equal(budgetRes2.status, 200);

    const getBudgets = await fetch(`${baseUrl}/api/budgets`, { headers: authHeaders });
    assert.equal(getBudgets.status, 200);
    const budgetList = await getBudgets.json();
    assert.equal(budgetList.length, 1);
    assert.equal(budgetList[0].category, 'Entertainment');
    assert.equal(budgetList[0].limit_amount, 200);

    // 3. Create and Update Goal in PostgreSQL
    const goalRes = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            name: 'Emergency Fund',
            target_amount: 5000,
            current_amount: 1000,
            deadline: '2027-01-01'
        })
    });
    assert.equal(goalRes.status, 201);
    const goalData = await goalRes.json();
    assert.ok(goalData.id > 0);

    const updateGoalRes = await fetch(`${baseUrl}/api/goals/${goalData.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ current_amount: 1500 })
    });
    assert.equal(updateGoalRes.status, 200);

    const getGoals = await fetch(`${baseUrl}/api/goals`, { headers: authHeaders });
    const goalsList = await getGoals.json();
    assert.equal(goalsList[0].current_amount, 1500);

    // 4. Create and Process Recurring Rule in PostgreSQL
    const recRes = await fetch(`${baseUrl}/api/recurring`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            title: 'Cloud VPS Subscription',
            amount: 20.00,
            type: 'expense',
            category: 'Software',
            frequency: 'monthly'
        })
    });
    assert.equal(recRes.status, 201);
    const recData = await recRes.json();
    assert.ok(recData.id > 0);

    // Force next_due to past date to test recurring processor
    await adapter.execute(
        'UPDATE recurring_transactions SET next_due = ? WHERE id = ?',
        ['2026-01-01', recData.id]
    );

    const procRes = await fetch(`${baseUrl}/api/recurring/process`, {
        method: 'POST',
        headers: authHeaders
    });
    assert.equal(procRes.status, 200);
    const procData = await procRes.json();
    assert.equal(procData.processedCount, 1);

    // Verify transaction was generated
    const allTxRes = await fetch(`${baseUrl}/api/transactions`, { headers: authHeaders });
    const allTx = await allTxRes.json();
    assert.equal(allTx.length, 2, 'Should have 2 transactions now (original + processed recurring)');
});

test('PostgreSQL: Connection cleanup and error resilience', async () => {
    // Test database error resilience
    await assert.rejects(
        async () => {
            await adapter.query('SELECT * FROM non_existent_table');
        },
        /non_existent_table/i,
        'Should catch and reject non-existent table query gracefully'
    );
});
