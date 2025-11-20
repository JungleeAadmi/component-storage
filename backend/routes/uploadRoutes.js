const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config/constants');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { validateFileUpload } = require('../middleware/validator');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// POST /api/upload - Upload image
router.post('/', upload.single('image'), validateFileUpload, uploadImage);

// DELETE /api/upload/:filename - Delete image
router.delete('/:filename', deleteImage);

module.exports = router;
