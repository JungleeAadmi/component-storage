const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const { 
  getContainers, 
  createContainer, 
  getContainerById,
  updateContainer,
  deleteContainer,
  getSectionById,
  getComponentsBySection,
  addComponent,
  getComponentById,
  updateComponent,
  deleteComponent,
  deleteAttachment // New
} = require('../controllers/inventoryController');

const { globalSearch } = require('../controllers/searchController');

// Helper for file uploads
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 }, 
  { name: 'attachments', maxCount: 10 }
]);

// Container Routes
router.route('/containers')
  .get(protect, getContainers)
  .post(protect, createContainer);

router.route('/containers/:id')
  .get(protect, getContainerById)
  .put(protect, updateContainer)
  .delete(protect, deleteContainer);

// Section Routes
router.get('/sections/:id', protect, getSectionById);
router.get('/sections/:sectionId/components', protect, getComponentsBySection);

// Component Routes
router.post('/components', protect, uploadFields, addComponent);
router.get('/components/:id', protect, getComponentById);
router.put('/components/:id', protect, uploadFields, updateComponent);
router.delete('/components/:id', protect, deleteComponent);

// Attachment Route (New)
router.delete('/attachments/:id', protect, deleteAttachment);

// Search Route
router.get('/search', protect, globalSearch);

module.exports = router;