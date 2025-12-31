const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const { 
  getContainers, 
  createContainer, 
  getContainerById,
  getComponentsBySection,
  addComponent
} = require('../controllers/inventoryController');

const { globalSearch } = require('../controllers/searchController');

// Container Routes
router.route('/containers').get(protect, getContainers).post(protect, createContainer);
router.route('/containers/:id').get(protect, getContainerById);

// Component Routes
// Note: 'image' is the field name we expect from the frontend form data
router.post('/components', protect, upload.single('image'), addComponent);
router.get('/sections/:sectionId/components', protect, getComponentsBySection);

// Search Route
router.get('/search', protect, globalSearch);

module.exports = router;