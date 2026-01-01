const db = require('../config/db');

module.exports = {
  // Add a component
  create: (comp) => {
    const stmt = db.prepare(`
      INSERT INTO components (section_id, grid_position, name, quantity, specification, custom_data, image_url, purchase_link)
      VALUES (@section_id, @grid_position, @name, @quantity, @specification, @custom_data, @image_url, @purchase_link)
    `);
    return stmt.run(comp);
  },

  // Get components for a specific Section (Tray)
  getBySection: (sectionId) => {
    return db.prepare('SELECT * FROM components WHERE section_id = ?').all(sectionId);
  },

  // Universal Search
  search: (query) => {
    const sql = `
      SELECT c.*, s.name as section_name, con.name as container_name 
      FROM components c
      JOIN sections s ON c.section_id = s.id
      JOIN containers con ON s.container_id = con.id
      WHERE c.name LIKE ? 
         OR c.specification LIKE ? 
         OR c.custom_data LIKE ?
    `;
    // Bind the query parameter to Name, Specification, and Custom Data (Sub-items/Notes)
    return db.prepare(sql).all(`%${query}%`, `%${query}%`, `%${query}%`);
  }
};