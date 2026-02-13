import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');

const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(dbPath);

console.log('Fixing existing users...');

db.serialize(() => {
    db.run("UPDATE users SET is_verified = 1 WHERE is_verified = 0", function (err) {
        if (err) {
            console.error("Error updating users:", err.message);
        } else {
            console.log(`Updated ${this.changes} users to be verified.`);
        }
    });
});
