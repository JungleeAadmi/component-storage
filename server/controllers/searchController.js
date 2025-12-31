const Component = require('../models/Component');

exports.globalSearch = (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const results = Component.search(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};