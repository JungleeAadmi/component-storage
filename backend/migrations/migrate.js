const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/database');

// Migration runner
const runMigrations = async () => {
  try {
    console.log('🔄 Running database migrations...\n');
    
    const db = getDb();
    
    // Create migrations table if it doesn't exist
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Get list of executed migrations
    const executedMigrations = await new Promise((resolve, reject) => {
      db.all('SELECT name FROM migrations', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.name));
      });
    });
    
    // Get migration files
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    let executedCount = 0;
    
    for (const file of files) {
      if (executedMigrations.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`▶️  Executing ${file}...`);
      
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      
      await new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) {
            console.error(`❌ Error in ${file}:`, err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // Record migration
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO migrations (name) VALUES (?)', [file], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log(`✓ Completed ${file}\n`);
      executedCount++;
    }
    
    if (executedCount === 0) {
      console.log('✓ No new migrations to run\n');
    } else {
      console.log(`✅ Successfully executed ${executedCount} migration(s)\n`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

module.exports = { runMigrations };

// CLI usage
if (require.main === module) {
  const { initDatabase } = require('../config/database');
  
  initDatabase()
    .then(() => runMigrations())
    .then(() => {
      console.log('Migration complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}
