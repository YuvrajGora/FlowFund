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
router.get('/', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM budgets WHERE user_id = ?`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST /api/budgets - Create or Update budget for a category
router.post('/', authenticateToken, (req, res) => {
    const { category, limit_amount } = req.body;

    if (!category || !limit_amount) {
        return res.status(400).json({ error: 'Category and limit are required' });
    }

    // Check if budget exists for this category
    const checkSql = `SELECT * FROM budgets WHERE user_id = ? AND category = ?`;
    db.get(checkSql, [req.user.id, category], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Update
            const updateSql = `UPDATE budgets SET limit_amount = ? WHERE id = ?`;
            db.run(updateSql, [limit_amount, row.id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Budget updated', id: row.id, category, limit_amount });
            });
        } else {
            // Insert
            const insertSql = `INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)`;
            db.run(insertSql, [req.user.id, category, limit_amount], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Budget created', id: this.lastID, category, limit_amount });
            });
        }
    });
});

export default router;
