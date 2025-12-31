const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize the database file
const dbPath = path.join(dataDir, 'inventra.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable Write-Ahead Logging for concurrency and performance
db.pragma('journal_mode = WAL');

module.exports = db;