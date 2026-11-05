import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbReady, isPostgres } from './database.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import goalRoutes from './routes/goals.js';
import recurringRoutes from './routes/recurring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recurring', recurringRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'FlowFund API is running',
        version: '1.0.3-prod',
        database: isPostgres ? 'PostgreSQL' : 'SQLite',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve static files from the built client in dist
const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

app.use(express.static(distPath));

// Catch-all handler: for client-side routing, send back index.html
app.get(/(.*)/, (req, res) => {
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).send('FlowFund API is running. Run `npm run build` to build and serve the client UI.');
    }
});

export const startServer = (port = PORT, host = HOST) => {
    return new Promise((resolve, reject) => {
        dbReady.then(() => {
            const s = app.listen(port, host, () => {
                console.log(`Server running on http://${host}:${port}`);
                resolve(s);
            });
            s.on('error', reject);
        }).catch(reject);
    });
};

const isMain = process.argv[1] && (
    process.argv[1].endsWith('server' + path.sep + 'index.js') ||
    process.argv[1].endsWith('server/index.js')
);

let server;
if (isMain && process.env.NODE_ENV !== 'test') {
    startServer(PORT, HOST).then((s) => {
        server = s;
    }).catch((err) => {
        console.error('Fatal database initialization failure on startup:', err);
        process.exit(1);
    });
}

export { app, server };
export default app;
