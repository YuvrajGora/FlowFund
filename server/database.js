import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'database.sqlite');

const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Migration for existing users
        const columns = [
            "ALTER TABLE users ADD COLUMN email TEXT UNIQUE;",
            "ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN verification_token TEXT;"
        ];

        columns.forEach(query => {
            db.run(query, () => { });
        });

        // Budgets Table
        db.run(`CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      category TEXT,
      limit_amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // Goals Table
        db.run(`CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      target_amount REAL,
      current_amount REAL DEFAULT 0,
      deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // Recurring Transactions Table
        db.run(`CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT, -- 'income' or 'expense'
      title TEXT,
      amount REAL,
      category TEXT,
      frequency TEXT, -- 'monthly', 'weekly'
      last_processed DATE,
      next_due DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      amount REAL,
      type TEXT, 
      category TEXT,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    });
}

export default db;
