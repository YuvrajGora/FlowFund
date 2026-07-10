import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');

const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(dbPath);

console.log('Attempting to add missing email column...');

db.serialize(() => {
    // Try adding email column without UNIQUE first (to avoid constraint errors if applicable)
    // Actually, let's try just adding it.
    db.run("ALTER TABLE users ADD COLUMN email TEXT", function (err) {
        if (err) {
            console.error("Error adding email column:", err.message);
        } else {
            console.log("Successfully added email column.");
        }
    });

    // Add unique index separately
    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)", function (err) {
        if (err) {
            console.error("Error creating unique index on email:", err.message);
        } else {
            console.log("Verified unique index on email.");
        }
    });
});
