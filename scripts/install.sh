#!/usr/bin/env bash
set -euo pipefail

# -----------------------
# Component Storage installer (full prerequisites + nginx)
# Repo: https://github.com/JungleeAadmi/component-storage.git
# Places:
#   /opt/component-storage/current  -> app code
#   /var/lib/component-storage      -> data (db, uploads, backups)
#   /etc/component-storage/.env     -> runtime config
# -----------------------

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

export DEBIAN_FRONTEND=noninteractive

# ---- helpers ----
info(){ echo -e "\e[34m[INFO]\e[0m $*"; }
ok(){ echo -e "\e[32m[ OK ]\e[0m $*"; }
warn(){ echo -e "\e[33m[WARN]\e[0m $*"; }
err(){ echo -e "\e[31m[ ERR]\e[0m $*"; }

# ---- require root ----
if [ "$(id -u)" -ne 0 ]; then
  err "Please run as root (or with sudo)."
  exit 1
fi

info "Starting Component Storage installer (full prerequisites, nginx reverse-proxy mode)."

# ---- detect distro family (Debian/Ubuntu required) ----
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO_ID=${ID,,}
else
  DISTRO_ID=""
fi

if [[ "$DISTRO_ID" != "debian" && "$DISTRO_ID" != "ubuntu" && "$DISTRO_ID" != "linuxmint" && "$DISTRO_ID" != "pop" && "$DISTRO_ID" != "raspbian" ]]; then
  warn "This installer is targeted at Debian/Ubuntu based systems. Proceeding, but may fail on other distros."
fi

# ---- update + upgrade ----
info "Running apt update && apt upgrade -y (may take some time)..."
apt-get update -y
apt-get upgrade -y

# ---- ensure prerequisites ----
info "Installing base prerequisites: git, curl, ca-certificates, python3, venv, pip, build-essential ..."
apt-get install -y --no-install-recommends \
  git curl ca-certificates gnupg lsb-release \
  python3 python3-venv python3-pip build-essential pkg-config \
  libssl-dev

ok "Base prerequisites installed."

# ---- Node.js (NodeSource 20.x) ----
if command -v node >/dev/null 2>&1; then
  info "Node already present: $(node -v). Skipping Node install."
else
  info "Installing Node.js 20.x via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  ok "Node.js installed: $(node -v)"
fi

# ---- npm / yarn availability ----
if command -v npm >/dev/null 2>&1; then
  ok "npm available: $(npm -v)"
else
  warn "npm not found even after Node install; frontend build may fail."
fi

if command -v yarn >/dev/null 2>&1; then
  ok "yarn available: $(yarn -v)"
else
  warn "yarn not installed. The installer will use npm by default. To install yarn globally: npm i -g yarn"
fi

# ---- nginx installation choice ----
if command -v nginx >/dev/null 2>&1; then
  ok "nginx already installed: $(nginx -v 2>&1 | head -n1)"
else
  info "nginx is not installed."
  read -p "Install nginx now? [Y/n] " -r
  if [[ $REPLY =~ ^([yY][eE][sS]|[yY]|'')$ ]]; then
    info "Installing nginx..."
    apt-get install -y nginx
    systemctl enable --now nginx
    ok "nginx installed and started."
  else
    warn "Skipping nginx installation. The app will be accessible on port 8000 (uvicorn)."
  fi
fi

# ---- create system user & dirs ----
if ! id -u $USER >/dev/null 2>&1; then
  info "Creating system user: $USER"
  useradd --system --no-create-home --shell /usr/sbin/nologin $USER
fi

info "Creating directories..."
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"
chown -R $USER:$USER "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"

# ---- ensure git safe.directory is set for the target repo path ----
# This avoids "detected dubious ownership" when the repo is owned by a non-root user.
if command -v git >/dev/null 2>&1; then
  # add safe.directory globally if not already present
  if ! git config --global --get-all safe.directory | grep -qx "$CURRENT_DIR"; then
    info "Adding $CURRENT_DIR to git safe.directory (avoids dubious ownership error)."
    git config --global --add safe.directory "$CURRENT_DIR" || true
  fi
fi

# ---- clone or update repo ----
if [ -d "$CURRENT_DIR/.git" ]; then
  info "Repository already present. Pulling latest changes..."
  # Ensure safe.directory is set for this directory (again, in case ownership changed)
  if command -v git >/dev/null 2>&1; then
    git config --global --add safe.directory "$CURRENT_DIR" || true
  fi
  git -C "$CURRENT_DIR" fetch --all --tags
  git -C "$CURRENT_DIR" reset --hard origin/main
else
  info "Cloning repository $REPO into $CURRENT_DIR ..."
  git clone "$REPO" "$CURRENT_DIR"
  chown -R $USER:$USER "$CURRENT_DIR"
  # ensure safe.directory is added after clone (for subsequent runs)
  if command -v git >/dev/null 2>&1; then
    git config --global --add safe.directory "$CURRENT_DIR" || true
  fi
fi

# ---- python venv & pip deps ----
info "Creating Python virtual environment and installing backend Python dependencies..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip setuptools wheel
if [ -f "$CURRENT_DIR/backend/requirements.txt" ]; then
  pip install -r "$CURRENT_DIR/backend/requirements.txt"
else
  warn "backend/requirements.txt not found; skipping pip install."
fi
deactivate
ok "Python environment ready."

