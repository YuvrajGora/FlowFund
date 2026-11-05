import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const isPostgres = Boolean(process.env.DATABASE_URL);

let db;

/* 
   HELPER: Normalize SQL queries.
   SQLite uses `?` for params.
   Postgres uses `$1`, `$2`, etc.
   Code standards use `?`, and Postgres translates automatically.
*/
const normalizeQuery = (text) => {
  if (!isPostgres) return text;
  let index = 1;
  return text.replace(/\?/g, () => `$${index++}`);
};

// UNIFIED DATABASE ADAPTER
const adapter = {
  query: async (text, params = []) => {
    const sql = normalizeQuery(text);
    if (isPostgres) {
      try {
        const res = await db.query(sql, params);
        return { rows: res.rows, rowCount: res.rowCount };
      } catch (err) {
        console.error('Database Query Error:', err);
        throw err;
      }
    } else {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [] });
        });
      });
    }
  },

  // For INSERT/UPDATE/DELETE
  execute: async (text, params = []) => {
    const sql = normalizeQuery(text);
    if (isPostgres) {
      return adapter.query(sql, params);
    } else {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  },

  // Get single row
  get: async (text, params = []) => {
    const sql = normalizeQuery(text);
    if (isPostgres) {
      const res = await adapter.query(sql, params);
      return res.rows[0];
    } else {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    }
  }
};

export async function initDb() {
  try {
    const idColumn = isPostgres ? 'id SERIAL PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT';
    const dateType = isPostgres ? 'TIMESTAMP' : 'DATETIME';

    // Users Table
    await adapter.execute(`CREATE TABLE IF NOT EXISTS users (
      ${idColumn},
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      created_at ${dateType} DEFAULT CURRENT_TIMESTAMP
    )`);

    // Budgets Table
    await adapter.execute(`CREATE TABLE IF NOT EXISTS budgets (
      ${idColumn},
      user_id INTEGER,
      category TEXT,
      limit_amount REAL,
      created_at ${dateType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Goals Table
    await adapter.execute(`CREATE TABLE IF NOT EXISTS goals (
      ${idColumn},
      user_id INTEGER,
      name TEXT,
      target_amount REAL,
      current_amount REAL DEFAULT 0,
      deadline DATE,
      created_at ${dateType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Recurring Transactions Table
    await adapter.execute(`CREATE TABLE IF NOT EXISTS recurring_transactions (
      ${idColumn},
      user_id INTEGER,
      type TEXT,
      title TEXT,
      amount REAL,
      category TEXT,
      frequency TEXT,
      last_processed DATE,
      next_due DATE,
      created_at ${dateType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Transactions Table
    await adapter.execute(`CREATE TABLE IF NOT EXISTS transactions (
      ${idColumn},
      user_id INTEGER,
      title TEXT,
      amount REAL,
      type TEXT, 
      category TEXT,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    console.log('Database tables initialized.');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

export let dbReady;

if (isPostgres) {
  console.log('Using PostgreSQL Database');
  const { Pool } = pg;
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocalPg = dbUrl.includes('localhost') || 
                    dbUrl.includes('127.0.0.1') || 
                    dbUrl.includes('sslmode=disable');

  db = new Pool({
    connectionString: dbUrl,
    ...(isLocalPg ? {} : { ssl: { rejectUnauthorized: false } })
  });

  dbReady = initDb();
} else {
  // Local SQLite
  console.log('Using Local SQLite Database');
  const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, 'database.sqlite');

  dbReady = new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        return reject(err);
      }
      console.log('Connected to the SQLite database.');
      if (process.env.NODE_ENV === 'production') {
        console.warn('WARNING: Running in production mode with SQLite. Data will be ephemeral on some platforms (like Render Free Tier). Set DATABASE_URL to use PostgreSQL.');
      }
      db.run("PRAGMA foreign_keys = ON", (pragmaErr) => {
        if (pragmaErr) console.warn('Could not enable foreign keys:', pragmaErr);
        initDb().then(resolve).catch(reject);
      });
    });
  });
}

export const getRawDb = () => db;

export default adapter;
