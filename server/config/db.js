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
const db = new Database(dbPath, { verbose: null }); // verbose: null to keep logs clean
db.pragma('journal_mode = WAL');

// --- INITIALIZE TABLES ---
// We create tables if they don't exist yet.

// 1. Users Table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 2. Containers Table (The physical boxes/cabinets)
db.exec(`
  CREATE TABLE IF NOT EXISTS containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 3. Sections Table (The Trays/Drawers inside containers)
db.exec(`
  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id INTEGER NOT NULL,
    name TEXT NOT NULL,         -- e.g., "Top Tray"
    config_type TEXT DEFAULT 'grid',
    rows INTEGER DEFAULT 1,
    cols INTEGER DEFAULT 1,
    designation_char TEXT,      -- e.g., "A" for first tray, "B" for second
    FOREIGN KEY(container_id) REFERENCES containers(id) ON DELETE CASCADE
  )
`);

// 4. Components Table (The actual items)
db.exec(`
  CREATE TABLE IF NOT EXISTS components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    grid_position TEXT,         -- e.g., "A-1A"
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    specification TEXT,
    custom_data TEXT,           -- JSON string for extra fields
    image_url TEXT,
    purchase_link TEXT,
    low_stock_threshold INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE
  )
`);

// 5. Attachments Table (Datasheets, extra images)
db.exec(`
  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    FOREIGN KEY(component_id) REFERENCES components(id) ON DELETE CASCADE
  )
`);

console.log('✅ Database tables initialized');

module.exports = db;