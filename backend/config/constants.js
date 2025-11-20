const path = require('path');

const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3210,
  HOST: process.env.HOST || '0.0.0.0',
  
  // Database
  DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, '../data/components.db'),
  
  // File uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // Backup
  BACKUP_DIR: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
  BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
  AUTO_BACKUP_ENABLED: process.env.AUTO_BACKUP_ENABLED === 'true',
  BACKUP_HOUR: parseInt(process.env.BACKUP_HOUR) || 0,
  BACKUP_MINUTE: parseInt(process.env.BACKUP_MINUTE) || 0,
  
  // Application
  APP_NAME: process.env.APP_NAME || 'Component Storage',
  APP_URL: process.env.APP_URL || 'http://localhost:3210',
  
  // Categories
  DEFAULT_CATEGORIES: [
    'Resistors',
    'Capacitors',
    'Diodes',
    'Transistors',
    'ICs',
    'LEDs',
    'Sensors',
    'Modules',
    'Connectors',
    'Switches',
    'Relays',
    'Crystals',
    'Batteries',
    'Tools',
    'Other'
  ]
};

module.exports = config;
