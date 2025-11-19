#!/usr/bin/env bash
set -euo pipefail

# Component Storage installer (full prerequisites + nginx)
REPO="https://github.com/JungleeAadmi/component-storage.git"
INSTALL_DIR="/opt/component-storage"
CURRENT_DIR="$INSTALL_DIR/current"
DATA_DIR="/var/lib/component-storage"
UPLOADS_DIR="$DATA_DIR/uploads"
CONFIG_DIR="/etc/component-storage"
SERVICE_NAME="component-storage"
SYSTEMD_UNIT="/etc/systemd/system/${SERVICE_NAME}.service"
USER="component-storage"
# prefer venv at top-level install dir
VENV_DIR="$INSTALL_DIR/venv"
NGINX_CONF_SRC="nginx/component-storage.conf"
NGINX_SITE="/etc/nginx/sites-available/component-storage"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/component-storage"

export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/bin:$PATH"

info(){ echo -e "\e[34m[INFO]\e[0m $*"; }
ok(){ echo -e "\e[32m[ OK ]\e[0m $*"; }
warn(){ echo -e "\e[33m[WARN]\e[0m $*"; }
err(){ echo -e "\e[31m[ ERR]\e[0m $*"; }

# require root
if [ "$(id -u)" -ne 0 ]; then
  err "Please run as root (or with sudo)."
  exit 1
fi

info "Starting Component Storage installer (full prerequisites + nginx-mode)."

# detect distro
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO_ID=${ID,,}
else
  DISTRO_ID=""
fi

if [[ "$DISTRO_ID" != "debian" && "$DISTRO_ID" != "ubuntu" && "$DISTRO_ID" != "linuxmint" && "$DISTRO_ID" != "pop" && "$DISTRO_ID" != "raspbian" ]]; then
  warn "This installer is targeted at Debian/Ubuntu derived systems. Proceeding, but may fail elsewhere."
fi

# update & upgrade
info "Running apt update && apt upgrade -y..."
apt-get update -y
apt-get upgrade -y

# install base packages
info "Installing prerequisites: git, curl, ca-certificates, python3, build-essential, etc..."
apt-get install -y --no-install-recommends \
  git curl ca-certificates gnupg lsb-release \
  python3 python3-venv python3-pip build-essential pkg-config \
  libssl-dev apt-transport-https

ok "Base prerequisites installed."

# nodejs repo + install nodejs 20.x if missing
if command -v node >/dev/null 2>&1; then
  ok "Node present: $(node -v)"
else
  info "Installing Node.js 20.x via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  ok "Node.js installed: $(node -v || echo 'node unknown')"
fi

# npm/yarn checks
if command -v npm >/dev/null 2>&1; then
  ok "npm available: $(npm -v)"
else
  warn "npm not found. Frontend build may fail."
fi
if command -v yarn >/dev/null 2>&1; then
  ok "yarn available: $(yarn -v)"
else
  warn "yarn not installed (installer will use npm)."
fi

# nginx install if not present (non-interactive default: install)
if command -v nginx >/dev/null 2>&1; then
  ok "nginx present: $(nginx -v 2>&1 | head -n1)"
else
  info "Installing nginx (non-interactive)..."
  apt-get install -y nginx
  systemctl enable --now nginx
  ok "nginx installed"
fi

# create system user & directories
if ! id -u $USER >/dev/null 2>&1; then
  info "Creating system user: $USER"
  useradd --system --no-create-home --shell /usr/sbin/nologin $USER
fi

info "Creating directories..."
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR" "$UPLOADS_DIR"
chown -R $USER:$USER "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"
chmod 750 "$DATA_DIR" "$UPLOADS_DIR"

# git safe.directory helper
if command -v git >/dev/null 2>&1; then
  if ! git config --global --get-all safe.directory | grep -qx "$CURRENT_DIR"; then
    info "Registering $CURRENT_DIR as safe.directory for git"
    git config --global --add safe.directory "$CURRENT_DIR" || true
  fi
fi

# clone or update repository
if [ -d "$CURRENT_DIR/.git" ]; then
  info "Repository already present. Fetching latest changes..."
  git -C "$CURRENT_DIR" fetch --all --tags || true
  git -C "$CURRENT_DIR" reset --hard origin/main || true
else
  info "Cloning repository $REPO -> $CURRENT_DIR"
  git clone "$REPO" "$CURRENT_DIR"
  chown -R $USER:$USER "$CURRENT_DIR"
  git config --global --add safe.directory "$CURRENT_DIR" || true
