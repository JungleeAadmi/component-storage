#!/bin/bash

# Inventra Scaffold Script
# Run this in the root of your git repository.

echo "🚀 Starting Inventra Scaffolding..."

# 1. Root Level Files
echo "Creating Root files..."
touch README.md
echo "// Project documentation and manual" > README.md

touch install.sh
echo "#!/bin/bash
// The main one-line installer script
// Checks apt update/upgrade
// Installs Node.js
// Sets timezone interactively" > install.sh
chmod +x install.sh

touch update.sh
echo "#!/bin/bash
// The updater script
// Backs up DB
// Git pulls
// Restores DB
// Restarts service" > update.sh
chmod +x update.sh

touch .gitignore
echo "node_modules/
.env
/server/uploads
/server/data/*.db" > .gitignore

# 2. Server Structure (Backend)
echo "Creating Server Structure..."
mkdir -p server
cd server

# Server Root Files
touch package.json
echo "// Backend dependencies and scripts" > package.json

touch server.js
echo "// Main entry point for Express Server" > server.js

touch .env.example
echo "// Environment variables template (PORT, JWT_SECRET)" > .env.example

# Server Folders
mkdir -p config controllers models routes middleware utils data uploads

# Config
touch config/db.js
echo "// SQLite connection logic" > config/db.js

# Models
touch models/User.js
echo "// User schema definition" > models/User.js
touch models/Container.js
echo "// Container and Grid schema definition" > models/Container.js
touch models/Component.js
echo "// Component item schema" > models/Component.js

# Controllers
touch controllers/authController.js
echo "// Login, Signup, Profile logic" > controllers/authController.js
touch controllers/inventoryController.js
echo "// Add container, add component, logic" > controllers/inventoryController.js
touch controllers/searchController.js
echo "// Universal search logic" > controllers/searchController.js

# Routes
touch routes/authRoutes.js
echo "// Express router for Auth" > routes/authRoutes.js
touch routes/apiRoutes.js
echo "// Express router for Inventory API" > routes/apiRoutes.js

# Middleware
touch middleware/authMiddleware.js
echo "// JWT verification middleware" > middleware/authMiddleware.js
touch middleware/uploadMiddleware.js
echo "// Multer config for image/pdf uploads" > middleware/uploadMiddleware.js

cd ..

# 3. Client Structure (Frontend)
echo "Creating Client Structure..."
mkdir -p client
cd client

# Client Root Files
touch package.json
echo "// Frontend dependencies" > package.json

touch vite.config.js
echo "// Vite configuration (Proxy setup)" > vite.config.js

touch tailwind.config.js
echo "// Tailwind CSS configuration (Colors, Fonts)" > tailwind.config.js

touch postcss.config.js
echo "// PostCSS config" > postcss.config.js

touch index.html
echo "<!-- Main HTML entry point (Meta tags, PWA icons) -->" > index.html

# Client Source Code
mkdir -p src public
cd src

touch main.jsx
echo "// React Root render" > main.jsx

touch App.jsx
echo "// Main App Component + Routing" > App.jsx

touch index.css
echo "/* Global styles + Tailwind directives + Varela Round import */" > index.css

# Client Folders
mkdir -p assets components pages context hooks utils services

# Assets
touch assets/logo.svg
echo "// SVG Logo placeholder" > assets/logo.svg

# Context (Global State)
touch context/AuthContext.jsx
echo "// User login state management" > context/AuthContext.jsx
touch context/InventoryContext.jsx
echo "// Inventory data state" > context/InventoryContext.jsx

# Services (API Calls)
touch services/api.js
echo "// Axios instance and API helper functions" > services/api.js

# Hooks
touch hooks/useScan.js
echo "// Hook for handling QR scanning" > hooks/useScan.js

# Pages
touch pages/Login.jsx
echo "// Login / Signup Page" > pages/Login.jsx

touch pages/Dashboard.jsx
echo "// Main View: List of Containers" > pages/Dashboard.jsx

touch pages/ContainerView.jsx
echo "// The Grid View (Expands container)" > pages/ContainerView.jsx

touch pages/TrayView.jsx
echo "// Specific Tray view with interactive grid cells" > pages/TrayView.jsx

touch pages/ComponentDetail.jsx
echo "// Add/Edit Component Form" > pages/ComponentDetail.jsx

touch pages/Profile.jsx
echo "// User settings, password change" > pages/Profile.jsx

touch pages/Search.jsx
echo "// Search results page" > pages/Search.jsx

# Components (UI Blocks)
touch components/Navbar.jsx
echo "// Top bar, Logo, Hamburger Menu" > components/Navbar.jsx

touch components/GridRenderer.jsx
echo "// The complex logic to render 6x5 vs 3x3 grids" > components/GridRenderer.jsx

touch components/Scanner.jsx
echo "// QR Code Reader Component" > components/Scanner.jsx

touch components/QRCodeGenerator.jsx
echo "// Generates 2x2cm QR code for print" > components/QRCodeGenerator.jsx

touch components/CameraCapture.jsx
echo "// Native camera interface for component photos" > components/CameraCapture.jsx

cd ../..

echo "✅ Inventra Structure Created Successfully!"
echo "Next Steps:"
echo "1. Upload these files to your GitHub."
echo "2. Open VS Code."
echo "3. Begin implementing the package.json dependencies."
