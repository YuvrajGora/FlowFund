import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticateToken, SECRET_KEY } from '../server/middleware/auth.js';

const createMockRes = () => {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    return res;
};

test('Auth Middleware: Missing Authorization header returns 401', () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, 'no_authorization_header');
    assert.equal(nextCalled, false);
});

test('Auth Middleware: Malformed Authorization header returns 401', () => {
    const malformedHeaders = [
        'Bearer',
        'Basic abcdef',
        'Bearer token1 token2',
        'justatoken'
    ];

    for (const header of malformedHeaders) {
        const req = { headers: { authorization: header } };
        const res = createMockRes();
        let nextCalled = false;

        authenticateToken(req, res, () => { nextCalled = true; });

        assert.equal(res.statusCode, 401, `Header "${header}" should return 401`);
        assert.equal(res.body.code, 'malformed_authorization_header');
        assert.equal(nextCalled, false);
    }
});

test('Auth Middleware: Expired JWT returns 401 with token_expired code', async () => {
    // Sign a token that expired 10 seconds ago
    const expiredToken = jwt.sign(
        { id: 999, username: 'expireduser' },
        SECRET_KEY,
        { expiresIn: '-10s' }
    );

    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, 'token_expired');
    assert.match(res.body.error, /expired/i);
    assert.equal(nextCalled, false);
});

test('Auth Middleware: Invalid signature returns 401', () => {
    const forgedToken = jwt.sign(
        { id: 999, username: 'attacker' },
        'different_wrong_secret',
        { expiresIn: '1h' }
    );

    const req = { headers: { authorization: `Bearer ${forgedToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, 'invalid_token');
    assert.equal(nextCalled, false);
});

test('Auth Middleware: Valid JWT attaches user to req and calls next()', () => {
    const validToken = jwt.sign(
        { id: 42, username: 'validuser' },
        SECRET_KEY,
        { expiresIn: '7d' }
    );

    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.ok(req.user);
    assert.equal(req.user.id, 42);
    assert.equal(req.user.username, 'validuser');
});
