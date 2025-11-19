#!/usr/bin/env bash
set -euo pipefail

# Component Storage installer (pyenv-based, robust)
# Repo: https://github.com/JungleeAadmi/component-storage.git
# Installs app at /opt/component-storage, data at /var/lib/component-storage, config at /etc/component-storage

REPO="https://github.com/JungleeAadmi/component-storage.git"
INSTALL_DIR="/opt/component-storage"
CURRENT_DIR="$INSTALL_DIR/current"
DATA_DIR="/var/lib/component-storage"
UPLOADS_DIR="$DATA_DIR/uploads"
CONFIG_DIR="/etc/component-storage"
SERVICE_NAME="component-storage"
SYSTEMD_UNIT="/etc/systemd/system/${SERVICE_NAME}.service"
USER="component-storage"
VENV_DIR="$INSTALL_DIR/venv"
NGINX_CONF_SRC="nginx/component-storage.conf"
NGINX_SITE="/etc/nginx/sites-available/component-storage"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/component-storage"

# Optional: path to screenshot you uploaded (for reference)
# /mnt/data/Screenshot 2025-11-19 at 11.02.55 PM.png

export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/bin:$PATH"

info(){ echo -e "\e[34m[INFO]\e[0m $*"; }
ok(){ echo -e "\e[32m[ OK ]\e[0m $*"; }
warn(){ echo -e "\e[33m[WARN]\e[0m $*"; }
err(){ echo -e "\e[31m[ ERR]\e[0m $*"; }

if [ "$(id -u)" -ne 0 ]; then
  err "Please run as root (or with sudo)."
  exit 1
fi

info "Starting Component Storage installer (pyenv python3.12 preferred)."

# Detect distro (informational only)
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO_ID=${ID,,}
else
  DISTRO_ID=""
fi

if [[ "$DISTRO_ID" != "debian" && "$DISTRO_ID" != "ubuntu" && "$DISTRO_ID" != "linuxmint" && "$DISTRO_ID" != "pop" && "$DISTRO_ID" != "raspbian" ]]; then
  warn "This installer is targeted at Debian/Ubuntu derivatives; it may still work on others."
fi

# Update and base packages
info "Updating apt and installing base packages (may take a few minutes)..."
apt-get update -y
apt-get upgrade -y

apt-get install -y --no-install-recommends \
  git curl ca-certificates gnupg lsb-release software-properties-common \
  build-essential pkg-config libssl-dev apt-transport-https \
  zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev libncursesw5-dev libffi-dev \
  liblzma-dev libgdbm-dev libnss3-dev uuid-dev

ok "Base packages installed."

# Node.js (NodeSource)
if command -v node >/dev/null 2>&1; then
  ok "Node present: $(node -v)"
else
  info "Installing Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  ok "Node installed: $(node -v || echo unknown)"
fi

if command -v npm >/dev/null 2>&1; then ok "npm: $(npm -v)"; else warn "npm missing"; fi
if command -v yarn >/dev/null 2>&1; then ok "yarn: $(yarn -v)"; else warn "yarn not installed (will use npm)"; fi

# Nginx
if command -v nginx >/dev/null 2>&1; then
  ok "nginx present: $(nginx -v 2>&1 | head -n1)"
else
  info "Installing nginx..."
  apt-get install -y nginx
  systemctl enable --now nginx
  ok "nginx installed"
fi

# Create system user and directories
if ! id -u "$USER" >/dev/null 2>&1; then
  info "Creating system user: $USER"
  useradd --system --no-create-home --shell /usr/sbin/nologin "$USER"
fi

info "Creating directories..."
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR" "$UPLOADS_DIR"
chown -R "$USER:$USER" "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"
chmod 750 "$DATA_DIR"

# Git safe.directory to avoid dubious ownership errors
if command -v git >/dev/null 2>&1; then
  if ! git config --global --get-all safe.directory | grep -qx "$CURRENT_DIR"; then
    info "Adding $CURRENT_DIR to git safe.directory"
    git config --global --add safe.directory "$CURRENT_DIR" || true
  fi
fi

# Clone or update repo
if [ -d "$CURRENT_DIR/.git" ]; then
  info "Repository exists, fetching latest..."
  git -C "$CURRENT_DIR" fetch --all --tags || true
  git -C "$CURRENT_DIR" reset --hard origin/main || true
else
  info "Cloning repository into $CURRENT_DIR..."
  git clone "$REPO" "$CURRENT_DIR"
  chown -R "$USER:$USER" "$CURRENT_DIR"
  git config --global --add safe.directory "$CURRENT_DIR" || true
fi

# Install pyenv for root if not present
PYENV_ROOT="/root/.pyenv"
if [ ! -d "$PYENV_ROOT" ]; then
  info "Installing pyenv for root..."
  git clone https://github.com/pyenv/pyenv.git "$PYENV_ROOT"
  # optional: install pyenv-virtualenv plugin (not required)
  # git clone https://github.com/pyenv/pyenv-virtualenv.git "$PYENV_ROOT/plugins/pyenv-virtualenv"
