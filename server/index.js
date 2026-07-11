import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './database.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import goalRoutes from './routes/goals.js';
import recurringRoutes from './routes/recurring.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recurring', recurringRoutes);

// Serve static files from the React app
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the dist directory (one level up from server)
app.use(express.static(path.join(__dirname, '../dist')));

// API Health check with comprehensive JSON diagnostics
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'FlowFund API is running',
        version: '1.0.2-audit',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            hasDatabaseUrl: typeof process.env.DATABASE_URL !== 'undefined',
            hasJwtSecret: typeof process.env.JWT_SECRET !== 'undefined',
            hasSecretKey: typeof process.env.SECRET_KEY !== 'undefined',
            jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
            secretKeyLength: process.env.SECRET_KEY ? process.env.SECRET_KEY.length : 0
        },
        receivedHeaderKeys: Object.keys(req.headers)
    });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
