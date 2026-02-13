import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');

const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(dbPath);

console.log(`Reading database from: ${dbPath}\n`);

db.serialize(() => {
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error("Error reading users:", err.message);
            return;
        }
        console.log(`--- USERS (${rows.length}) ---`);
        console.table(rows);

        db.all("SELECT * FROM transactions", (err, rows) => {
            if (err) {
                console.error("Error reading transactions:", err.message);
                return;
            }
            console.log(`\n--- TRANSACTIONS (${rows.length}) ---`);
            console.table(rows);
        });
    });
});
