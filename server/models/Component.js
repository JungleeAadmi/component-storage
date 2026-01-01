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
    // We use EXISTS to check if any attachment associated with the component matches the query
    // This prevents duplicate rows if a component has multiple matching attachments
    const sql = `
      SELECT c.*, s.name as section_name, con.name as container_name 
      FROM components c
      JOIN sections s ON c.section_id = s.id
      JOIN containers con ON s.container_id = con.id
      WHERE c.name LIKE ? 
         OR c.specification LIKE ? 
         OR c.custom_data LIKE ?
         OR EXISTS (
            SELECT 1 
            FROM attachments a 
            WHERE a.component_id = c.id 
            AND a.file_path LIKE ?
         )
    `;
    
    const term = `%${query}%`;
    // Pass the search term 4 times: for Name, Spec, Custom Data, and Attachment Path
    return db.prepare(sql).all(term, term, term, term);
  }
};