fi
export PYENV_ROOT="$PYENV_ROOT"
export PATH="$PYENV_ROOT/bin:$PATH"

if ! command -v pyenv >/dev/null 2>&1; then
  err "pyenv not found after clone. Aborting."
  exit 1
fi

# Choose Python version to build with pyenv
PY_VER="3.12.13"    # change if you want a different micro release

# Install Python via pyenv if not already present
if ! pyenv versions --bare | grep -qx "$PY_VER"; then
  info "Installing Python $PY_VER via pyenv (this compiles from source; may take several minutes)..."
  # Enable verbose output for pyenv build in case of failure
  env PYTHON_CONFIGURE_OPTS="--enable-shared" pyenv install -v "$PY_VER" || {
    err "pyenv install failed. Ensure build deps are present (see earlier apt-get)."
    exit 1
  }
fi

PY_BIN="$PYENV_ROOT/versions/$PY_VER/bin/python3"
if [ ! -x "$PY_BIN" ]; then
  err "Compiled python not found at $PY_BIN"
  exit 1
fi
ok "pyenv python ready: $PY_BIN"

# Recreate venv using pyenv-built Python (removes old venv if present)
if [ -d "$VENV_DIR" ]; then
  info "Removing existing venv at $VENV_DIR to recreate with $PY_VER"
  rm -rf "$VENV_DIR"
fi

"$PY_BIN" -m venv "$VENV_DIR"
chown -R root:root "$VENV_DIR"
chmod -R 750 "$VENV_DIR"
ok "Virtualenv created at $VENV_DIR"

# Activate venv and install Python requirements
source "$VENV_DIR/bin/activate"
pip install --upgrade pip setuptools wheel

# Determine requirements file (prefer backend/requirements.txt)
REQ_FILE=""
if [ -f "$CURRENT_DIR/backend/requirements.txt" ]; then
  REQ_FILE="$CURRENT_DIR/backend/requirements.txt"
elif [ -f "$CURRENT_DIR/backend/app/requirements.txt" ]; then
  REQ_FILE="$CURRENT_DIR/backend/app/requirements.txt"
fi

# If requirements mention pydantic/pydantic-core and cargo not present, install rustup minimal
if [ -n "$REQ_FILE" ] && grep -Eiq "pydantic|pydantic-core" "$REQ_FILE" && ! command -v cargo >/dev/null 2>&1; then
  info "Requirements include pydantic; ensuring Rust toolchain (rustup) is available for building wheels."
  apt-get install -y curl build-essential || true
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y || warn "rustup install failed; pip may still work if wheels available."
  # source cargo env for this shell so pip can call cargo
  if [ -f "/root/.cargo/env" ]; then
    # shellcheck disable=SC1090
    . "/root/.cargo/env"
  fi
fi

if [ -n "$REQ_FILE" ]; then
  info "Installing Python dependencies from $REQ_FILE ..."
  # export forward-compat flag for PyO3 in case python version mismatches
  export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
  if ! pip install -r "$REQ_FILE"; then
    warn "pip install failed; trying fallback without build isolation."
    pip install --no-build-isolation -r "$REQ_FILE" || {
      err "pip install failed. Inspect pip output above for details."
      deactivate
      exit 1
    }
  fi
else
  warn "No backend requirements file found. Installing recommended minimal set."
  pip install fastapi==0.110.0 uvicorn[standard]==0.30.1 sqlalchemy==2.0.29 pydantic==2.7.1 \
    pydantic-settings==2.2.1 python-multipart==0.0.9 jinja2==3.1.3 aiofiles==23.2.1 python-dotenv==1.0.1 || true
fi

deactivate
ok "Python dependencies installed."

# Create default .env from repo example if available
if [ -f "$CURRENT_DIR/.env.example" ]; then
  if [ ! -f "$CONFIG_DIR/.env" ]; then
    info "Creating $CONFIG_DIR/.env from .env.example"
    cp "$CURRENT_DIR/.env.example" "$CONFIG_DIR/.env"
    chown "$USER:$USER" "$CONFIG_DIR/.env"
    chmod 640 "$CONFIG_DIR/.env"
    ok "Created $CONFIG_DIR/.env"
  else
    info "$CONFIG_DIR/.env already exists; skipping creation."
  fi
else
  warn "No .env.example in repo; create $CONFIG_DIR/.env manually if needed."
fi

# Backup existing DB
if [ -f "$DATA_DIR/app.db" ]; then
  TIMESTAMP=$(date +"%Y%m%d%H%M%S")
  mkdir -p "$DATA_DIR/backups"
  cp "$DATA_DIR/app.db" "$DATA_DIR/backups/app.db.$TIMESTAMP"
  ok "Backed up existing DB to $DATA_DIR/backups/app.db.$TIMESTAMP"
fi

# Initialize database (safe module invocation)
info "Initializing database if db_init.py exists..."
source "$VENV_DIR/bin/activate"
if [ -f "$CURRENT_DIR/backend/app/db_init.py" ]; then
  python -c "import sys; sys.path.insert(0,'$CURRENT_DIR/backend'); import app.db_init as dbinit; dbinit.init_db()" || {
    warn "Module-style db_init failed; trying direct script execution..."
    python "$CURRENT_DIR/backend/app/db_init.py" || warn "DB init script failed."
  }
