#!/bin/bash

###############################################################################
# Component Storage - Update Script
# One-line update: curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/update.sh | sudo bash
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/opt/component-storage"
SERVICE_NAME="component-storage"
BACKUP_DIR="$INSTALL_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$BLUE" "$@"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_message "$RED" "❌ This script must be run as root (use sudo)"
        exit 1
    fi
}

check_installation() {
    if [ ! -d "$INSTALL_DIR" ]; then
        print_message "$RED" "❌ Component Storage is not installed"
        print_message "$YELLOW" "   Run the install script first"
        exit 1
    fi
}

update_system() {
    print_header "🔄 Updating System Packages"
    
    # Detect OS
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    fi
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        print_message "$CYAN" "Updating package lists..."
        apt-get update -qq
        
        print_message "$CYAN" "Upgrading packages..."
        DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
        
        print_message "$GREEN" "✓ System packages updated"
    else
        print_message "$YELLOW" "⚠️  Unknown OS, skipping system update"
    fi
}

backup_user_data() {
    print_header "💾 Backing Up User Data"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [ -f "$INSTALL_DIR/data/components.db" ]; then
        cp "$INSTALL_DIR/data/components.db" "$BACKUP_DIR/components-$TIMESTAMP.db"
        print_message "$GREEN" "✓ Database backed up"
    else
        print_message "$YELLOW" "⚠️  No database found"
    fi
    
    # Backup uploaded images
    if [ -d "$INSTALL_DIR/data/uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" -C "$INSTALL_DIR/data" uploads
        print_message "$GREEN" "✓ Uploaded images backed up"
    else
        print_message "$YELLOW" "⚠️  No uploads directory found"
    fi
    
    # Backup environment file if exists
    if [ -f "$INSTALL_DIR/backend/.env" ]; then
        cp "$INSTALL_DIR/backend/.env" "$BACKUP_DIR/.env-$TIMESTAMP"
        print_message "$GREEN" "✓ Environment config backed up"
    fi
    
    # Keep only last 10 backups
    cd "$BACKUP_DIR"
    ls -t components-*.db 2>/dev/null | tail -n +11 | xargs -r rm
    ls -t uploads-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
    
    print_message "$CYAN" "📂 Backup location: $BACKUP_DIR"
}

stop_service() {
    print_header "⏸️  Stopping Service"
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        systemctl stop $SERVICE_NAME
        print_message "$GREEN" "✓ Service stopped"
    else
        print_message "$YELLOW" "⚠️  Service not running"
    fi
}

preserve_user_data() {
    print_header "🔒 Preserving User Data"
    
    # Create temporary directory for user data
    TEMP_DATA="/tmp/component-storage-data-$TIMESTAMP"
    mkdir -p "$TEMP_DATA"
    
    # Preserve database
    if [ -f "$INSTALL_DIR/data/components.db" ]; then
        cp "$INSTALL_DIR/data/components.db" "$TEMP_DATA/components.db"
        print_message "$GREEN" "✓ Database preserved"
    fi
    
    # Preserve uploads
    if [ -d "$INSTALL_DIR/data/uploads" ]; then
        cp -r "$INSTALL_DIR/data/uploads" "$TEMP_DATA/uploads"
        print_message "$GREEN" "✓ Uploads preserved"
    fi
    
    # Preserve .env
    if [ -f "$INSTALL_DIR/backend/.env" ]; then
        cp "$INSTALL_DIR/backend/.env" "$TEMP_DATA/.env"
        print_message "$GREEN" "✓ Environment config preserved"
    fi
}

pull_updates() {
    print_header "📥 Pulling Latest Updates"
    
    cd "$INSTALL_DIR"
    
    # Check if there are local changes
    if ! git diff-index --quiet HEAD --; then
        print_message "$YELLOW" "⚠️  Local changes detected, stashing..."
        git stash
    fi
    
    # Pull latest code
    git pull origin main
    
    print_message "$GREEN" "✓ Code updated"
}

restore_user_data() {
    print_header "📥 Restoring User Data"
    
    TEMP_DATA="/tmp/component-storage-data-$TIMESTAMP"
    
    # Ensure data directory exists
    mkdir -p "$INSTALL_DIR/data"
    
    # Restore database
    if [ -f "$TEMP_DATA/components.db" ]; then
        cp "$TEMP_DATA/components.db" "$INSTALL_DIR/data/components.db"
        print_message "$GREEN" "✓ Database restored"
    fi
    
    # Restore uploads
    if [ -d "$TEMP_DATA/uploads" ]; then
        cp -r "$TEMP_DATA/uploads" "$INSTALL_DIR/data/"
        print_message "$GREEN" "✓ Uploads restored"
    fi
    
    # Restore .env
    if [ -f "$TEMP_DATA/.env" ]; then
        cp "$TEMP_DATA/.env" "$INSTALL_DIR/backend/.env"
        print_message "$GREEN" "✓ Environment config restored"
    fi
    
    # Set proper permissions
    chown -R root:root "$INSTALL_DIR/data"
    chmod -R 755 "$INSTALL_DIR/data"
    
    # Clean up temp directory
    rm -rf "$TEMP_DATA"
    
    print_message "$GREEN" "✓ All user data restored"
}

update_dependencies() {
    print_header "📦 Updating Dependencies"
    
    cd "$INSTALL_DIR/backend"
    npm install --production --silent
    print_message "$GREEN" "✓ Backend dependencies updated"
    
    cd "$INSTALL_DIR/frontend"
    npm install --silent
    print_message "$GREEN" "✓ Frontend dependencies updated"
}

rebuild_frontend() {
    print_header "🏗️  Rebuilding Frontend"
    
    cd "$INSTALL_DIR/frontend"
    npm run build
    
    print_message "$GREEN" "✓ Frontend rebuilt"
}

run_migrations() {
    print_header "🗄️  Running Database Migrations"
    
    cd "$INSTALL_DIR/backend"
    
    if [ -f "migrations/migrate.js" ]; then
        node migrations/migrate.js
        print_message "$GREEN" "✓ Migrations completed"
    else
        print_message "$YELLOW" "⚠️  No migrations found, skipping"
    fi
}

start_service() {
    print_header "▶️  Starting Service"
    
    systemctl daemon-reload
    systemctl start $SERVICE_NAME
    sleep 3
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        print_message "$GREEN" "✓ Service started successfully"
    else
        print_message "$RED" "❌ Service failed to start"
        print_message "$YELLOW" "   Check logs with: journalctl -u $SERVICE_NAME -f"
        print_message "$YELLOW" "   Your data is safe in: $BACKUP_DIR"
        exit 1
    fi
}

verify_data() {
    print_header "🔍 Verifying Data Integrity"
    
    if [ -f "$INSTALL_DIR/data/components.db" ]; then
        # Check if database is valid SQLite
        if sqlite3 "$INSTALL_DIR/data/components.db" "SELECT COUNT(*) FROM components;" >/dev/null 2>&1; then
            COMPONENT_COUNT=$(sqlite3 "$INSTALL_DIR/data/components.db" "SELECT COUNT(*) FROM components;")
            CONTAINER_COUNT=$(sqlite3 "$INSTALL_DIR/data/components.db" "SELECT COUNT(*) FROM storage_containers;")
            print_message "$GREEN" "✓ Database is valid"
            print_message "$CYAN" "  Components: $COMPONENT_COUNT"
            print_message "$CYAN" "  Containers: $CONTAINER_COUNT"
        else
            print_message "$RED" "❌ Database verification failed"
            print_message "$YELLOW" "   Backup available at: $BACKUP_DIR"
        fi
    fi
}

print_success() {
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    print_header "✅ Update Complete!"
    
    echo ""
    print_message "$GREEN" "🎉 Component Storage has been updated successfully!"
    echo ""
    print_message "$BLUE" "📍 Access your application at:"
    print_message "$GREEN" "   http://$SERVER_IP:3210"
    echo ""
    print_message "$BLUE" "💾 Your data is safe:"
    print_message "$CYAN" "   All components, containers, and images preserved"
    print_message "$CYAN" "   Backup location: $BACKUP_DIR"
    echo ""
    print_message "$BLUE" "📊 Useful commands:"
    echo "   View logs:    journalctl -u $SERVICE_NAME -f"
    echo "   Stop service: systemctl stop $SERVICE_NAME"
    echo "   Restart:      systemctl restart $SERVICE_NAME"
    echo ""
}

main() {
    clear
    print_header "🔄 Component Storage - Update"
    
    check_root
    check_installation
    update_system
    backup_user_data
    stop_service
    preserve_user_data
    pull_updates
    restore_user_data
    update_dependencies
    rebuild_frontend
    run_migrations
    start_service
    verify_data
    print_success
}

main
