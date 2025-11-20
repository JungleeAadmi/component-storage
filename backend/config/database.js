const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('./constants');

let db = null;

// Initialize database connection
const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    const dbDir = path.dirname(config.DATABASE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new sqlite3.Database(config.DATABASE_PATH, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err);
        reject(err);
      } else {
        console.log('✓ Connected to SQLite database');
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        // Create tables
        createTables()
          .then(() => resolve())
          .catch(reject);
      }
    });
  });
};

// Create database tables
const createTables = async () => {
  return new Promise((resolve, reject) => {
    const schema = `
      -- Storage Containers Table
      CREATE TABLE IF NOT EXISTS storage_containers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('type1_dual', 'type2_uniform', 'custom')),
        top_rows INTEGER,
        top_cols INTEGER,
        bottom_rows INTEGER,
        bottom_cols INTEGER,
        rows INTEGER,
        cols INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Components Table
      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        category TEXT,
        custom_category TEXT,
        specifications TEXT,
        package_type TEXT,
        value TEXT,
        manufacturer TEXT,
        part_number TEXT,
        purchase_link TEXT,
        price TEXT,
        datasheet_url TEXT,
        notes TEXT,
        image_path TEXT,
        container_id INTEGER,
        tray_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (container_id) REFERENCES storage_containers(id) ON DELETE SET NULL
      );
      
      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
      CREATE INDEX IF NOT EXISTS idx_components_container ON components(container_id);
      CREATE INDEX IF NOT EXISTS idx_components_tray ON components(tray_address);
      CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
      CREATE INDEX IF NOT EXISTS idx_components_part_number ON components(part_number);
      CREATE INDEX IF NOT EXISTS idx_storage_containers_type ON storage_containers(type);
      
      -- Create triggers for updated_at
      CREATE TRIGGER IF NOT EXISTS update_storage_containers_timestamp 
      AFTER UPDATE ON storage_containers
      BEGIN
        UPDATE storage_containers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
      
      CREATE TRIGGER IF NOT EXISTS update_components_timestamp 
      AFTER UPDATE ON components
      BEGIN
        UPDATE components SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `;
    
    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Error creating tables:', err);
        reject(err);
      } else {
        console.log('✓ Database schema initialized');
        resolve();
      }
    });
  });
};

// Get database instance
const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Query helper functions
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  initDatabase,
  getDb,
  query,
  queryOne,
  run
};
