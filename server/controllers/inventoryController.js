const Container = require('../models/Container');
const Component = require('../models/Component');
const db = require('../config/db');

// --- Containers ---

exports.getContainers = (req, res) => {
  try {
    const containers = Container.getAllContainers();
    res.json(containers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getContainerById = (req, res) => {
  try {
    const container = Container.getContainerById(req.params.id);
    if (container) {
      res.json(container);
    } else {
      res.status(404).json({ message: 'Container not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createContainer = (req, res) => {
  const { name, description, config } = req.body;
  try {
    const containerResult = Container.createContainer(name, description);
    const containerId = containerResult.lastInsertRowid;

    if (config && Array.isArray(config)) {
      config.forEach((section, index) => {
        const char = String.fromCharCode(65 + index);
        Container.createSection({
          container_id: containerId,
          name: section.name,
          config_type: 'grid',
          rows: section.rows,
          cols: section.cols,
          designation_char: char
        });
      });
    }
    res.status(201).json({ message: 'Container created', id: containerId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateContainer = (req, res) => {
  const { name, description, config } = req.body;
  const { id } = req.params;
  
  try {
    // Update basic info
    const stmt = db.prepare('UPDATE containers SET name = ?, description = ? WHERE id = ?');
    stmt.run(name, description, id);

    // Handle Sections (Add new ones, Update existing names)
    // NOTE: Changing rows/cols of existing sections is dangerous for existing items. 
    // We will allow adding new sections or renaming.
    if (config && Array.isArray(config)) {
      config.forEach((section) => {
        if (section.id) {
          // Update existing
          // We only update name to be safe. Updating grid size requires complex logic not safely handled in one go.
          const updateSec = db.prepare('UPDATE sections SET name = ? WHERE id = ?');
          updateSec.run(section.name, section.id);
        } else {
          // Add new
          // Determine next char? 
          // Simple approach: get count
          const count = db.prepare('SELECT COUNT(*) as c FROM sections WHERE container_id = ?').get(id).c;
          const char = String.fromCharCode(65 + count); // logic might need improvement for mixed updates but works for appending
          
          Container.createSection({
            container_id: id,
            name: section.name,
            config_type: 'grid',
            rows: section.rows,
            cols: section.cols,
            designation_char: char
          });
        }
      });
    }

    res.json({ message: 'Container updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteContainer = (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM containers WHERE id = ?');
    const result = stmt.run(req.params.id);
    if (result.changes > 0) {
      res.json({ message: 'Container removed' });
    } else {
      res.status(404).json({ message: 'Container not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Sections ---

exports.getSectionById = (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM sections WHERE id = ?');
    const section = stmt.get(req.params.id);
    if (section) {
      res.json(section);
    } else {
      res.status(404).json({ message: 'Section not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Components ---

exports.getComponentsBySection = (req, res) => {
  try {
    const components = Component.getBySection(req.params.sectionId);
    res.json(components);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComponentById = (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM components WHERE id = ?');
    const component = stmt.get(req.params.id);
    if (component) {
        try { component.custom_data = JSON.parse(component.custom_data); } catch(e) {}
        
        // Fetch attachments
        const attachments = db.prepare('SELECT * FROM attachments WHERE component_id = ?').all(req.params.id);
        component.attachments = attachments;
        
        res.json(component);
    } else {
        res.status(404).json({ message: 'Component not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComponent = (req, res) => {
  const { section_id, grid_position, name, quantity, specification, purchase_link, custom_data } = req.body;
  
  // Handle main image
  const mainImage = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';

  try {
    const result = Component.create({
      section_id,
      grid_position,
      name,
      quantity,
      specification,
      custom_data: custom_data, 
      image_url: mainImage,
      purchase_link
    });
    
    const componentId = result.lastInsertRowid;

    // Handle Attachments
    if (req.files['attachments']) {
      const insertAttach = db.prepare('INSERT INTO attachments (component_id, file_path, file_type) VALUES (?, ?, ?)');
      req.files['attachments'].forEach(file => {
        insertAttach.run(componentId, `/uploads/${file.filename}`, file.mimetype);
      });
    }

    res.status(201).json({ message: 'Component added', id: componentId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComponent = (req, res) => {
  const { name, quantity, specification, purchase_link, custom_data } = req.body;
  const id = req.params.id;
  
  try {
    let imageUrl = null;
    if (req.files['image']) {
      imageUrl = `/uploads/${req.files['image'][0].filename}`;
    }

    const current = db.prepare('SELECT image_url FROM components WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ message: 'Component not found' });

    const finalImage = imageUrl || current.image_url;

    const stmt = db.prepare(`
      UPDATE components 
      SET name = ?, quantity = ?, specification = ?, purchase_link = ?, custom_data = ?, image_url = ?
      WHERE id = ?
    `);
    
    stmt.run(name, quantity, specification, purchase_link, custom_data, finalImage, id);

    // Handle New Attachments
    if (req.files['attachments']) {
      const insertAttach = db.prepare('INSERT INTO attachments (component_id, file_path, file_type) VALUES (?, ?, ?)');
      req.files['attachments'].forEach(file => {
        insertAttach.run(id, `/uploads/${file.filename}`, file.mimetype);
      });
    }

    res.json({ message: 'Component updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComponent = (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM components WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Component deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};