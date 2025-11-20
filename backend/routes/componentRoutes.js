const express = require('express');
const router = express.Router();
const {
  getAllComponents,
  getComponent,
  createComponent,
  updateComponent,
  updateQuantity,
  deleteComponent,
  searchComponents,
  getLowStock,
  getStatistics
} = require('../controllers/componentController');
const { validateComponent } = require('../middleware/validator');

// GET /api/components - Get all components
router.get('/', getAllComponents);

// GET /api/components/search?q=term - Search components
router.get('/search', searchComponents);

// GET /api/components/low-stock - Get low stock components
router.get('/low-stock', getLowStock);

// GET /api/components/statistics - Get statistics
router.get('/statistics', getStatistics);

// GET /api/components/:id - Get single component
router.get('/:id', getComponent);

// POST /api/components - Create component
router.post('/', validateComponent, createComponent);

// PUT /api/components/:id - Update component
router.put('/:id', validateComponent, updateComponent);

// PATCH /api/components/:id/quantity - Update quantity only
router.patch('/:id/quantity', updateQuantity);

// DELETE /api/components/:id - Delete component
router.delete('/:id', deleteComponent);

module.exports = router;
