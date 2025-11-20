#!/bin/bash

###############################################################################
# Component Storage - Uninstall Script
# One-line uninstall: curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/uninstall.sh | bash
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

confirm_uninstall() {
    print_header "⚠️  Uninstall Component Storage"
    
    print_message "$YELLOW" "This will remove Component Storage from your system."
    print_message "$YELLOW" "Your data will be permanently deleted!"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm) " -r
    echo
    
    if [ "$REPLY" != "yes" ]; then
        print_message "$BLUE" "Uninstall cancelled"
        exit 0
    fi
}

backup_prompt() {
    print_header "💾 Backup Option"
    
    print_message "$BLUE" "Would you like to backup your database before uninstalling?"
    read -p "Create backup? (Y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        if [ -f "$INSTALL_DIR/data/components.db" ]; then
            BACKUP_FILE="$HOME/component-storage-backup-$(date +%Y%m%d_%H%M%S).db"
            cp "$INSTALL_DIR/data/components.db" "$BACKUP_FILE"
            print_message "$GREEN" "✓ Database backed up to: $BACKUP_FILE"
        else
            print_message "$YELLOW" "⚠️  No database found"
        fi
    fi
}

stop_service() {
    print_header "⏹️  Stopping Service"
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        systemctl stop $SERVICE_NAME
        print_message "$GREEN" "✓ Service stopped"
    else
        print_message "$YELLOW" "⚠️  Service not running"
    fi
}

remove_service() {
    print_header "🗑️  Removing Service"
    
    systemctl disable $SERVICE_NAME 2>/dev/null || true
    rm -f /etc/systemd/system/${SERVICE_NAME}.service
    systemctl daemon-reload
    
    print_message "$GREEN" "✓ Service removed"
}

remove_files() {
    print_header "🗑️  Removing Application Files"
    
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        print_message "$GREEN" "✓ Application files removed"
    else
        print_message "$YELLOW" "⚠️  Installation directory not found"
    fi
}

print_success() {
    print_header "✅ Uninstall Complete"
    
    echo ""
    print_message "$GREEN" "Component Storage has been removed from your system."
    echo ""
    
    if [ -f "$BACKUP_FILE" ]; then
        print_message "$BLUE" "Your database backup is saved at:"
        print_message "$GREEN" "   $BACKUP_FILE"
        echo ""
    fi
    
    print_message "$BLUE" "To reinstall Component Storage:"
    print_message "$GREEN" "   curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/install.sh | bash"
    echo ""
}

main() {
    clear
    check_root
    confirm_uninstall
    backup_prompt
    stop_service
    remove_service
    remove_files
    print_success
}

main
