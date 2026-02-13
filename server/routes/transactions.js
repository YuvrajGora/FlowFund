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
router.get('/', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add new transaction
router.post('/', authenticateToken, (req, res) => {
    const { title, amount, type, category, date } = req.body;

    if (!title || !amount || !type || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `INSERT INTO transactions (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [req.user.id, title, amount, type, category, date || new Date().toISOString()];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // Return the created transaction
        res.status(201).json({
            id: this.lastID,
            user_id: req.user.id,
            title,
            amount,
            type,
            category,
            date: params[5]
        });
    });
});

export default router;
