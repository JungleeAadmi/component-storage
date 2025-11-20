const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config/constants');

// Process and save image
const processImage = async (buffer, filename) => {
  try {
    const filepath = path.join(config.UPLOAD_DIR, filename);
    
    // Ensure upload directory exists
    if (!fs.existsSync(config.UPLOAD_DIR)) {
      fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
    }
    
    // Process image with sharp
    await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);
    
    return {
      success: true,
      filename,
      path: filepath
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

// Create thumbnail
const createThumbnail = async (buffer, filename) => {
  try {
    const thumbFilename = `thumb_${filename}`;
    const thumbPath = path.join(config.UPLOAD_DIR, thumbFilename);
    
    await sharp(buffer)
      .resize(150, 150, {
        fit: 'cover'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);
    
    return {
      success: true,
      filename: thumbFilename,
      path: thumbPath
    };
  } catch (error) {
    throw new Error(`Thumbnail creation failed: ${error.message}`);
  }
};

// Delete image and thumbnail
const deleteImageFiles = (filename) => {
  try {
    const imagePath = path.join(config.UPLOAD_DIR, filename);
    const thumbPath = path.join(config.UPLOAD_DIR, `thumb_${filename}`);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }
    
    return { success: true };
  } catch (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

// Get image info
const getImageInfo = (filename) => {
  try {
    const imagePath = path.join(config.UPLOAD_DIR, filename);
    
    if (!fs.existsSync(imagePath)) {
      return null;
    }
    
    const stats = fs.statSync(imagePath);
    
    return {
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return null;
  }
};

// Clean orphaned images (images not referenced in database)
const cleanOrphanedImages = async () => {
  try {
    const { query } = require('../config/database');
    
    if (!fs.existsSync(config.UPLOAD_DIR)) {
      return { deleted: 0, errors: [] };
    }
    
    // Get all image paths from database
    const components = await query('SELECT image_path FROM components WHERE image_path IS NOT NULL');
    const usedImages = new Set(components.map(c => c.image_path));
    
    // Get all files in upload directory
    const files = fs.readdirSync(config.UPLOAD_DIR);
    
    let deleted = 0;
    const errors = [];
    
    files.forEach(file => {
      // Skip thumbnails, they'll be deleted with their parent
      if (file.startsWith('thumb_')) {
        return;
      }
      
      if (!usedImages.has(file)) {
        try {
          deleteImageFiles(file);
          deleted++;
        } catch (error) {
          errors.push({ file, error: error.message });
        }
      }
    });
    
    return { deleted, errors };
  } catch (error) {
    throw new Error(`Cleanup failed: ${error.message}`);
  }
};

module.exports = {
  processImage,
  createThumbnail,
  deleteImageFiles,
  getImageInfo,
  cleanOrphanedImages
};
