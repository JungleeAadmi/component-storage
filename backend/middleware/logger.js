const fs = require('fs');
const path = require('path');
const config = require('../config/constants');

// Simple request logger
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  const logMessage = `[${timestamp}] ${method} ${url} - ${ip}\n`;
  
  // Log to console in development
  if (config.NODE_ENV === 'development') {
    console.log(logMessage.trim());
  }
  
  // Log to file in production
  if (config.NODE_ENV === 'production') {
    const logDir = path.join(__dirname, '../logs');
    const logFile = path.join(logDir, `access-${new Date().toISOString().split('T')[0]}.log`);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Logging error:', err);
    });
  }
  
  next();
};

module.exports = { requestLogger };
