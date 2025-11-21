const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/components - Get all components
router.get('/', async (req, res) => {
  try {
    const components = await db.all(
      `SELECT c.*, sc.name as container_name 
       FROM components c 
       LEFT JOIN storage_containers sc ON c.container_id = sc.id 
       ORDER BY c.created_at DESC`
    );
    res.json(components);
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

// GET /api/components/search - Search components
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;
    const components = await db.all(
      `SELECT c.*, sc.name as container_name 
       FROM components c 
       LEFT JOIN storage_containers sc ON c.container_id = sc.id 
       WHERE c.name LIKE ? 
          OR c.category LIKE ? 
          OR c.part_number LIKE ? 
          OR c.manufacturer LIKE ?
          OR c.value LIKE ?
          OR sc.name LIKE ?
       ORDER BY c.name`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );
    res.json(components);
  } catch (error) {
    console.error('Error searching components:', error);
    res.status(500).json({ error: 'Failed to search components' });
  }
});

// GET /api/components/:id - Get single component
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await db.get(
      `SELECT c.*, sc.name as container_name 
       FROM components c 
       LEFT JOIN storage_containers sc ON c.container_id = sc.id 
       WHERE c.id = ?`,
      [id]
    );
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    res.json(component);
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({ error: 'Failed to fetch component' });
  }
});

// POST /api/components - Create new component
router.post('/', async (req, res) => {
  try {
    const {
      name,
      quantity,
      min_quantity,
      category,
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

    const result = await db.run(
      `INSERT INTO components (
        name, quantity, min_quantity, category, specifications, 
        package_type, value, manufacturer, part_number, purchase_link, 
        price, datasheet_url, notes, container_id, tray_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        quantity || 0,
        min_quantity || 0,
        category,
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
      ]
    );

    const component = await db.get(
      `SELECT c.*, sc.name as container_name 
       FROM components c 
       LEFT JOIN storage_containers sc ON c.container_id = sc.id 
       WHERE c.id = ?`,
      [result.lastID]
    );

    res.status(201).json(component);
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

// PUT /api/components/:id - Update component
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      quantity,
      min_quantity,
      category,
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

    const result = await db.run(
      `UPDATE components SET 
        name = ?,
        quantity = ?,
        min_quantity = ?,
        category = ?,
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name,
        quantity,
        min_quantity,
        category,
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
        id
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Get updated component
    const component = await db.get(
      `SELECT c.*, sc.name as container_name 
       FROM components c 
       LEFT JOIN storage_containers sc ON c.container_id = sc.id 
       WHERE c.id = ?`,
      [id]
    );

    res.json(component);
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
});

// PATCH /api/components/:id/quantity - Update component quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const result = await db.run(
      'UPDATE components SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = await db.get(
      `SELECT c.*, sc.name as container_name 
       FROM components c 
       LEFT JOIN storage_containers sc ON c.container_id = sc.id 
       WHERE c.id = ?`,
      [id]
    );

    res.json(component);
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

// DELETE /api/components/:id - Delete component
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.run('DELETE FROM components WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

module.exports = router;