else
  warn "No db_init.py found; skipping DB init. Ensure database is created manually if required."
fi
deactivate

# Build frontend (if present) and copy to backend static
if [ -d "$CURRENT_DIR/frontend" ]; then
  info "Building frontend..."
  cd "$CURRENT_DIR/frontend"
  if command -v yarn >/dev/null 2>&1; then
    sudo -u "$USER" yarn install --silent --network-concurrency 1 || {
      warn "yarn install failed; falling back to npm"
      sudo -u "$USER" npm ci --silent --no-audit --progress=false || sudo -u "$USER" npm install --silent
    }
    sudo -u "$USER" yarn build || sudo -u "$USER" npm run build
  else
    sudo -u "$USER" npm ci --silent --no-audit --progress=false || sudo -u "$USER" npm install --silent
    sudo -u "$USER" npm run build
  fi

  info "Copying frontend build into backend static folder..."
  mkdir -p "$CURRENT_DIR/backend/app/static"
  rm -rf "$CURRENT_DIR/backend/app/static/"* || true
  if [ -d "$CURRENT_DIR/frontend/dist" ]; then
    cp -r "$CURRENT_DIR/frontend/dist/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/build" ]; then
    cp -r "$CURRENT_DIR/frontend/build/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/out" ]; then
    cp -r "$CURRENT_DIR/frontend/out/"* "$CURRENT_DIR/backend/app/static/" || true
  else
    warn "Frontend build output not found in common locations (dist|build|out)."
  fi

  # ensure uploads are persisted and symlinked
  mkdir -p "$UPLOADS_DIR"
  chown -R "$USER:$USER" "$UPLOADS_DIR"
  rm -rf "$CURRENT_DIR/backend/app/static/uploads" || true
  ln -sfn "$UPLOADS_DIR" "$CURRENT_DIR/backend/app/static/uploads" || true
  chown -R "$USER:$USER" "$CURRENT_DIR/backend/app/static" || true
  ok "Frontend build copied."
else
  warn "No frontend directory present; skipping frontend build."
fi

# Install systemd service if repo provides unit
if [ -f "$CURRENT_DIR/systemd/component-storage.service" ]; then
  info "Installing systemd unit..."
  cp "$CURRENT_DIR/systemd/component-storage.service" "$SYSTEMD_UNIT"
  sed -i "s|/opt/component-storage/venv/bin/uvicorn|$VENV_DIR/bin/uvicorn|g" "$SYSTEMD_UNIT" || true
  sed -i "s|User=.*|User=$USER|g" "$SYSTEMD_UNIT" || true
  sed -i "s|Group=.*|Group=$USER|g" "$SYSTEMD_UNIT" || true
  systemctl daemon-reload
  systemctl enable --now "$SERVICE_NAME" || true
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    ok "Systemd service $SERVICE_NAME enabled and started."
  else
    warn "Service installed but not running. See: journalctl -u $SERVICE_NAME -n 200"
  fi
else
  warn "No systemd unit in repo; skipping service install."
fi

# Install nginx site config (if provided)
if [ -f "$CURRENT_DIR/$NGINX_CONF_SRC" ]; then
  info "Installing nginx site configuration..."
  cp "$CURRENT_DIR/$NGINX_CONF_SRC" "$NGINX_SITE"
  ln -fs "$NGINX_SITE" "$NGINX_SITE_ENABLED"
  if nginx -t; then
    systemctl reload nginx
    ok "nginx site enabled and reloaded."
  else
    warn "nginx config test failed. Check $NGINX_SITE for errors."
  fi
else
  warn "nginx config not found in repo path $NGINX_CONF_SRC"
fi

# Final ownership/permissions
info "Applying final ownership/permissions..."
chown -R "$USER:$USER" "$INSTALL_DIR"
chown -R "$USER:$USER" "$DATA_DIR"
chmod -R u+rwX,go-rwx "$DATA_DIR"
ok "Permissions set."

# Determine server IP for user-friendly access URL
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

ACCESS_URL=""
if command -v nginx >/dev/null 2>&1 && [ -f "$NGINX_SITE" -o -L "$NGINX_SITE_ENABLED" ]; then
  ACCESS_URL="http://$IP/"
else
  ACCESS_URL="http://$IP:8000/"
fi

echo
ok "Installation finished."
echo "-----------------------------------------"
echo "Service: $SERVICE_NAME"
if systemctl is-active --quiet "$SERVICE_NAME"; then ok "Service running"; else warn "Service not running (see journalctl)"; fi
echo "Database path: $DATA_DIR/app.db"
echo "Uploads directory: $UPLOADS_DIR"
echo -e "Open the app in your browser: \e[1m$ACCESS_URL\e[0m"
echo
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -n 200 --no-pager"
echo "  tail -n 200 /var/log/nginx/error.log"
echo "-----------------------------------------"
