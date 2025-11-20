const { query, queryOne, run } = require('../config/database');
const fs = require('fs');
const path = require('path');
const config = require('../config/constants');

// Get all components
const getAllComponents = async (req, res, next) => {
  try {
    const components = await query(`
      SELECT 
        c.*,
        sc.name as container_name,
        sc.type as container_type
      FROM components c
      LEFT JOIN storage_containers sc ON c.container_id = sc.id
      ORDER BY c.created_at DESC
    `);
    
    res.json(components);
  } catch (error) {
    next(error);
  }
};

// Get single component
const getComponent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const component = await queryOne(`
      SELECT 
        c.*,
        sc.name as container_name,
        sc.type as container_type
      FROM components c
      LEFT JOIN storage_containers sc ON c.container_id = sc.id
      WHERE c.id = ?
    `, [id]);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    res.json(component);
  } catch (error) {
    next(error);
  }
};

// Create component
const createComponent = async (req, res, next) => {
  try {
    const {
      name,
      quantity = 0,
      min_quantity = 0,
      category,
      custom_category,
      specifications,
      package_type,
      value,
      manufacturer,
      part_number,
      purchase_link,
      price,
      datasheet_url,
      notes,
      container_id,
      tray_address
    } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Component name is required' });
    }
    
    const result = await run(`
      INSERT INTO components (
        name, quantity, min_quantity, category, custom_category,
        specifications, package_type, value, manufacturer, part_number,
        purchase_link, price, datasheet_url, notes, container_id, tray_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      parseInt(quantity) || 0,
      parseInt(min_quantity) || 0,
      category,
      custom_category,
      specifications,
      package_type,
      value,
      manufacturer,
      part_number,
      purchase_link,
      price,
      datasheet_url,
      notes,
      container_id || null,
      tray_address
    ]);
    
    const newComponent = await queryOne('SELECT * FROM components WHERE id = ?', [result.lastID]);
    
    res.status(201).json(newComponent);
  } catch (error) {
    next(error);
  }
};

// Update component
const updateComponent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      quantity,
      min_quantity,
      category,
      custom_category,
      specifications,
      package_type,
      value,
      manufacturer,
      part_number,
      purchase_link,
      price,
      datasheet_url,
      notes,
      container_id,
      tray_address,
      image_path
    } = req.body;
    
    // Check if component exists
    const existing = await queryOne('SELECT * FROM components WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    await run(`
      UPDATE components SET
        name = COALESCE(?, name),
        quantity = COALESCE(?, quantity),
        min_quantity = COALESCE(?, min_quantity),
        category = COALESCE(?, category),
        custom_category = ?,
        specifications = ?,
        package_type = ?,
        value = ?,
        manufacturer = ?,
        part_number = ?,
        purchase_link = ?,
        price = ?,
        datasheet_url = ?,
        notes = ?,
        container_id = ?,
        tray_address = ?,
        image_path = COALESCE(?, image_path)
      WHERE id = ?
    `, [
      name,
      quantity !== undefined ? parseInt(quantity) : null,
      min_quantity !== undefined ? parseInt(min_quantity) : null,
      category,
      custom_category,
      specifications,
      package_type,
      value,
      manufacturer,
      part_number,
      purchase_link,
      price,
      datasheet_url,
      notes,
      container_id,
      tray_address,
      image_path,
      id
    ]);
    
    const updated = await queryOne('SELECT * FROM components WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Update component quantity
const updateQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }
    
    const component = await queryOne('SELECT * FROM components WHERE id = ?', [id]);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    await run('UPDATE components SET quantity = ? WHERE id = ?', [parseInt(quantity), id]);
    
    const updated = await queryOne('SELECT * FROM components WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete component
const deleteComponent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const component = await queryOne('SELECT * FROM components WHERE id = ?', [id]);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    // Delete associated image if exists
    if (component.image_path) {
      const imagePath = path.join(config.UPLOAD_DIR, component.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await run('DELETE FROM components WHERE id = ?', [id]);
    
    res.json({ message: 'Component deleted successfully', id: parseInt(id) });
  } catch (error) {
    next(error);
  }
};

// Search components
const searchComponents = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return getAllComponents(req, res, next);
    }
    
    const searchTerm = `%${q.trim()}%`;
    
    const components = await query(`
      SELECT 
        c.*,
        sc.name as container_name,
        sc.type as container_type
      FROM components c
      LEFT JOIN storage_containers sc ON c.container_id = sc.id
      WHERE 
        c.name LIKE ? OR
        c.category LIKE ? OR
        c.custom_category LIKE ? OR
        c.value LIKE ? OR
        c.manufacturer LIKE ? OR
        c.part_number LIKE ? OR
        c.specifications LIKE ? OR
        c.tray_address LIKE ? OR
        sc.name LIKE ?
      ORDER BY c.created_at DESC
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
    
    res.json(components);
  } catch (error) {
    next(error);
  }
};

// Get low stock components
const getLowStock = async (req, res, next) => {
  try {
    const components = await query(`
      SELECT 
        c.*,
        sc.name as container_name,
        sc.type as container_type
      FROM components c
      LEFT JOIN storage_containers sc ON c.container_id = sc.id
      WHERE c.quantity <= c.min_quantity AND c.min_quantity > 0
      ORDER BY c.quantity ASC
    `);
    
    res.json(components);
  } catch (error) {
    next(error);
  }
};

// Get statistics
const getStatistics = async (req, res, next) => {
  try {
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total_components,
        SUM(quantity) as total_quantity,
        COUNT(DISTINCT category) as total_categories,
        COUNT(CASE WHEN quantity <= min_quantity AND min_quantity > 0 THEN 1 END) as low_stock_count
      FROM components
    `);
    
    const categories = await query(`
      SELECT 
        COALESCE(custom_category, category) as category,
        COUNT(*) as count
      FROM components
      WHERE category IS NOT NULL OR custom_category IS NOT NULL
      GROUP BY COALESCE(custom_category, category)
      ORDER BY count DESC
      LIMIT 10
    `);
    
    res.json({
      ...stats,
      top_categories: categories
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllComponents,
  getComponent,
  createComponent,
  updateComponent,
  updateQuantity,
  deleteComponent,
  searchComponents,
  getLowStock,
  getStatistics
};
