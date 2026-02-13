import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let db;

// UNIFIED DATABASE ADAPTER
const adapter = {
  query: async (text, params = []) => {
    if (isProduction) {
      // PostgreSQL implementation
      try {
        const res = await db.query(text, params);
        return { rows: res.rows, rowCount: res.rowCount };
      } catch (err) {
        console.error('Database Query Error:', err);
        throw err;
      }
    } else {
      // SQLite implementation
      return new Promise((resolve, reject) => {
        db.all(text, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows });
        });
      });
    }
  },

  // For INSERT/UPDATE/DELETE
  execute: async (text, params = []) => {
    if (isProduction) {
      // Postgres
      // Note: Postgres uses RETURNING id to get the last ID, unlike SQLite's this.lastID
      // We need to ensure our SQL statements include RETURNING * or RETURNING id if we need it.
      return adapter.query(text, params);
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        db.run(text, params, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  },

  // Get single row
  get: async (text, params = []) => {
    if (isProduction) {
      const res = await adapter.query(text, params);
      return res.rows[0];
    } else {
      return new Promise((resolve, reject) => {
        db.get(text, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    }
  }
};


if (isProduction) {
  console.log('Using PostgreSQL Database');
  const { Pool } = pg;
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for minimal SSL on many free tiers
  });
  // No explicit initDb call here, as migrations are usually handled differently in production
  // or the schema is expected to exist.
} else {
  // Local SQLite
  console.log('Using Local SQLite Database');
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      initDb(); // Call initDb for SQLite development
    }
  });

  // Enable FK support for SQLite
  db.run("PRAGMA foreign_keys = ON");
}

/* 
   HELPER: We need to normalize SQL queries.
   SQLite uses `?` for params.
   Postgres uses `$1`, `$2`, etc.
   
   The adapter.query function tentatively tries to handle this, 
   but simplistic regex replacement implies the query passed in MUST use `?`.
   
   WE WILL STANDARD ON USING `?` IN OUR CODE, and the Postgres adapter will convert it.
*/
const normalizeQuery = (text) => {
  if (!isProduction) return text;
  let index = 1;
  return text.replace(/\?/g, () => `$${index++}`);
};

// Overwrite the adapter methods to use the normalizer
const originalQuery = adapter.query;
adapter.query = (text, params) => originalQuery(normalizeQuery(text), params);

const originalExecute = adapter.execute;
adapter.execute = (text, params) => originalExecute(normalizeQuery(text), params);

const originalGet = adapter.get;
adapter.get = (text, params) => originalGet(normalizeQuery(text), params);


async function initDb() {
  // For SQLite, we use serialize to ensure order. For Postgres, execute handles it.
  // We'll use async/await for a more unified approach.
  try {
    // Users Table
    await adapter.execute(`CREATE TABLE IF NOT EXISTS users (
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
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

export default adapter;
