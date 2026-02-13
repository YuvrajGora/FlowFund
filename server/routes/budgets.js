import express from 'express';
import db from '../database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = 'flowfund_secret_key_change_me_in_prod';

// Middleware to verify token (Duplicate from auth.js, ideally should be in specific middleware file)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// GET /api/budgets - Get all budgets for the user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM budgets WHERE user_id = ?`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/budgets - Create or Update budget for a category
router.post('/', authenticateToken, async (req, res) => {
    const { category, limit_amount } = req.body;

    if (!category || !limit_amount) {
        return res.status(400).json({ error: 'Category and limit are required' });
    }

    try {
        // Check if budget exists for this category
        const checkSql = `SELECT * FROM budgets WHERE user_id = ? AND category = ?`;
        const row = await db.get(checkSql, [req.user.id, category]);

        if (row) {
            // Update
            const updateSql = `UPDATE budgets SET limit_amount = ? WHERE id = ?`;
            await db.execute(updateSql, [limit_amount, row.id]);
            res.json({ message: 'Budget updated', id: row.id, category, limit_amount });
        } else {
            // Insert
            const insertSql = `INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)`;
            const result = await db.execute(insertSql, [req.user.id, category, limit_amount]);
            res.json({ message: 'Budget created', id: result.lastID || result.rows?.[0]?.id, category, limit_amount });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
