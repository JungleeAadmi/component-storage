#!/bin/bash

# Inventra Updater
INSTALL_DIR="/opt/inventra"
BACKUP_PATH="/tmp/inventra_backup_$(date +%s)"
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting Inventra Update...${NC}"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "Error: Inventra installation not found at $INSTALL_DIR"
    exit 1
fi

# 1. Backup User Data
echo "Backing up user data to $BACKUP_PATH..."
mkdir -p "$BACKUP_PATH"
# Backup Database
if [ -d "$INSTALL_DIR/server/data" ]; then
    cp -r "$INSTALL_DIR/server/data" "$BACKUP_PATH/"
fi
# Backup Uploaded Images
if [ -d "$INSTALL_DIR/server/uploads" ]; then
    cp -r "$INSTALL_DIR/server/uploads" "$BACKUP_PATH/"
fi

# 2. Update Code
echo "Pulling latest code..."
cd "$INSTALL_DIR"
git reset --hard
git pull

# 3. Restore User Data
echo "Restoring user data..."
# Ensure directories exist
mkdir -p server/data
mkdir -p server/uploads

# Restore files
if [ -d "$BACKUP_PATH/data" ]; then
    cp -r "$BACKUP_PATH/data/"* server/data/ 2>/dev/null || true
fi
if [ -d "$BACKUP_PATH/uploads" ]; then
    cp -r "$BACKUP_PATH/uploads/"* server/uploads/ 2>/dev/null || true
fi

# 4. Re-install & Re-build
echo "Updating dependencies and rebuilding..."
cd server && npm install
cd ../client && npm install && npm run build

# 5. Restart Service
echo "Restarting service..."
pm2 restart inventra

echo -e "${GREEN}Update Complete! Your data is safe.${NC}"