import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Fetch Transactions Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while fetching transactions' });
    }
});

// Add new transaction
router.post('/', authenticateToken, async (req, res) => {
    const { title, amount, type, category, date } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ error: 'Category must be a non-empty string' });
    }

    try {
        const sql = `INSERT INTO transactions (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`;
        const params = [req.user.id, title.trim(), parsedAmount, type, category.trim(), date || new Date().toISOString()];

        const result = await db.execute(sql, params);

        res.status(201).json({
            id: result.lastID || result.rows?.[0]?.id,
            user_id: req.user.id,
            title: title.trim(),
            amount: parsedAmount,
            type,
            category: category.trim(),
            date: params[5]
        });
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Add Transaction Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while adding transaction' });
    }
});

export default router;