fi

# determine which python binary to use for venv:
PY_BIN="$(command -v python3 || true)"
# prefer python3.12 if available (reduces builds for pydantic-core)
if command -v python3.12 >/dev/null 2>&1; then
  PY_BIN="$(command -v python3.12)"
  info "Detected python3.12 at $PY_BIN - will use it for venv (preferred)."
else
  info "Using system python for venv: $PY_BIN"
fi

# create venv (idempotent)
if [ ! -d "$VENV_DIR" ]; then
  info "Creating virtual environment with $PY_BIN"
  "$PY_BIN" -m venv "$VENV_DIR"
fi

# prepare to install pip deps
source "$VENV_DIR/bin/activate"
pip install --upgrade pip setuptools wheel

# find requirements file (prefer backend/requirements.txt)
REQ=""
if [ -f "$CURRENT_DIR/backend/requirements.txt" ]; then
  REQ="$CURRENT_DIR/backend/requirements.txt"
elif [ -f "$CURRENT_DIR/backend/app/requirements.txt" ]; then
  REQ="$CURRENT_DIR/backend/app/requirements.txt"
fi

# if running under Python >=3.13 set forward compat env for PyO3 builds
PY_VER=$("$VENV_DIR/bin/python" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
if [ "$PY_MAJOR" -ge 4 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -ge 13 ]; }; then
  info "Python version $PY_VER detected in venv. Exporting PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 for pydantic-core build."
  export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
  # ensure cargo exists if building rust wheels (install minimal rustup if missing)
  if ! command -v cargo >/dev/null 2>&1; then
    info "Rust (cargo) not found. Installing rustup (minimal) for building pydantic-core..."
    apt-get install -y curl build-essential || true
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y || warn "rustup install failed (continuing)."
    export PATH="$HOME/.cargo/bin:$PATH"
  else
    ok "cargo already present: $(cargo --version 2>/dev/null || true)"
  fi
fi

# install python packages
if [ -n "$REQ" ]; then
  info "Installing Python dependencies from $REQ ..."
  pip install -r "$REQ"
else
  warn "No requirements file found in backend/; installing default minimal set (please commit backend/requirements.txt)."
  pip install fastapi==0.110.0 uvicorn[standard]==0.30.1 sqlalchemy==2.0.29 pydantic==2.7.1 \
    pydantic-settings==2.2.1 python-multipart==0.0.9 jinja2==3.1.3 aiofiles==23.2.1 python-dotenv==1.0.1 || true
fi

deactivate
ok "Python environment prepared."

# ensure .env from example
if [ -f "$CURRENT_DIR/.env.example" ]; then
  if [ ! -f "$CONFIG_DIR/.env" ]; then
    info "Creating $CONFIG_DIR/.env from .env.example"
    cp "$CURRENT_DIR/.env.example" "$CONFIG_DIR/.env"
    chown $USER:$USER "$CONFIG_DIR/.env"
    chmod 640 "$CONFIG_DIR/.env"
    ok "Created $CONFIG_DIR/.env"
  else
    info "$CONFIG_DIR/.env already exists - skipping"
  fi
else
  warn "No .env.example in repo - you may want to create $CONFIG_DIR/.env manually."
fi

# backup existing DB
if [ -f "$DATA_DIR/app.db" ]; then
  TIMESTAMP=$(date +"%Y%m%d%H%M%S")
  info "Existing DB found, creating backup..."
  mkdir -p "$DATA_DIR/backups"
  cp "$DATA_DIR/app.db" "$DATA_DIR/backups/app.db.$TIMESTAMP"
  ok "Backup created: $DATA_DIR/backups/app.db.$TIMESTAMP"
fi

# initialize DB
info "Initializing database (if db_init available)..."
source "$VENV_DIR/bin/activate"
if [ -f "$CURRENT_DIR/backend/app/db_init.py" ]; then
  python -c "import sys; sys.path.insert(0, '$CURRENT_DIR/backend'); import app.db_init as dbinit; dbinit.init_db()" || {
    warn "Module-style init failed; running script directly."
    python "$CURRENT_DIR/backend/app/db_init.py" || warn "db_init script failed."
  }
else
  warn "db_init.py not found; skipping DB init."
fi
deactivate

