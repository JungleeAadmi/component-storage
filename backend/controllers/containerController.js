const { query, queryOne, run } = require('../config/database');

// Get all containers
const getAllContainers = async (req, res, next) => {
  try {
    const containers = await query(`
      SELECT * FROM storage_containers
      ORDER BY created_at DESC
    `);
    
    // Get component count for each container
    for (let container of containers) {
      const result = await queryOne(
        'SELECT COUNT(*) as count FROM components WHERE container_id = ?',
        [container.id]
      );
      container.component_count = result.count;
    }
    
    res.json(containers);
  } catch (error) {
    next(error);
  }
};

// Get single container
const getContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const container = await queryOne(
      'SELECT * FROM storage_containers WHERE id = ?',
      [id]
    );
    
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    
    // Get components in this container
    const components = await query(
      'SELECT * FROM components WHERE container_id = ? ORDER BY tray_address',
      [id]
    );
    
    container.components = components;
    
    res.json(container);
  } catch (error) {
    next(error);
  }
};

// Create container
const createContainer = async (req, res, next) => {
  try {
    const {
      name,
      type,
      top_rows,
      top_cols,
      bottom_rows,
      bottom_cols,
      rows,
      cols,
      notes
    } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Container name is required' });
    }
    
    if (!type || !['type1_dual', 'type2_uniform', 'custom'].includes(type)) {
      return res.status(400).json({ error: 'Invalid container type' });
    }
    
    // Validate dimensions based on type
    if (type === 'type1_dual') {
      if (!top_rows || !top_cols || !bottom_rows || !bottom_cols) {
        return res.status(400).json({ 
          error: 'Type 1 containers require top and bottom dimensions' 
        });
      }
    } else if (type === 'type2_uniform' || type === 'custom') {
      if (!rows || !cols) {
        return res.status(400).json({ 
          error: 'Type 2 and custom containers require rows and cols' 
        });
      }
    }
    
    const result = await run(`
      INSERT INTO storage_containers (
        name, type, top_rows, top_cols, bottom_rows, bottom_cols, rows, cols, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      type,
      top_rows || null,
      top_cols || null,
      bottom_rows || null,
      bottom_cols || null,
      rows || null,
      cols || null,
      notes
    ]);
    
    const newContainer = await queryOne(
      'SELECT * FROM storage_containers WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json(newContainer);
  } catch (error) {
    next(error);
  }
};

// Update container
const updateContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      top_rows,
      top_cols,
      bottom_rows,
      bottom_cols,
      rows,
      cols,
      notes
    } = req.body;
    
    const existing = await queryOne(
      'SELECT * FROM storage_containers WHERE id = ?',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Container not found' });
    }
    
    await run(`
      UPDATE storage_containers SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        top_rows = ?,
        top_cols = ?,
        bottom_rows = ?,
        bottom_cols = ?,
        rows = ?,
        cols = ?,
        notes = ?
      WHERE id = ?
    `, [
      name,
      type,
      top_rows,
      top_cols,
      bottom_rows,
      bottom_cols,
      rows,
      cols,
      notes,
      id
    ]);
    
    const updated = await queryOne(
      'SELECT * FROM storage_containers WHERE id = ?',
      [id]
    );
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete container
const deleteContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const container = await queryOne(
      'SELECT * FROM storage_containers WHERE id = ?',
      [id]
    );
    
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    
    // Check if container has components
    const componentCount = await queryOne(
      'SELECT COUNT(*) as count FROM components WHERE container_id = ?',
      [id]
    );
    
    if (componentCount.count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete container with ${componentCount.count} component(s). Please move or delete components first.` 
      });
    }
    
    await run('DELETE FROM storage_containers WHERE id = ?', [id]);
    
    res.json({ message: 'Container deleted successfully', id: parseInt(id) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllContainers,
  getContainer,
  createContainer,
  updateContainer,
  deleteContainer
};
