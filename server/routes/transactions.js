import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();
const SECRET_KEY = 'flowfund_secret_key_change_me_in_prod';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Get all transactions for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new transaction
router.post('/', authenticateToken, async (req, res) => {
    const { title, amount, type, category, date } = req.body;

    if (!title || !amount || !type || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const sql = `INSERT INTO transactions (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [req.user.id, title, amount, type, category, date || new Date().toISOString()];

        const result = await db.execute(sql, params);

        // Return the created transaction
        res.status(201).json({
            id: result.lastID || result.rows?.[0]?.id, // Adjust based on adapter return for Postgres (rows) vs SQLite (lastID)
            user_id: req.user.id,
            title,
            amount,
            type,
            category,
            date: params[5]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
