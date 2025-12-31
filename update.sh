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

# 0. Stop Service (Critical for DB integrity during backup)
echo "Stopping service to ensure data integrity..."
pm2 stop inventra || true

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

# Backup Configuration (.env)
if [ -f "$INSTALL_DIR/server/.env" ]; then
    cp "$INSTALL_DIR/server/.env" "$BACKUP_PATH/"
fi

# 2. Update Code
echo "Pulling latest code..."
cd "$INSTALL_DIR"
# Reset hard to force overwrite of local code changes (but not ignored data files)
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
# Restore .env if it was missing after pull (though .gitignore usually protects it)
if [ ! -f "server/.env" ] && [ -f "$BACKUP_PATH/.env" ]; then
    cp "$BACKUP_PATH/.env" server/.env
fi

# 4. Re-install & Re-build
echo "Updating dependencies and rebuilding..."
cd server && npm install
cd ../client && npm install && npm run build

# 5. Restart Service
echo "Restarting service..."
pm2 restart inventra

echo -e "${GREEN}Update Complete! Your data is safe.${NC}"