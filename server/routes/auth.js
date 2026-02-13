import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();
const SECRET_KEY = 'flowfund_secret_key_change_me_in_prod';

// Register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const sql = `INSERT INTO users (username, email, password, verification_token) VALUES (?, ?, ?, ?)`;
        db.run(sql, [username, email, hashedPassword, token], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('email')) return res.status(400).json({ error: 'Email already exists' });
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            // MOCK EMAIL SENDING
            console.log('\n==================================================');
            console.log(`📧  VERIFICATION LINK FOR ${email}:`);
            console.log(`http://localhost:5173/verify?token=${token}`);
            console.log('==================================================\n');

            res.status(201).json({ message: 'Registration successful! Please check your email to verify account.' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify Email
router.get('/verify', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const sql = `SELECT * FROM users WHERE verification_token = ?`;
    db.get(sql, [token], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid or expired token' });

        const updateSql = `UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?`;
        db.run(updateSql, [user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Verification failed' });
            res.json({ message: 'Email verified successfully' });
        });
    });
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Allow login with either username or email
    const sql = `SELECT * FROM users WHERE username = ? OR email = ?`;
    db.get(sql, [username, username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

        if (user.is_verified === 0) {
            return res.status(403).json({ error: 'Please verify your email before logging in.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

export default router;
