import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/goals
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM goals WHERE user_id = ?`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Fetch Goals Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while fetching goals' });
    }
});

// POST /api/goals
router.post('/', authenticateToken, async (req, res) => {
    const { name, target_amount, deadline, current_amount } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Goal name is required and must be a non-empty string' });
    }

    const parsedTarget = parseFloat(target_amount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
        return res.status(400).json({ error: 'Target amount must be a positive number' });
    }

    const parsedCurrent = parseFloat(current_amount !== undefined ? current_amount : 0);
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
        return res.status(400).json({ error: 'Current amount must be a non-negative number' });
    }

    try {
        const sql = `INSERT INTO goals (user_id, name, target_amount, deadline, current_amount) VALUES (?, ?, ?, ?, ?) RETURNING id`;
        const result = await db.execute(sql, [req.user.id, name.trim(), parsedTarget, deadline, parsedCurrent]);
        res.status(201).json({
            id: result.lastID || result.rows?.[0]?.id,
            name: name.trim(),
            target_amount: parsedTarget,
            deadline,
            current_amount: parsedCurrent
        });
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Add Goal Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while adding goal' });
    }
});

// PUT /api/goals/:id (Update progress)
router.put('/:id', authenticateToken, async (req, res) => {
    const { current_amount } = req.body;

    const parsedCurrent = parseFloat(current_amount);
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
        return res.status(400).json({ error: 'Current amount must be a non-negative number' });
    }

    try {
        const sql = `UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?`;
        await db.execute(sql, [parsedCurrent, req.params.id, req.user.id]);
        res.json({ message: 'Goal updated', id: parseInt(req.params.id), current_amount: parsedCurrent });
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Update Goal Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while updating goal' });
    }
});

export default router;
