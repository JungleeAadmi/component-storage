require('dotenv').config();
const app = require('./app');
const config = require('./config/constants');
const { initDatabase } = require('./config/database');
const { startBackupSchedule } = require('./services/backupService');
const fs = require('fs');
const path = require('path');

// Ensure required directories exist
const ensureDirectories = () => {
  const dirs = [
    path.dirname(config.DATABASE_PATH),
    config.UPLOAD_DIR,
    config.BACKUP_DIR,
    path.join(__dirname, 'logs')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
};

// Initialize application
const startServer = async () => {
  try {
    console.log('🚀 Starting Component Storage Server...\n');
    
    // Create directories
    ensureDirectories();
    
    // Initialize database
    console.log('📊 Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized\n');
    
    // Start backup schedule if enabled
    if (config.AUTO_BACKUP_ENABLED) {
      console.log('💾 Starting auto-backup schedule...');
      startBackupSchedule();
      console.log(`✓ Auto-backup scheduled for ${config.BACKUP_HOUR}:${String(config.BACKUP_MINUTE).padStart(2, '0')} daily\n`);
    }
    
    // Start server
    const server = app.listen(config.PORT, config.HOST, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Component Storage Server Running');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 URL: http://${config.HOST}:${config.PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`💾 Database: ${config.DATABASE_PATH}`);
      console.log(`📁 Uploads: ${config.UPLOAD_DIR}`);
      console.log(`🔄 Backups: ${config.BACKUP_DIR}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Press Ctrl+C to stop\n');
    });
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
