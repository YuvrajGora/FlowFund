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

// GET /api/recurring
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM recurring_transactions WHERE user_id = ?`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/recurring - Create Rule
router.post('/', authenticateToken, async (req, res) => {
    const { type, title, amount, category, frequency } = req.body;

    // Calculate next_due
    const now = new Date();
    let nextDue = new Date();
    if (frequency === 'weekly') nextDue.setDate(now.getDate() + 7);
    if (frequency === 'monthly') nextDue.setMonth(now.getMonth() + 1);

    const sql = `INSERT INTO recurring_transactions (user_id, type, title, amount, category, frequency, last_processed, next_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const result = await db.execute(sql, [req.user.id, type, title, amount, category, frequency, now.toISOString(), nextDue.toISOString()]);
        res.json({ id: result.lastID || result.rows?.[0]?.id, message: 'Recurring rule created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/recurring/process - Check for due transactions
router.post('/process', authenticateToken, async (req, res) => {
    const sql = `SELECT * FROM recurring_transactions WHERE user_id = ? AND next_due <= ?`;
    const now = new Date().toISOString();

    try {
        const { rows: rules } = await db.query(sql, [req.user.id, now]);

        if (rules.length === 0) return res.json({ message: 'No due recurring transactions' });

        const processRule = async (rule) => {
            // 1. Create Transaction
            const txSql = `INSERT INTO transactions (user_id, type, title, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)`;
            const txDate = new Date().toISOString();

            await db.execute(txSql, [rule.user_id, rule.type, rule.title, rule.amount, rule.category, txDate]);

            // 2. Update Rule (Next Due)
            let nextDue = new Date(rule.next_due);
            if (rule.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
            if (rule.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

            const updateSql = `UPDATE recurring_transactions SET last_processed = ?, next_due = ? WHERE id = ?`;
            await db.execute(updateSql, [now, nextDue.toISOString(), rule.id]);
        };

        // Process all rules sequentially or parallel
        for (const rule of rules) {
            await processRule(rule);
        }

        res.json({ message: `Processed ${rules.length} recurring transactions` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
