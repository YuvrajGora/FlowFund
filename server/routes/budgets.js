import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/budgets - Get all budgets for the user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM budgets WHERE user_id = ?`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Fetch Budgets Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while fetching budgets' });
    }
});

// POST /api/budgets - Create or Update budget for a category
router.post('/', authenticateToken, async (req, res) => {
    const { category, limit_amount } = req.body;

    if (!category || typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ error: 'Category is required and must be a non-empty string' });
    }

    const parsedLimit = parseFloat(limit_amount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({ error: 'Limit amount must be a positive number' });
    }

    try {
        // Check if budget exists for this category
        const checkSql = `SELECT * FROM budgets WHERE user_id = ? AND category = ?`;
        const row = await db.get(checkSql, [req.user.id, category.trim()]);

        if (row) {
            // Update
            const updateSql = `UPDATE budgets SET limit_amount = ? WHERE id = ?`;
            await db.execute(updateSql, [parsedLimit, row.id]);
            res.json({ message: 'Budget updated', id: row.id, category: category.trim(), limit_amount: parsedLimit });
        } else {
            // Insert
            const insertSql = `INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?) RETURNING id`;
            const result = await db.execute(insertSql, [req.user.id, category.trim(), parsedLimit]);
            res.status(201).json({ message: 'Budget created', id: result.lastID || result.rows?.[0]?.id, category: category.trim(), limit_amount: parsedLimit });
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Save Budget Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while saving budget' });
    }
});

export default router;
