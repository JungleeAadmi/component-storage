// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Database constraint violation',
      details: err.message
    });
  }
  
  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'Maximum file size is 5MB'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
