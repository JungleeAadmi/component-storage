#!/bin/bash

# Inventra Robust Updater
INSTALL_DIR="/opt/inventra"
BACKUP_PATH="/tmp/inventra_backup_$(date +%s)"
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting Inventra Force Update...${NC}"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "Error: Inventra installation not found at $INSTALL_DIR"
    exit 1
fi

# 1. Stop Service
echo "Stopping service..."
pm2 stop inventra || true

# 2. Backup User Data
echo "Backing up data..."
mkdir -p "$BACKUP_PATH"
[ -d "$INSTALL_DIR/server/data" ] && cp -r "$INSTALL_DIR/server/data" "$BACKUP_PATH/"
[ -d "$INSTALL_DIR/server/uploads" ] && cp -r "$INSTALL_DIR/server/uploads" "$BACKUP_PATH/"
[ -f "$INSTALL_DIR/server/.env" ] && cp "$INSTALL_DIR/server/.env" "$BACKUP_PATH/"

# 3. Pull Code
echo "Pulling latest code..."
cd "$INSTALL_DIR"
git reset --hard
git pull

# 4. Restore Data
echo "Restoring data..."
mkdir -p server/data server/uploads
[ -d "$BACKUP_PATH/data" ] && cp -r "$BACKUP_PATH/data/"* server/data/ 2>/dev/null || true
[ -d "$BACKUP_PATH/uploads" ] && cp -r "$BACKUP_PATH/uploads/"* server/uploads/ 2>/dev/null || true
[ -f "$BACKUP_PATH/.env" ] && cp "$BACKUP_PATH/.env" server/.env

# 5. SERVER: Clean Install
echo "Installing Backend..."
cd server
rm -rf node_modules package-lock.json
npm install

# 6. CLIENT: Clean Build (The Critical Step)
echo "Building Frontend (Fresh)..."
cd ../client
rm -rf node_modules package-lock.json dist
npm install
npm run build

# Verify Build
if [ ! -d "dist" ]; then
  echo "❌ Error: Frontend build failed. 'dist' folder missing."
  exit 1
fi

# 7. Restart
echo "Restarting application..."
pm2 restart inventra

echo -e "${GREEN} Update Complete!${NC}"