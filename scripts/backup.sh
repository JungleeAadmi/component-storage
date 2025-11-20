#!/bin/bash

###############################################################################
# Component Storage - Manual Backup Script
# Usage: /opt/component-storage/scripts/backup.sh
###############################################################################

INSTALL_DIR="/opt/component-storage"
BACKUP_DIR="$INSTALL_DIR/backups"
DATABASE_PATH="$INSTALL_DIR/data/components.db"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Create backup
if [ ! -f "$DATABASE_PATH" ]; then
    echo -e "${RED}❌ Database not found${NC}"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/manual-backup-$TIMESTAMP.db"

cp "$DATABASE_PATH" "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo -e "${GREEN}✓ Backup created successfully${NC}"
echo "  File: $BACKUP_FILE"
echo "  Size: $SIZE"