# ---- backups if DB exists ----
if [ -f "$DATA_DIR/app.db" ]; then
  TIMESTAMP=$(date +"%Y%m%d%H%M%S")
  info "Existing DB detected; creating backup..."
  mkdir -p "$DATA_DIR/backups"
  cp "$DATA_DIR/app.db" "$DATA_DIR/backups/app.db.$TIMESTAMP"
  ok "DB backup: $DATA_DIR/backups/app.db.$TIMESTAMP"
fi

# ---- initialize DB ----
info "Initializing database (if not present)..."
source "$VENV_DIR/bin/activate"
if [ -f "$CURRENT_DIR/backend/app/db_init.py" ]; then
  # run db_init in a way that avoids relative import issues
  # try module-style invocation first
  python -c "import sys; sys.path.insert(0, '$CURRENT_DIR/backend'); import app.db_init as dbinit; dbinit.init_db()" || {
    # fallback to direct script execution
    python "$CURRENT_DIR/backend/app/db_init.py"
  }
else
  warn "db_init.py not found in repo; skipping DB init. Ensure DB is created manually or add db_init.py."
fi
deactivate

# ---- build frontend (npm/yarn) if present ----
if [ -d "$CURRENT_DIR/frontend" ]; then
  info "Building frontend..."
  cd "$CURRENT_DIR/frontend"
  if command -v yarn >/dev/null 2>&1; then
    sudo -u $USER yarn install --silent --network-concurrency 1
    sudo -u $USER yarn build
  else
    sudo -u $USER npm ci --silent --no-audit --progress=false
    sudo -u $USER npm run build
  fi

  info "Copying frontend build into backend static folder..."
  mkdir -p "$CURRENT_DIR/backend/app/static"
  rm -rf "$CURRENT_DIR/backend/app/static/"* || true
  # support common build dirs
  if [ -d "$CURRENT_DIR/frontend/dist" ]; then
    cp -r "$CURRENT_DIR/frontend/dist/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/build" ]; then
    cp -r "$CURRENT_DIR/frontend/build/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/out" ]; then
    cp -r "$CURRENT_DIR/frontend/out/"* "$CURRENT_DIR/backend/app/static/" || true
  else
    warn "Frontend build output not found in common locations (dist/ build/ out/)."
  fi
  chown -R $USER:$USER "$CURRENT_DIR/backend/app/static"
  ok "Frontend build copied."
else
  warn "No frontend/ directory in repo; skipping frontend build."
fi

# ---- install systemd service ----
if [ -f "$CURRENT_DIR/systemd/component-storage.service" ]; then
  info "Installing systemd service..."
  cp "$CURRENT_DIR/systemd/component-storage.service" "$SYSTEMD_UNIT"
  sed -i "s|/opt/component-storage/venv/bin/uvicorn|$VENV_DIR/bin/uvicorn|" "$SYSTEMD_UNIT" || true
  systemctl daemon-reload
  systemctl enable --now $SERVICE_NAME || true
  if systemctl is-active --quiet $SERVICE_NAME; then
    ok "Service $SERVICE_NAME installed and running."
  else
    warn "Service $SERVICE_NAME installed but not running. Check logs with: journalctl -u $SERVICE_NAME -n 200"
  fi
else
  warn "systemd unit not found in repo; skipping systemd service installation."
fi

# ---- nginx site config installation ----
if command -v nginx >/dev/null 2>&1; then
  if [ -f "$CURRENT_DIR/$NGINX_CONF_SRC" ]; then
    info "Installing nginx site configuration..."
    cp "$CURRENT_DIR/$NGINX_CONF_SRC" "$NGINX_SITE"
    ln -fs "$NGINX_SITE" "$NGINX_SITE_ENABLED"
    # test and reload
    if nginx -t; then
      systemctl reload nginx
      ok "nginx config installed and reloaded."
    else
      warn "nginx config test failed. Check $NGINX_SITE for errors."
    fi
  else
    warn "nginx config $CURRENT_DIR/$NGINX_CONF_SRC not found in repo; skipping site install."
  fi
else
  warn "nginx not installed, so site not configured."
fi

# ---- determine server IP used for outbound traffic ----
info "Detecting server IP address..."
IP=""
if ip route get 1.1.1.1 >/dev/null 2>&1; then
  IP=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')
fi
if [ -z "$IP" ]; then
  IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$IP" ] || [ "$IP" = "127.0.0.1" ]; then
  IP="127.0.0.1"
fi

# ---- decide access URL (nginx or uvicorn) ----
ACCESS_URL=""
if command -v nginx >/dev/null 2>&1 && [ -f "$NGINX_SITE" -o -f "$NGINX_SITE_ENABLED" ]; then
  ACCESS_URL="http://$IP/"
else
  ACCESS_URL="http://$IP:8000/"
fi

# ---- final summary ----
echo
ok "Installation complete."
echo "-----------------------------------------"
echo "Service: $SERVICE_NAME"
if systemctl is-active --quiet $SERVICE_NAME; then
  ok "Service is running (checked via systemctl)."
else
  warn "Service is not running. Use: journalctl -u $SERVICE_NAME -n 200"
fi
echo "Database path: $DATA_DIR/app.db"
echo "Config path: $CONFIG_DIR/.env"
echo
echo -e "Open the app in your browser: \e[1m$ACCESS_URL\e[0m"
echo
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -f"
echo "  sudo tail -n 200 /var/log/nginx/error.log"
echo "-----------------------------------------"
