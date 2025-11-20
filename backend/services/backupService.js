const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const config = require('../config/constants');

// Create backup of database
const createBackup = () => {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup-${timestamp}.db`;
      const backupPath = path.join(config.BACKUP_DIR, backupFilename);
      
      // Ensure backup directory exists
      if (!fs.existsSync(config.BACKUP_DIR)) {
        fs.mkdirSync(config.BACKUP_DIR, { recursive: true });
      }
      
      // Check if database exists
      if (!fs.existsSync(config.DATABASE_PATH)) {
        console.warn('Database file not found. Skipping backup.');
        resolve({ success: false, message: 'Database not found' });
        return;
      }
      
      // Copy database file
      fs.copyFileSync(config.DATABASE_PATH, backupPath);
      
      const stats = fs.statSync(backupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✓ Backup created: ${backupFilename} (${sizeInMB} MB)`);
      
      // Clean old backups
      cleanOldBackups();
      
      resolve({
        success: true,
        filename: backupFilename,
        path: backupPath,
        size: stats.size
      });
    } catch (error) {
      console.error('❌ Backup failed:', error);
      reject(error);
    }
  });
};

// Clean old backups based on retention days
const cleanOldBackups = () => {
  try {
    if (!fs.existsSync(config.BACKUP_DIR)) {
      return;
    }
    
    const files = fs.readdirSync(config.BACKUP_DIR);
    const now = Date.now();
    const retentionMs = config.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    files.forEach(file => {
      const filepath = path.join(config.BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;
      
      if (age > retentionMs) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      console.log(`✓ Cleaned ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error);
  }
};

// List all backups
const listBackups = () => {
  try {
    if (!fs.existsSync(config.BACKUP_DIR)) {
      return [];
    }
    
    const files = fs.readdirSync(config.BACKUP_DIR);
    
    const backups = files
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filepath = path.join(config.BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        
        return {
          filename: file,
          path: filepath,
          size: stats.size,
          created: stats.mtime,
          age_days: Math.floor((Date.now() - stats.mtimeMs) / (24 * 60 * 60 * 1000))
        };
      })
      .sort((a, b) => b.created - a.created);
    
    return backups;
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    return [];
  }
};

// Restore from backup
const restoreBackup = (backupFilename) => {
  return new Promise((resolve, reject) => {
    try {
      const backupPath = path.join(config.BACKUP_DIR, backupFilename);
      
      if (!fs.existsSync(backupPath)) {
        reject(new Error('Backup file not found'));
        return;
      }
      
      // Create a backup of current database before restoring
      const currentBackup = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      const currentBackupPath = path.join(config.BACKUP_DIR, currentBackup);
      
      if (fs.existsSync(config.DATABASE_PATH)) {
        fs.copyFileSync(config.DATABASE_PATH, currentBackupPath);
        console.log(`✓ Current database backed up as: ${currentBackup}`);
      }
      
      // Restore backup
      fs.copyFileSync(backupPath, config.DATABASE_PATH);
      
      console.log(`✓ Database restored from: ${backupFilename}`);
      
      resolve({
        success: true,
        message: 'Database restored successfully',
        restored_from: backupFilename,
        backup_of_current: currentBackup
      });
    } catch (error) {
      console.error('❌ Restore failed:', error);
      reject(error);
    }
  });
};

// Start automatic backup schedule
const startBackupSchedule = () => {
  if (!config.AUTO_BACKUP_ENABLED) {
    console.log('Auto-backup is disabled');
    return;
  }
  
  // Schedule: Run at specified hour:minute every day
  const schedule = `${config.BACKUP_MINUTE} ${config.BACKUP_HOUR} * * *`;
  
  cron.schedule(schedule, async () => {
    console.log('\n🔄 Running scheduled backup...');
    try {
      await createBackup();
      console.log('✓ Scheduled backup completed\n');
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);
    }
  });
  
  console.log(`✓ Backup scheduled: ${schedule} (${config.BACKUP_HOUR}:${String(config.BACKUP_MINUTE).padStart(2, '0')} daily)`);
};

// Manual backup endpoint
const manualBackup = async (req, res, next) => {
  try {
    const result = await createBackup();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBackup,
  cleanOldBackups,
  listBackups,
  restoreBackup,
  startBackupSchedule,
  manualBackup
};

// CLI usage: node backupService.js
if (require.main === module) {
  createBackup()
    .then(result => {
      console.log('Backup result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Backup error:', error);
      process.exit(1);
    });
}
