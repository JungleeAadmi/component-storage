const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load env vars - FIX: Explicitly point to the .env file in the server directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Import DB config
require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Serve Uploaded Images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Serve Frontend Static Files (Built React App)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', apiRoutes);

// 3. Handle React Routing (Catch-all)
// Any request that isn't an API call or static file goes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});