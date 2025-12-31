const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const { 
  getContainers, 
  createContainer, 
  getContainerById,
  deleteContainer,
  getComponentsBySection,
  addComponent,
  getComponentById,
  updateComponent,
  deleteComponent
} = require('../controllers/inventoryController');

const { globalSearch } = require('../controllers/searchController');

// Container Routes
router.route('/containers')
  .get(protect, getContainers)
  .post(protect, createContainer);

router.route('/containers/:id')
  .get(protect, getContainerById)
  .delete(protect, deleteContainer);

// Component Routes
router.post('/components', protect, upload.single('image'), addComponent);
router.get('/components/:id', protect, getComponentById);
router.put('/components/:id', protect, upload.single('image'), updateComponent);
router.delete('/components/:id', protect, deleteComponent);

router.get('/sections/:sectionId/components', protect, getComponentsBySection);

// Search Route
router.get('/search', protect, globalSearch);

module.exports = router;