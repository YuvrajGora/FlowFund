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
router.get('/', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM goals WHERE user_id = ?`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST /api/goals
router.post('/', authenticateToken, (req, res) => {
    const { name, target_amount, deadline, current_amount } = req.body;
    if (!name || !target_amount) return res.status(400).json({ error: 'Name and target amount are required' });

    const sql = `INSERT INTO goals (user_id, name, target_amount, deadline, current_amount) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [req.user.id, name, target_amount, deadline, current_amount || 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, target_amount, deadline, current_amount: current_amount || 0 });
    });
});

// PUT /api/goals/:id (Update progress)
router.put('/:id', authenticateToken, (req, res) => {
    const { current_amount } = req.body;
    const sql = `UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?`;
    db.run(sql, [current_amount, req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Goal updated' });
    });
});

export default router;
