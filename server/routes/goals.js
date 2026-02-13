import express from 'express';
import db from '../database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = 'flowfund_secret_key_change_me_in_prod';

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

// GET /api/goals
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM goals WHERE user_id = ?`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/goals
router.post('/', authenticateToken, async (req, res) => {
    const { name, target_amount, deadline, current_amount } = req.body;
    if (!name || !target_amount) return res.status(400).json({ error: 'Name and target amount are required' });

    try {
        const sql = `INSERT INTO goals (user_id, name, target_amount, deadline, current_amount) VALUES (?, ?, ?, ?, ?)`;
        const result = await db.execute(sql, [req.user.id, name, target_amount, deadline, current_amount || 0]);
        res.json({ id: result.lastID || result.rows?.[0]?.id, name, target_amount, deadline, current_amount: current_amount || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/goals/:id (Update progress)
router.put('/:id', authenticateToken, async (req, res) => {
    const { current_amount } = req.body;
    try {
        const sql = `UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?`;
        await db.execute(sql, [current_amount, req.params.id, req.user.id]);
        res.json({ message: 'Goal updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
