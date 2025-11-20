const config = require('../config/constants');

// Validate file upload
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  // Check file type
  if (!config.ALLOWED_FILE_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: 'Invalid file type',
      details: 'Only JPEG, PNG, and WebP images are allowed'
    });
  }
  
  // Check file size (additional check, multer also checks)
  if (req.file.size > config.MAX_FILE_SIZE) {
    return res.status(400).json({
      error: 'File too large',
      details: 'Maximum file size is 5MB'
    });
  }
  
  next();
};

// Validate component data
const validateComponent = (req, res, next) => {
  const { name, quantity, min_quantity } = req.body;
  
  if (name && typeof name !== 'string') {
    return res.status(400).json({ error: 'Name must be a string' });
  }
  
  if (quantity !== undefined && (isNaN(quantity) || quantity < 0)) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }
  
  if (min_quantity !== undefined && (isNaN(min_quantity) || min_quantity < 0)) {
    return res.status(400).json({ error: 'Minimum quantity must be a non-negative number' });
  }
  
  next();
};

// Validate container data
const validateContainer = (req, res, next) => {
  const { name, type } = req.body;
  
  if (name && typeof name !== 'string') {
    return res.status(400).json({ error: 'Name must be a string' });
  }
  
  if (type && !['type1_dual', 'type2_uniform', 'custom'].includes(type)) {
    return res.status(400).json({ error: 'Invalid container type' });
  }
  
  next();
};

module.exports = {
  validateFileUpload,
  validateComponent,
  validateContainer
};
