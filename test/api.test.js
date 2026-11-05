import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../server/index.js';
import { dbReady } from '../server/database.js';
import { SECRET_KEY } from '../server/middleware/auth.js';

let server;
let baseUrl;

test.before(async () => {
    process.env.NODE_ENV = 'test';
    await dbReady;

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
});

test('API: GET /api/health returns 200 and valid JSON', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'OK');
    assert.ok(data.database);
});

test('API: Auth flow (Register, Login, Duplicate Check)', async () => {
    const unique = Date.now();
    const username = `testuser_${unique}`;
    const email = `testuser_${unique}@example.com`;
    const password = 'StrongPassword123';

    // 1. Register
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.match(regData.message, /successful/i);

    // 2. Duplicate registration attempt
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    assert.equal(dupRes.status, 400);

    // 3. Login with credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Should return JWT token');
    assert.equal(loginData.user.username, username);

    // 4. Login with invalid password
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: 'wrongpassword' })
    });
    assert.equal(badLoginRes.status, 401);
});

test('API: Protected Endpoints enforce 401 on missing or expired tokens', async () => {
    // 1. Missing token
    const noAuthRes = await fetch(`${baseUrl}/api/transactions`);
    assert.equal(noAuthRes.status, 401);
    const noAuthData = await noAuthRes.json();
    assert.equal(noAuthData.code, 'no_authorization_header');

    // 2. Expired token
    const expiredToken = jwt.sign(
        { id: 1, username: 'test' },
        SECRET_KEY,
        { expiresIn: '-1s' }
    );
    const expiredRes = await fetch(`${baseUrl}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    assert.equal(expiredRes.status, 401);
    const expiredData = await expiredRes.json();
    assert.equal(expiredData.code, 'token_expired');
});

test('API: Protected Transaction, Budget, and Goal Operations', async () => {
    const unique = Date.now();
    const username = `apiuser_${unique}`;
    const email = `apiuser_${unique}@example.com`;
    const password = 'TestPassword123';

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
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 1. Transactions: Add and Fetch
    const txPostRes = await fetch(`${baseUrl}/api/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: 'Coffee and Pastry',
            amount: 8.50,
            type: 'expense',
            category: 'Food'
        })
    });
    assert.equal(txPostRes.status, 201);
    const createdTx = await txPostRes.json();
    assert.equal(createdTx.title, 'Coffee and Pastry');
    assert.equal(createdTx.amount, 8.5);

    const txGetRes = await fetch(`${baseUrl}/api/transactions`, { headers });
    assert.equal(txGetRes.status, 200);
    const txList = await txGetRes.json();
    assert.ok(Array.isArray(txList));
    assert.equal(txList.length, 1);
    assert.equal(txList[0].title, 'Coffee and Pastry');

    // 2. Budgets: Upsert and Fetch
    const budgetPostRes = await fetch(`${baseUrl}/api/budgets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            category: 'Food',
            limit_amount: 300
        })
    });
    assert.equal(budgetPostRes.status, 201);

    const budgetGetRes = await fetch(`${baseUrl}/api/budgets`, { headers });
    assert.equal(budgetGetRes.status, 200);
    const budgets = await budgetGetRes.json();
    assert.equal(budgets.length, 1);
    assert.equal(budgets[0].category, 'Food');
    assert.equal(budgets[0].limit_amount, 300);

    // 3. Goals: Create, Update and Fetch
    const goalPostRes = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: 'Vacation Fund',
            target_amount: 1500,
            current_amount: 200,
            deadline: '2026-12-31'
        })
    });
    assert.equal(goalPostRes.status, 201);
    const goal = await goalPostRes.json();
    assert.equal(goal.name, 'Vacation Fund');

    const goalPutRes = await fetch(`${baseUrl}/api/goals/${goal.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ current_amount: 450 })
    });
    assert.equal(goalPutRes.status, 200);

    const goalGetRes = await fetch(`${baseUrl}/api/goals`, { headers });
    assert.equal(goalGetRes.status, 200);
    const goals = await goalGetRes.json();
    assert.equal(goals.length, 1);
    assert.equal(goals[0].current_amount, 450);

    // 4. Recurring rules: Create and Fetch
    const recPostRes = await fetch(`${baseUrl}/api/recurring`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: 'Internet Bill',
            amount: 60,
            type: 'expense',
            category: 'Utilities',
            frequency: 'monthly'
        })
    });
    assert.equal(recPostRes.status, 201);

    const recGetRes = await fetch(`${baseUrl}/api/recurring`, { headers });
    assert.equal(recGetRes.status, 200);
    const recurringList = await recGetRes.json();
    assert.equal(recurringList.length, 1);
    assert.equal(recurringList[0].title, 'Internet Bill');
});
