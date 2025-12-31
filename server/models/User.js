const db = require('../config/db');

module.exports = {
  // Create a new user
  create: (user) => {
    const stmt = db.prepare(`
      INSERT INTO users (username, password, full_name, avatar_url)
      VALUES (@username, @password, @full_name, @avatar_url)
    `);
    return stmt.run(user);
  },

  // Find user by username (for login)
  findByUsername: (username) => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },

  // Get user by ID (for profile)
  findById: (id) => {
    const stmt = db.prepare('SELECT id, username, full_name, avatar_url, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  }
};