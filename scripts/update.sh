#!/bin/bash

###############################################################################
# Component Storage - Update Script
# One-line update: curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/update.sh | bash
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/component-storage"
SERVICE_NAME="component-storage"
BACKUP_DIR="$INSTALL_DIR/backups"

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

backup_database() {
    print_header "💾 Backing Up Database"
    
    if [ -f "$INSTALL_DIR/data/components.db" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="$BACKUP_DIR/pre-update-$TIMESTAMP.db"
        
        mkdir -p "$BACKUP_DIR"
        cp "$INSTALL_DIR/data/components.db" "$BACKUP_FILE"
        
        print_message "$GREEN" "✓ Database backed up to: $BACKUP_FILE"
    else
        print_message "$YELLOW" "⚠️  No database found, skipping backup"
    fi
}

stop_service() {
    print_header "⏸️  Stopping Service"
    
    systemctl stop $SERVICE_NAME
    print_message "$GREEN" "✓ Service stopped"
}

pull_updates() {
    print_header "📥 Pulling Latest Updates"
    
    cd "$INSTALL_DIR"
    
    # Stash local changes if any
    git stash
    
    # Pull latest code
    git pull origin main
    
    print_message "$GREEN" "✓ Code updated"
}

update_dependencies() {
    print_header "📦 Updating Dependencies"
    
    cd "$INSTALL_DIR/backend"
    npm install --production
    print_message "$GREEN" "✓ Backend dependencies updated"
    
    cd "$INSTALL_DIR/frontend"
    npm install
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
    node migrations/migrate.js
    
    print_message "$GREEN" "✓ Migrations completed"
}

start_service() {
    print_header "▶️  Starting Service"
    
    systemctl start $SERVICE_NAME
    sleep 3
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        print_message "$GREEN" "✓ Service started successfully"
    else
        print_message "$RED" "❌ Service failed to start"
        print_message "$YELLOW" "   Check logs with: journalctl -u $SERVICE_NAME -f"
        print_message "$YELLOW" "   Rolling back..."
        
        # Attempt rollback
        systemctl stop $SERVICE_NAME
        git reset --hard HEAD~1
        systemctl start $SERVICE_NAME
        
        exit 1
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
    print_message "$BLUE" "📊 View logs:"
    echo "   journalctl -u $SERVICE_NAME -f"
    echo ""
}

main() {
    clear
    print_header "🔄 Component Storage - Update"
    
    check_root
    check_installation
    backup_database
    stop_service
    pull_updates
    update_dependencies
    rebuild_frontend
    run_migrations
    start_service
    print_success
}

main

