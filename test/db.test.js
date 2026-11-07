import test from 'node:test';
import assert from 'node:assert/strict';
import adapter, { dbReady, initDb } from '../server/database.js';

test('Database Initialization & Schema Validation', async () => {
    // Ensure DB initializes cleanly without double PRIMARY KEY syntax error
    await dbReady;
    await initDb();

    // Verify all 5 tables exist
    const tables = ['users', 'budgets', 'goals', 'recurring_transactions', 'transactions'];
    for (const table of tables) {
        const result = await adapter.query(`SELECT count(*) as count FROM ${table}`);
        assert.ok(result.rows !== undefined, `Table ${table} should be queryable`);
    }
});

test('Database Adapter CRUD Operations', async () => {
    await dbReady;

    const testEmail = `dbtest_${Date.now()}@example.com`;
    const testUsername = `dbuser_${Date.now()}`;

    // Test execute (INSERT)
    const insertRes = await adapter.execute(
        'INSERT INTO users (username, email, password, is_verified) VALUES (?, ?, ?, ?)',
        [testUsername, testEmail, 'hashedpass123', 1]
    );
    assert.ok(insertRes, 'Insert should return result');

    // Test get (SELECT single)
    const user = await adapter.get('SELECT * FROM users WHERE email = ?', [testEmail]);
    assert.ok(user, 'User should be found');
    assert.equal(user.username, testUsername);
    assert.equal(user.email, testEmail);

    // Test query (SELECT multiple)
    const queryRes = await adapter.query('SELECT * FROM users WHERE id = ?', [user.id]);
    assert.equal(queryRes.rows.length, 1);
    assert.equal(queryRes.rows[0].email, testEmail);

    // Test execute (UPDATE)
    await adapter.execute('UPDATE users SET is_verified = ? WHERE id = ?', [0, user.id]);
    const updated = await adapter.get('SELECT is_verified FROM users WHERE id = ?', [user.id]);
    assert.equal(updated.is_verified, 0);

    // Cleanup
    await adapter.execute('DELETE FROM users WHERE id = ?', [user.id]);
    const deleted = await adapter.get('SELECT * FROM users WHERE id = ?', [user.id]);
    assert.equal(deleted, undefined);
});

