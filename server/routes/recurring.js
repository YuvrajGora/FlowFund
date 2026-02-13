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
router.get('/', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM recurring_transactions WHERE user_id = ?`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST /api/recurring - Create Rule
router.post('/', authenticateToken, (req, res) => {
    const { type, title, amount, category, frequency } = req.body;

    // Calculate next_due
    const now = new Date();
    let nextDue = new Date();
    if (frequency === 'weekly') nextDue.setDate(now.getDate() + 7);
    if (frequency === 'monthly') nextDue.setMonth(now.getMonth() + 1);

    const sql = `INSERT INTO recurring_transactions (user_id, type, title, amount, category, frequency, last_processed, next_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    // Initial last_processed is NOW because we assume the first transaction is created immediately by the user manually, 
    // OR we could process it immediately. The user requirement implies "mark as recurring", so usually the first one is the "template".
    // Let's assume the user creates a transaction AND checks "Recurring". So we create the rule and set next_due to next cycle.

    db.run(sql, [req.user.id, type, title, amount, category, frequency, now.toISOString(), nextDue.toISOString()], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Recurring rule created' });
    });
});

// POST /api/recurring/process - Check for due transactions
router.post('/process', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM recurring_transactions WHERE user_id = ? AND next_due <= ?`;
    const now = new Date().toISOString();

    db.all(sql, [req.user.id, now], (err, rules) => {
        if (err) return res.status(500).json({ error: err.message });

        if (rules.length === 0) return res.json({ message: 'No due recurring transactions' });

        let processedCount = 0;
        const processRule = (rule) => {
            return new Promise((resolve, reject) => {
                // 1. Create Transaction
                const txSql = `INSERT INTO transactions (user_id, type, title, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)`;
                // Use the 'next_due' date as the transaction date (or now?) - usually 'now' is better for "created just now"
                const txDate = new Date().toISOString();

                db.run(txSql, [rule.user_id, rule.type, rule.title, rule.amount, rule.category, txDate], function (err) {
                    if (err) return reject(err);

                    // 2. Update Rule (Next Due)
                    let nextDue = new Date(rule.next_due);
                    if (rule.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
                    if (rule.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

                    const updateSql = `UPDATE recurring_transactions SET last_processed = ?, next_due = ? WHERE id = ?`;
                    db.run(updateSql, [now, nextDue.toISOString(), rule.id], (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        };

        Promise.all(rules.map(processRule))
            .then(() => res.json({ message: `Processed ${rules.length} recurring transactions` }))
            .catch(err => res.status(500).json({ error: err.message }));
    });
});

export default router;
