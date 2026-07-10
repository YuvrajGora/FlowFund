import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/recurring
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM recurring_transactions WHERE user_id = ?`;
        const { rows } = await db.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Fetch Recurring Rules Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while fetching recurring rules' });
    }
});

// POST /api/recurring - Create Rule
router.post('/', authenticateToken, async (req, res) => {
    const { type, title, amount, category, frequency } = req.body;

    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ error: 'Category must be a non-empty string' });
    }

    if (frequency !== 'weekly' && frequency !== 'monthly') {
        return res.status(400).json({ error: 'Frequency must be either "weekly" or "monthly"' });
    }

    // Calculate next_due
    const now = new Date();
    let nextDue = new Date();
    if (frequency === 'weekly') nextDue.setDate(now.getDate() + 7);
    if (frequency === 'monthly') nextDue.setMonth(now.getMonth() + 1);

    const sql = `INSERT INTO recurring_transactions (user_id, type, title, amount, category, frequency, last_processed, next_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`;

    try {
        const result = await db.execute(sql, [
            req.user.id,
            type,
            title.trim(),
            parsedAmount,
            category.trim(),
            frequency,
            now.toISOString(),
            nextDue.toISOString()
        ]);
        res.status(201).json({
            id: result.lastID || result.rows?.[0]?.id,
            message: 'Recurring rule created',
            type,
            title: title.trim(),
            amount: parsedAmount,
            category: category.trim(),
            frequency,
            next_due: nextDue.toISOString()
        });
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Create Recurring Rule Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while creating recurring rule' });
    }
});

// POST /api/recurring/process - Check for due transactions
router.post('/process', authenticateToken, async (req, res) => {
    const sql = `SELECT * FROM recurring_transactions WHERE user_id = ? AND next_due <= ?`;
    const now = new Date().toISOString();

    try {
        const { rows: rules } = await db.query(sql, [req.user.id, now]);

        if (rules.length === 0) return res.json({ message: 'No due recurring transactions', processedCount: 0 });

        const processRule = async (rule) => {
            // 1. Create Transaction
            const txSql = `INSERT INTO transactions (user_id, type, title, amount, category, date) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`;
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

        res.json({ message: `Processed ${rules.length} recurring transactions`, processedCount: rules.length });
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Process Recurring Rules Error:', err);
        }
        res.status(500).json({ error: 'Internal server error occurred while processing recurring transactions' });
    }
});

export default router;
