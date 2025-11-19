#!/usr/bin/env bash
set -euo pipefail
REPO="https://github.com/JungleeAadmi/component-storage.git"
INSTALL_DIR="/opt/component-storage"
CURRENT_DIR="$INSTALL_DIR/current"
DATA_DIR="/var/lib/component-storage"
CONFIG_DIR="/etc/component-storage"
SERVICE_NAME="component-storage"
SYSTEMD_UNIT="/etc/systemd/system/${SERVICE_NAME}.service"
USER="component-storage"
VENV_DIR="$INSTALL_DIR/venv"
NGINX_CONF_SRC="nginx/component-storage.conf"
NGINX_SITE="/etc/nginx/sites-available/component-storage"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/component-storage"

# helper: color output
info(){ echo -e "\e[34m[INFO]\e[0m $*"; }
ok(){ echo -e "\e[32m[OK]\e[0m $*"; }
warn(){ echo -e "\e[33m[WARN]\e[0m $*"; }
err(){ echo -e "\e[31m[ERROR]\e[0m $*"; }

# require root
if [ "$(id -u)" -ne 0 ]; then
  err "Please run as root (or with sudo)"
  exit 1
fi

info "Starting Component Storage installer (nginx reverse proxy mode)."

# create system user if missing
if ! id -u $USER >/dev/null 2>&1; then
  info "Creating system user: $USER"
  useradd --system --no-create-home --shell /usr/sbin/nologin $USER
fi

# create dirs
info "Creating directories..."
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"
chown -R $USER:$USER "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"

# clone or update repo
if [ -d "$CURRENT_DIR/.git" ]; then
  info "Repo already present — pulling latest..."
  git -C "$CURRENT_DIR" fetch --all
  git -C "$CURRENT_DIR" reset --hard origin/main
else
  info "Cloning repo from $REPO ..."
  git clone "$REPO" "$CURRENT_DIR"
  chown -R $USER:$USER "$CURRENT_DIR"
fi

# create python venv and install deps
info "Creating Python venv and installing backend dependencies..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip setuptools wheel >/dev/null
if [ -f "$CURRENT_DIR/backend/requirements.txt" ]; then
  pip install -r "$CURRENT_DIR/backend/requirements.txt"
fi
deactivate

# ensure upload & backups
mkdir -p "$DATA_DIR/uploads" "$DATA_DIR/backups"
chown -R $USER:$USER "$DATA_DIR"

# initialize DB if missing (back it up first if exists)
if [ -f "$DATA_DIR/app.db" ]; then
  TIMESTAMP=$(date +"%Y%m%d%H%M%S")
  info "Existing DB found, creating backup..."
  cp "$DATA_DIR/app.db" "$DATA_DIR/backups/app.db.$TIMESTAMP"
  ok "Backup: $DATA_DIR/backups/app.db.$TIMESTAMP"
else
  info "No existing DB found."
fi

info "Initializing database (if not present)..."
source "$VENV_DIR/bin/activate"
python "$CURRENT_DIR/backend/app/db_init.py"
deactivate

# build frontend if exists
if [ -d "$CURRENT_DIR/frontend" ]; then
  info "Building frontend..."
  cd "$CURRENT_DIR/frontend"
  if command -v yarn >/dev/null 2>&1; then
    sudo -u $USER yarn install --silent
    sudo -u $USER yarn build
  else
    sudo -u $USER npm ci --silent
    sudo -u $USER npm run build
  fi

  info "Copying frontend build to backend static folder..."
  mkdir -p "$CURRENT_DIR/backend/app/static"
  rm -rf "$CURRENT_DIR/backend/app/static/"* || true
  # support both dist/ and build/
  if [ -d "$CURRENT_DIR/frontend/dist" ]; then
    cp -r "$CURRENT_DIR/frontend/dist/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/build" ]; then
    cp -r "$CURRENT_DIR/frontend/build/"* "$CURRENT_DIR/backend/app/static/" || true
  fi
  chown -R $USER:$USER "$CURRENT_DIR/backend/app/static"
  ok "Frontend build copied."
