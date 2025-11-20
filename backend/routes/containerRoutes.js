const express = require('express');
const router = express.Router();
const {
  getAllContainers,
  getContainer,
  createContainer,
  updateContainer,
  deleteContainer
} = require('../controllers/containerController');
const { validateContainer } = require('../middleware/validator');

// GET /api/containers - Get all containers
router.get('/', getAllContainers);

// GET /api/containers/:id - Get single container with components
router.get('/:id', getContainer);

// POST /api/containers - Create container
router.post('/', validateContainer, createContainer);

// PUT /api/containers/:id - Update container
router.put('/:id', validateContainer, updateContainer);

// DELETE /api/containers/:id - Delete container
router.delete('/:id', deleteContainer);

module.exports = router;
