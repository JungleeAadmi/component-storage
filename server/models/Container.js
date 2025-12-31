const db = require('../config/db');

module.exports = {
  // --- Container Operations ---
  createContainer: (name, description) => {
    const stmt = db.prepare('INSERT INTO containers (name, description) VALUES (?, ?)');
    return stmt.run(name, description);
  },

  getAllContainers: () => {
    return db.prepare('SELECT * FROM containers ORDER BY created_at DESC').all();
  },

  getContainerById: (id) => {
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
    if (!container) return null;
    // Also fetch its sections
    const sections = db.prepare('SELECT * FROM sections WHERE container_id = ?').all(id);
    return { ...container, sections };
  },

  // --- Section (Tray) Operations ---
  createSection: (section) => {
    const stmt = db.prepare(`
      INSERT INTO sections (container_id, name, config_type, rows, cols, designation_char)
      VALUES (@container_id, @name, @config_type, @rows, @cols, @designation_char)
    `);
    return stmt.run(section);
  },

  getSectionById: (id) => {
    return db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
  }
};