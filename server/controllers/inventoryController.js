const Container = require('../models/Container');
const Component = require('../models/Component');
const db = require('../config/db'); // Needed for transactions if we get complex

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
  // config expected format: [{ name: 'Top', rows: 6, cols: 5 }, { name: 'Bot', rows: 3, cols: 3 }]

  try {
    // 1. Create Container
    const containerResult = Container.createContainer(name, description);
    const containerId = containerResult.lastInsertRowid;

    // 2. Create Sections
    if (config && Array.isArray(config)) {
      config.forEach((section, index) => {
        // Generate designation char (A, B, C...)
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

// --- Components ---

exports.getComponentsBySection = (req, res) => {
  try {
    const components = Component.getBySection(req.params.sectionId);
    res.json(components);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComponent = (req, res) => {
  // req.file is available thanks to multer middleware
  const { section_id, grid_position, name, quantity, specification, purchase_link, custom_data } = req.body;
  
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  try {
    const result = Component.create({
      section_id,
      grid_position,
      name,
      quantity,
      specification,
      custom_data: JSON.stringify(custom_data || {}),
      image_url: imageUrl,
      purchase_link
    });
    
    res.status(201).json({ message: 'Component added', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};