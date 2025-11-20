const express = require('express');
const router = express.Router();

// Import route modules
const componentRoutes = require('./componentRoutes');
const containerRoutes = require('./containerRoutes');
const uploadRoutes = require('./uploadRoutes');

// Mount routes
router.use('/components', componentRoutes);
router.use('/containers', containerRoutes);
router.use('/upload', uploadRoutes);

// Root API endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Component Storage API',
    version: '1.0.0',
    endpoints: {
      components: '/api/components',
      containers: '/api/containers',
      upload: '/api/upload',
      health: '/health'
    }
  });
});

module.exports = router;
