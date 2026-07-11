import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { SECRET_KEY } from '../middleware/auth.js';

const router = express.Router();

if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth Audit] Auth Route SECRET_KEY loaded. Length:', SECRET_KEY.length);
}

// Register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Auto-verify user (Feature removed)
        const sql = `INSERT INTO users (username, email, password, is_verified, verification_token) VALUES (?, ?, ?, ?, ?) RETURNING id`;

        try {
            await db.execute(sql, [username, email, hashedPassword, 1, null]);

            res.status(201).json({ message: 'Registration successful! You can now login.' });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key')) {
                // Handle both SQLite and Postgres unique error messages roughly
                if (err.message.includes('email') || err.detail?.includes('email')) return res.status(400).json({ error: 'Email already exists' });
                return res.status(400).json({ error: 'Username already exists' });
            }
            throw err;
        }
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Registration Error:', error);
        }
        res.status(500).json({ error: 'Internal server error occurred' });
    }
});

// Verify Email
router.get('/verify', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    try {
        const sql = `SELECT * FROM users WHERE verification_token = ?`;
        const user = await db.get(sql, [token]);

        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        const updateSql = `UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?`;
        await db.execute(updateSql, [user.id]);

        res.json({ message: 'Email verified successfully' });
    } catch {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Allow login with either username or email
        const sql = `SELECT * FROM users WHERE username = ? OR email = ?`;
        const user = await db.get(sql, [username, username]);

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Login Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred during login' });
    }
});

export default router;
