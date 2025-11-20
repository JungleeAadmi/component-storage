const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const config = require('../config/constants');
const { run } = require('../config/database');

// Upload component image
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { componentId } = req.body;
    
    // Generate filename
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const filename = `${timestamp}${ext}`;
    const filepath = path.join(config.UPLOAD_DIR, filename);
    
    // Resize and optimize image
    await sharp(req.file.buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);
    
    // Update component if componentId provided
    if (componentId) {
      await run(
        'UPDATE components SET image_path = ? WHERE id = ?',
        [filename, componentId]
      );
    }
    
    res.json({
      success: true,
      filename: filename,
      url: `/uploads/${filename}`
    });
  } catch (error) {
    // Clean up file if processing failed
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Delete image
const deleteImage = async (req, res, next) => {
  try {
    const { filename } = req.params;
    
    const filepath = path.join(config.UPLOAD_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true, message: 'Image deleted' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