else
  warn "No frontend folder found in repo — skipping frontend build."
fi

# install systemd service if present
if [ -f "$CURRENT_DIR/systemd/component-storage.service" ]; then
  info "Installing systemd service..."
  cp "$CURRENT_DIR/systemd/component-storage.service" "$SYSTEMD_UNIT"
  systemctl daemon-reload
  systemctl enable --now $SERVICE_NAME || true
  ok "Systemd service installed and started (name: $SERVICE_NAME)"
else
  warn "Systemd unit not found in repo; skip service install."
fi

# nginx: check/install and enable site
if command -v nginx >/dev/null 2>&1; then
  info "nginx is installed."
  NGINX_AVAILABLE="$NGINX_SITE"
  if [ -f "$CURRENT_DIR/$NGINX_CONF_SRC" ]; then
    info "Installing nginx site config..."
    cp "$CURRENT_DIR/$NGINX_CONF_SRC" "$NGINX_AVAILABLE"
    # enable site
    ln -sf "$NGINX_AVAILABLE" "$NGINX_SITE_ENABLED"
    # test config and reload
    nginx -t && systemctl reload nginx
    ok "nginx site installed and reloaded."
  else
    warn "nginx config file not found in repo at $CURRENT_DIR/$NGINX_CONF_SRC"
  fi
else
  warn "nginx not installed on this host."
  read -p "Do you want installer to install nginx now? [Y/n] " -r
  if [[ $REPLY =~ ^([yY][eE][sS]|[yY]|'')$ ]]; then
    info "Installing nginx via apt..."
    apt-get update
    apt-get install -y nginx
    info "nginx installed. Now attempting to install site config..."
    if [ -f "$CURRENT_DIR/$NGINX_CONF_SRC" ]; then
      cp "$CURRENT_DIR/$NGINX_CONF_SRC" "$NGINX_SITE"
      ln -sf "$NGINX_SITE" "$NGINX_SITE_ENABLED"
      nginx -t && systemctl reload nginx
      ok "nginx site configured and reloaded."
    else
      warn "nginx config file not present in the repo; please add it at $NGINX_CONF_SRC"
    fi
  else
    warn "Skipping nginx install — you will need to expose the app manually (Uvicorn on port 8000)."
  fi
fi

# final checks: service status
SERVICE_OK=false
if systemctl is-active --quiet $SERVICE_NAME; then
  SERVICE_OK=true
fi

# determine server IP to show user
# prefer the IP used for reaching public internet
IP=""
# 1) try ip route
if ip route get 1.1.1.1 >/dev/null 2>&1; then
  IP=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')
fi
# 2) fallback to hostname -I
if [ -z "$IP" ]; then
  IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
# 3) fallback to localhost
if [ -z "$IP" ] || [ "$IP" = "127.0.0.1" ]; then
  IP="127.0.0.1"
fi

# decide access URL (nginx or uvicorn)
ACCESS_URL=""
if command -v nginx >/dev/null 2>&1 && [ -f "$NGINX_SITE" -o -f "$NGINX_AVAILABLE" ]; then
  ACCESS_URL="http://$IP/"
else
  ACCESS_URL="http://$IP:8000/"
fi

# output final summary
echo
ok "Installation complete."
echo "-----------------------------------------"
echo "Service: $SERVICE_NAME"
if [ "$SERVICE_OK" = true ]; then
  ok "Service is running."
else
  warn "Service is not running. Check logs: journalctl -u $SERVICE_NAME -n 200"
fi
echo "Database: $DATA_DIR/app.db"
echo "Config: $CONFIG_DIR/.env"
echo
echo -e "Open the app in your browser: \e[1m$ACCESS_URL\e[0m"
echo
echo "If you exposed the server to the LAN, use the server IP above (replace with your domain if applicable)."
echo "To restart: sudo systemctl restart $SERVICE_NAME"
echo "To view logs: sudo journalctl -u $SERVICE_NAME -f"
echo "To view nginx logs: /var/log/nginx/error.log"
echo "-----------------------------------------"
ok "Thank you for installing Component Storage!"