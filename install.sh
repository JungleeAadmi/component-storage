#!/bin/bash

# Inventra Installer
# Usage: sudo bash install.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       Inventra Installation Setup       ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 1. Check Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo)${NC}"
  exit
fi

# 2. Interactive Timezone Setup
echo -e "${GREEN}[1/7] Setting Timezone...${NC}"
dpkg-reconfigure tzdata

# 3. System Updates & Dependencies
echo -e "${GREEN}[2/7] Updating System & Installing Dependencies...${NC}"
apt-get update && apt-get upgrade -y
apt-get install -y curl git build-essential sqlite3

# Install Node.js 20.x (LTS)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js is already installed."
fi

# 4. Clone/Setup Repository
INSTALL_DIR="/opt/inventra"
REPO_URL="https://github.com/JungleeAadmi/component-storage.git"

echo -e "${GREEN}[3/7] Setting up Directory at ${INSTALL_DIR}...${NC}"

if [ -d "$INSTALL_DIR" ]; then
    echo "Directory exists. Performing update instead..."
    cd "$INSTALL_DIR"
    git pull
else
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 5. Backend Setup
echo -e "${GREEN}[4/7] Installing Backend...${NC}"
cd server
npm install

# Setup .env file
if [ ! -f .env ]; then
    echo "Creating .env configuration..."
    cp .env.example .env
    # Generate a random 32-char secret for JWT
    RANDOM_SECRET=$(openssl rand -hex 32)
    sed -i "s/replace_this_with_a_long_random_string_for_security/$RANDOM_SECRET/" .env
fi
cd ..

# 6. Frontend Setup
echo -e "${GREEN}[5/7] Building Frontend...${NC}"
cd client
npm install
npm run build
cd ..

# 7. Process Management (PM2)
echo -e "${GREEN}[6/7] Configuring Startup Service...${NC}"
npm install -g pm2

# Stop existing if running
pm2 stop inventra 2>/dev/null || true
pm2 delete inventra 2>/dev/null || true

# Start new process
pm2 start server/server.js --name inventra

# Freeze process list for reboot
pm2 save
pm2 startup | bash # This might complain on some systems but usually works to output the command

# 8. Finalizing
IP_ADDR=$(hostname -I | awk '{print $1}')
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}      Installation Complete! 🚀          ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Access Inventra at: http://${IP_ADDR}:5000"
echo -e "To update later, run: sudo bash /opt/inventra/update.sh"