# build frontend if present
if [ -d "$CURRENT_DIR/frontend" ]; then
  info "Building frontend (as $USER)..."
  cd "$CURRENT_DIR/frontend"

  if command -v yarn >/dev/null 2>&1; then
    sudo -u $USER yarn install --silent --network-concurrency 1 || {
      warn "yarn install failed - trying npm"
      sudo -u $USER npm ci --silent --no-audit --progress=false || sudo -u $USER npm install --silent
    }
    sudo -u $USER yarn build || sudo -u $USER npm run build
  else
    sudo -u $USER npm ci --silent --no-audit --progress=false || sudo -u $USER npm install --silent
    sudo -u $USER npm run build
  fi

  info "Copying frontend build into backend static..."
  mkdir -p "$CURRENT_DIR/backend/app/static"
  rm -rf "$CURRENT_DIR/backend/app/static/"* || true
  if [ -d "$CURRENT_DIR/frontend/dist" ]; then
    cp -r "$CURRENT_DIR/frontend/dist/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/build" ]; then
    cp -r "$CURRENT_DIR/frontend/build/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/out" ]; then
    cp -r "$CURRENT_DIR/frontend/out/"* "$CURRENT_DIR/backend/app/static/" || true
  else
    warn "Frontend build not found in dist/ build/ out/ - skipping copy."
  fi

  # symlink static/uploads to persistent uploads dir
  mkdir -p "$CURRENT_DIR/backend/app/static/uploads"
  chown -R $USER:$USER "$CURRENT_DIR/backend/app/static" "$UPLOADS_DIR"
  if [ -e "$CURRENT_DIR/backend/app/static/uploads" ]; then
    rm -rf "$CURRENT_DIR/backend/app/static/uploads"
  fi
  ln -sfn "$UPLOADS_DIR" "$CURRENT_DIR/backend/app/static/uploads" || true

  ok "Frontend built and copied."
else
  warn "No frontend directory found; skipping frontend build."
fi

# install systemd unit if provided
if [ -f "$CURRENT_DIR/systemd/component-storage.service" ]; then
  info "Installing systemd unit..."
  cp "$CURRENT_DIR/systemd/component-storage.service" "$SYSTEMD_UNIT"
  sed -i "s|/opt/component-storage/venv/bin/uvicorn|$VENV_DIR/bin/uvicorn|" "$SYSTEMD_UNIT" || true
  # try to ensure user/group set
  sed -i "s|User=.*|User=$USER|g" "$SYSTEMD_UNIT" || true
  sed -i "s|Group=.*|Group=$USER|g" "$SYSTEMD_UNIT" || true
  systemctl daemon-reload
  systemctl enable --now $SERVICE_NAME || true
  if systemctl is-active --quiet $SERVICE_NAME; then
    ok "Service $SERVICE_NAME installed and running."
  else
    warn "Service installed but not active. Check: journalctl -u $SERVICE_NAME -n 200"
  fi
else
  warn "systemd unit not found in repo; skipping service install."
fi

# nginx site
if command -v nginx >/dev/null 2>&1; then
  if [ -f "$CURRENT_DIR/$NGINX_CONF_SRC" ]; then
    info "Installing nginx site configuration..."
    cp "$CURRENT_DIR/$NGINX_CONF_SRC" "$NGINX_SITE"
    ln -fs "$NGINX_SITE" "$NGINX_SITE_ENABLED"
    if nginx -t; then
      systemctl reload nginx
      ok "nginx configured."
    else
      warn "nginx configuration test failed; check $NGINX_SITE"
    fi
  else
    warn "nginx config in repo not found at $NGINX_CONF_SRC - skipping."
  fi
fi

# permissions final sweep
info "Setting final ownership & permissions..."
chown -R $USER:$USER "$INSTALL_DIR"
chown -R $USER:$USER "$DATA_DIR"
chmod -R u+rwX,go-rwx "$DATA_DIR"
ok "Permissions applied."

# compute access url
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

if command -v nginx >/dev/null 2>&1 && [ -f "$NGINX_SITE" -o -L "$NGINX_SITE_ENABLED" ]; then
  ACCESS_URL="http://$IP/"
else
  ACCESS_URL="http://$IP:8000/"
fi

echo
ok "Installation finished."
echo "Service: $SERVICE_NAME"
if systemctl is-active --quiet $SERVICE_NAME; then ok "Service running"; else warn "Service not running - check journalctl"; fi
echo "Database: $DATA_DIR/app.db"
echo "Uploads: $UPLOADS_DIR"
echo -e "Open the app at: \e[1m$ACCESS_URL\e[0m"
echo
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -f"
echo "  sudo tail -n 200 /var/log/nginx/error.log"
echo "-----------------------------------------"
