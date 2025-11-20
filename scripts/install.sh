#!/bin/bash

###############################################################################
# Component Storage - Installation Script
# One-line install: curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/install.sh | bash
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/component-storage"
SERVICE_NAME="component-storage"
PORT=3210
NODE_VERSION="18"

# Print colored message
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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_message "$RED" "❌ This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_header "🔍 Checking System Requirements"
    
    # Check if Debian/Ubuntu
    if [ -f /etc/debian_version ]; then
        print_message "$GREEN" "✓ Debian/Ubuntu detected"
    else
        print_message "$YELLOW" "⚠️  Warning: This script is designed for Debian/Ubuntu"
        print_message "$YELLOW" "   It may work on other systems but is not tested"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check disk space (need at least 500MB)
    available_space=$(df / | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 500000 ]; then
        print_message "$RED" "❌ Insufficient disk space (need at least 500MB)"
        exit 1
    fi
    print_message "$GREEN" "✓ Sufficient disk space available"
    
    # Check if port is available
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        print_message "$RED" "❌ Port $PORT is already in use"
        print_message "$YELLOW" "   Please stop the service using this port or change the PORT in this script"
        exit 1
    fi
    print_message "$GREEN" "✓ Port $PORT is available"
}

# Install Node.js if not present
install_nodejs() {
    print_header "📦 Installing Node.js"
    
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            print_message "$GREEN" "✓ Node.js $(node -v) already installed"
            return
        fi
        print_message "$YELLOW" "⚠️  Node.js version too old, installing newer version..."
    fi
    
    # Install Node.js using NodeSource
    print_message "$BLUE" "Installing Node.js ${NODE_VERSION}.x..."
    
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    print_message "$GREEN" "✓ Node.js $(node -v) installed"
    print_message "$GREEN" "✓ npm $(npm -v) installed"
}

# Install system dependencies
install_dependencies() {
    print_header "📦 Installing System Dependencies"
    
    apt-get update -qq
    apt-get install -y git curl wget build-essential sqlite3 netcat-openbsd
    
    print_message "$GREEN" "✓ System dependencies installed"
}

# Clone or update repository
setup_application() {
    print_header "📥 Setting Up Application"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_message "$YELLOW" "⚠️  Installation directory already exists"
        read -p "Remove and reinstall? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            systemctl stop $SERVICE_NAME 2>/dev/null || true
            rm -rf "$INSTALL_DIR"
        else
            print_message "$RED" "Installation cancelled"
            exit 1
        fi
    fi
    
    print_message "$BLUE" "Cloning repository..."
    git clone https://github.com/JungleeAadmi/component-storage.git "$INSTALL_DIR"
    
    cd "$INSTALL_DIR"
    
    print_message "$GREEN" "✓ Application files downloaded"
}

# Install npm dependencies
install_npm_dependencies() {
    print_header "📦 Installing Application Dependencies"
    
    cd "$INSTALL_DIR"
    
    print_message "$BLUE" "Installing backend dependencies..."
    cd backend
    npm install --production
    
    print_message "$GREEN" "✓ Backend dependencies installed"
    
    print_message "$BLUE" "Installing frontend dependencies..."
    cd ../frontend
    npm install
    
    print_message "$GREEN" "✓ Frontend dependencies installed"
}

# Build frontend
build_frontend() {
    print_header "🏗️  Building Frontend"
    
    cd "$INSTALL_DIR/frontend"
    
    print_message "$BLUE" "Building production frontend..."
    npm run build
    
    print_message "$GREEN" "✓ Frontend built successfully"
}

# Setup environment
setup_environment() {
    print_header "⚙️  Configuring Environment"
    
    cd "$INSTALL_DIR/backend"
    
    if [ ! -f .env ]; then
        cp .env.example .env
        
        # Update .env with production values
        sed -i "s|NODE_ENV=development|NODE_ENV=production|g" .env
        sed -i "s|DATABASE_PATH=.*|DATABASE_PATH=$INSTALL_DIR/data/components.db|g" .env
        sed -i "s|UPLOAD_DIR=.*|UPLOAD_DIR=$INSTALL_DIR/uploads|g" .env
        sed -i "s|BACKUP_DIR=.*|BACKUP_DIR=$INSTALL_DIR/backups|g" .env
        sed -i "s|PORT=.*|PORT=$PORT|g" .env
        
        print_message "$GREEN" "✓ Environment configured"
    else
        print_message "$YELLOW" "⚠️  .env already exists, skipping"
    fi
    
    # Create required directories
    mkdir -p "$INSTALL_DIR/data"
    mkdir -p "$INSTALL_DIR/uploads"
    mkdir -p "$INSTALL_DIR/backups"
    mkdir -p "$INSTALL_DIR/logs"
    
    print_message "$GREEN" "✓ Directories created"
}

# Initialize database
initialize_database() {
    print_header "🗄️  Initializing Database"
    
    cd "$INSTALL_DIR/backend"
    
    print_message "$BLUE" "Running database migrations..."
    node migrations/migrate.js
    
    print_message "$GREEN" "✓ Database initialized"
}

# Create systemd service
create_service() {
    print_header "🔧 Creating Systemd Service"
    
    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Component Storage - Electronic Component Inventory System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=component-storage

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    print_message "$GREEN" "✓ Systemd service created"
}

# Start service
start_service() {
    print_header "🚀 Starting Service"
    
    systemctl start $SERVICE_NAME
    sleep 3
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        print_message "$GREEN" "✓ Service started successfully"
    else
        print_message "$RED" "❌ Service failed to start"
        print_message "$YELLOW" "Check logs with: journalctl -u $SERVICE_NAME -f"
        exit 1
    fi
}

# Get server IP
get_server_ip() {
    # Try to get primary IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"
    fi
    
    echo "$SERVER_IP"
}

# Print success message
print_success() {
    SERVER_IP=$(get_server_ip)
    
    print_header "✅ Installation Complete!"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$GREEN" "🎉 Component Storage is now running!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_message "$BLUE" "📍 Access your application at:"
    print_message "$GREEN" "   http://$SERVER_IP:$PORT"
    echo ""
    print_message "$BLUE" "📂 Installation directory:"
    print_message "$GREEN" "   $INSTALL_DIR"
    echo ""
    print_message "$BLUE" "📊 Useful commands:"
    echo "   View logs:        journalctl -u $SERVICE_NAME -f"
    echo "   Restart service:  systemctl restart $SERVICE_NAME"
    echo "   Stop service:     systemctl stop $SERVICE_NAME"
    echo "   Service status:   systemctl status $SERVICE_NAME"
    echo ""
    print_message "$BLUE" "🔄 To update the application:"
    print_message "$GREEN" "   curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/update.sh | bash"
    echo ""
    print_message "$BLUE" "🗑️  To uninstall:"
    print_message "$GREEN" "   curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/uninstall.sh | bash"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_message "$GREEN" "Happy component organizing! 🎉"
    echo ""
}

# Main installation flow
main() {
    clear
    print_header "📦 Component Storage - Installation"
    
    check_root
    check_requirements
    install_dependencies
    install_nodejs
    setup_application
    install_npm_dependencies
    build_frontend
    setup_environment
    initialize_database
    create_service
    start_service
    print_success
}

# Run main function
main
