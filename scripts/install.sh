#!/usr/bin/env bash
set -euo pipefail

# Component Storage installer (full replacement)
# - Avoids deadsnakes PPA completely
# - Cleans leftover deadsnakes entries
# - Uses system python3 by default; can install python3.12 via pyenv (no PPA)
# - Installs node, nginx, builds frontend, creates venv, installs python deps
# - Installs systemd unit if provided, sets up nginx site if provided
#
# Paths:
#   /opt/component-storage/current  -> app code
#   /var/lib/component-storage      -> data (db, uploads)
#   /etc/component-storage/.env     -> runtime config

REPO="https://github.com/JungleeAadmi/component-storage.git"
INSTALL_DIR="/opt/component-storage"
CURRENT_DIR="$INSTALL_DIR/current"
DATA_DIR="/var/lib/component-storage"
UPLOADS_DIR="$DATA_DIR/uploads"
CONFIG_DIR="/etc/component-storage"
SERVICE_NAME="component-storage"
SYSTEMD_UNIT="/etc/systemd/system/${SERVICE_NAME}.service"
SYSTEMD_SRC="systemd/component-storage.service"
USER="component-storage"
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

if [ "$(id -u)" -ne 0 ]; then
  err "Please run as root (or with sudo)."
  exit 1
fi

info "Starting Component Storage installer (robust, deadsnakes-free)."

# ----------------------------
# Defensive cleanup: remove any existing deadsnakes PPA entries
# ----------------------------
info "Removing leftover deadsnakes PPA entries (if present)..."
# remove typical source files referencing deadsnakes
rm -f /etc/apt/sources.list.d/*deadsnakes* 2>/dev/null || true
# remove lines in main sources.list
if grep -qi "deadsnakes" /etc/apt/sources.list 2>/dev/null; then
  sed -i.bak '/deadsnakes/d' /etc/apt/sources.list || true
fi
# remove preferences (rare)
rm -f /etc/apt/preferences.d/*deadsnakes* 2>/dev/null || true

# ----------------------------
# Update + base packages
# ----------------------------
info "Updating package lists..."
apt-get update -y

info "Installing base packages (git, curl, build tools, etc.)..."
apt-get install -y --no-install-recommends \
  git curl ca-certificates gnupg lsb-release software-properties-common \
  build-essential pkg-config libssl-dev apt-transport-https \
  zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev libncursesw5-dev \
  libffi-dev liblzma-dev libgdbm-dev libnss3-dev uuid-dev

ok "Base packages installed."

# ----------------------------
# Node.js (NodeSource)
# ----------------------------
if command -v node >/dev/null 2>&1; then
  ok "Node present: $(node -v)"
else
  info "Installing Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1 || true
  apt-get install -y nodejs
  ok "Node installed: $(node -v || echo unknown)"
fi

if command -v npm >/dev/null 2>&1; then ok "npm: $(npm -v)"; else warn "npm missing"; fi
if command -v yarn >/dev/null 2>&1; then ok "yarn: $(yarn -v)"; else warn "yarn not installed (will use npm)"; fi

# ----------------------------
# Nginx
# ----------------------------
if command -v nginx >/dev/null 2>&1; then
  ok "nginx present: $(nginx -v 2>&1 | head -n1)"
else
  info "Installing nginx..."
  apt-get install -y nginx
  systemctl enable --now nginx || true
  ok "nginx installed"
fi

# ----------------------------
# Create user and directories
# ----------------------------
if ! id -u "$USER" >/dev/null 2>&1; then
  info "Creating system user: $USER"
  useradd --system --no-create-home --shell /usr/sbin/nologin "$USER" || true
fi

info "Creating necessary directories..."
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR" "$UPLOADS_DIR"
chown -R "$USER:$USER" "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"
chmod 750 "$DATA_DIR"

# ----------------------------
# Git safe.directory to avoid 'dubious ownership'
# ----------------------------
if command -v git >/dev/null 2>&1; then
  if ! git config --global --get-all safe.directory | grep -qx "$CURRENT_DIR"; then
    info "Adding $CURRENT_DIR to git safe.directory"
    git config --global --add safe.directory "$CURRENT_DIR" || true
  fi
fi

# ----------------------------
# Clone or update repo
# ----------------------------
if [ -d "$CURRENT_DIR/.git" ]; then
  info "Repository already present; pulling latest changes..."
  git -C "$CURRENT_DIR" fetch --all --tags || true
  git -C "$CURRENT_DIR" reset --hard origin/main || true
else
  info "Cloning repo $REPO into $CURRENT_DIR..."
  git clone "$REPO" "$CURRENT_DIR"
  chown -R "$USER:$USER" "$CURRENT_DIR"
  git config --global --add safe.directory "$CURRENT_DIR" || true
fi

# ----------------------------
# Python environment
# - Prefer using system python3 if adequate
# - Optional pyenv install if you explicitly want python3.12
# ----------------------------
PYTHON_BIN="$(command -v python3 || true)"
USE_PYENV=false
PYENV_ROOT="/root/.pyenv"
PY_VERSION_WANTED="3.12.13"

info "Detected system python: ${PYTHON_BIN:-none}"

# If system python is older than 3.11, recommend pyenv, but do NOT use deadsnakes.
if [ -z "$PYTHON_BIN" ] || ! "$PYTHON_BIN" -c "import sys; print(sys.version_info[:2])" >/dev/null 2>&1; then
  warn "No usable python3 found; attempting to install pyenv & build $PY_VERSION_WANTED"
  USE_PYENV=true
fi

# If user prefers pyenv, or want to ensure 3.12, enable pyenv path and install python via pyenv
if $USE_PYENV || (command -v python3 >/dev/null 2>&1 && python3 -c "import sys; v=sys.version_info; print(v.major*100+v.minor)"; test "$(python3 -c 'import sys; print(sys.version_info[0])')" = 3 ); then
  # If user wants to force pyenv, uncomment the next line (left disabled by default)
  # USE_PYENV=true
  true
fi

# If USE_PYENV true, install pyenv and compile requested Python
if [ "$USE_PYENV" = "true" ]; then
  info "Installing pyenv for root and building Python $PY_VERSION_WANTED (no PPA used)..."
  if [ ! -d "$PYENV_ROOT" ]; then
    git clone https://github.com/pyenv/pyenv.git "$PYENV_ROOT"
  fi
  export PYENV_ROOT="$PYENV_ROOT"
  export PATH="$PYENV_ROOT/bin:$PATH"
  if ! command -v pyenv >/dev/null 2>&1; then
    err "pyenv installation failed. Falling back to system python3 if available."
    USE_PYENV=false
  else
    if ! pyenv versions --bare | grep -qx "$PY_VERSION_WANTED"; then
      info "pyenv compiling Python $PY_VERSION_WANTED. This can take some time..."
      env PYTHON_CONFIGURE_OPTS="--enable-shared" pyenv install -v "$PY_VERSION_WANTED" || {
        warn "pyenv build failed. Falling back to system python3."
        USE_PYENV=false
      }
    fi
    if [ -d "$PYENV_ROOT/versions/$PY_VERSION_WANTED" ]; then
      PYTHON_BIN="$PYENV_ROOT/versions/$PY_VERSION_WANTED/bin/python3"
    fi
  fi
fi

# If still no python bin, fall back to system python3
if [ -z "${PYTHON_BIN:-}" ] || [ ! -x "$PYTHON_BIN" ]; then
  PYTHON_BIN="$(command -v python3 || true)"
  if [ -z "$PYTHON_BIN" ]; then
    err "No python3 available. Install python3 and retry or enable pyenv in script."
    exit 1
  fi
fi

info "Using Python: $($PYTHON_BIN -V 2>&1 || echo unknown)"

# ----------------------------
# Create virtualenv using chosen python
# ----------------------------
info "Creating Python virtualenv at $VENV_DIR..."
rm -rf "$VENV_DIR"
"$PYTHON_BIN" -m venv "$VENV_DIR"
chown -R root:root "$VENV_DIR"
chmod -R 750 "$VENV_DIR"
ok "Virtualenv created."

# ----------------------------
# Install Python dependencies
# ----------------------------
source "$VENV_DIR/bin/activate"
pip install --upgrade pip setuptools wheel

REQ_FILE=""
if [ -f "$CURRENT_DIR/backend/requirements.txt" ]; then
  REQ_FILE="$CURRENT_DIR/backend/requirements.txt"
elif [ -f "$CURRENT_DIR/backend/app/requirements.txt" ]; then
  REQ_FILE="$CURRENT_DIR/backend/app/requirements.txt"
fi

# If pydantic is present and cargo is missing, optionally install rustup (minimal)
if [ -n "$REQ_FILE" ] && grep -Eiq "pydantic|pydantic-core" "$REQ_FILE"; then
  if ! command -v cargo >/dev/null 2>&1; then
    info "Detected pydantic in requirements. Installing rust toolchain (rustup) to allow wheel build if necessary..."
    apt-get install -y curl build-essential || true
    # install rustup minimal (noninteractive)
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y || warn "rustup install failed; pip may still succeed if wheels are available."
    # source cargo env so the same shell can use cargo
    if [ -f "$HOME/.cargo/env" ]; then . "$HOME/.cargo/env"; fi
    if [ -f "/root/.cargo/env" ]; then . "/root/.cargo/env"; fi
  fi
fi

if [ -n "$REQ_FILE" ]; then
  info "Installing python dependencies from $REQ_FILE ..."
  # try normal install, fallback to no-build-isolation if wheel building fails
  export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
  if ! pip install -r "$REQ_FILE"; then
    warn "pip install -r failed; trying fallback --no-build-isolation"
    if ! pip install --no-build-isolation -r "$REQ_FILE"; then
      err "pip install failed. Inspect pip output above for specific build errors."
      deactivate
      exit 1
    fi
  fi
else
  warn "No backend requirements.txt found. Installing a minimal recommended set."
  pip install fastapi uvicorn[standard] sqlalchemy pydantic python-multipart jinja2 aiofiles python-dotenv || true
fi
deactivate
ok "Python dependencies installed."

# ----------------------------
# Create default .env from .env.example
# ----------------------------
if [ -f "$CURRENT_DIR/.env.example" ]; then
  if [ ! -f "$CONFIG_DIR/.env" ]; then
    info "Creating $CONFIG_DIR/.env from .env.example"
    cp "$CURRENT_DIR/.env.example" "$CONFIG_DIR/.env"
    chown "$USER:$USER" "$CONFIG_DIR/.env" || true
    chmod 640 "$CONFIG_DIR/.env" || true
  else
    info "$CONFIG_DIR/.env already exists; skipping"
  fi
else
  warn "No .env.example found in repo; edit $CONFIG_DIR/.env manually if needed."
fi

# ----------------------------
# Backup existing DB if any
# ----------------------------
if [ -f "$DATA_DIR/app.db" ]; then
  TIMESTAMP=$(date +"%Y%m%d%H%M%S")
  mkdir -p "$DATA_DIR/backups"
  cp "$DATA_DIR/app.db" "$DATA_DIR/backups/app.db.$TIMESTAMP"
  ok "Backed up DB to $DATA_DIR/backups/app.db.$TIMESTAMP"
fi

# ----------------------------
# Initialize DB (if db_init.py exists)
# ----------------------------
info "Initializing database if db_init.py exists..."
source "$VENV_DIR/bin/activate"
if [ -f "$CURRENT_DIR/backend/app/db_init.py" ]; then
  python -c "import sys; sys.path.insert(0,'$CURRENT_DIR/backend'); import app.db_init as dbinit; dbinit.init_db()" || {
    warn "Module-style db init failed; trying direct script run..."
    python "$CURRENT_DIR/backend/app/db_init.py" || warn "DB init script failed."
  }
else
  warn "No db_init.py found; skip DB initialization."
fi
deactivate

# ----------------------------
# Build frontend if present
# ----------------------------
if [ -d "$CURRENT_DIR/frontend" ]; then
  info "Building frontend..."
  cd "$CURRENT_DIR/frontend"
  if command -v yarn >/dev/null 2>&1; then
    sudo -u "$USER" yarn install --silent --network-concurrency 1 || {
      warn "yarn install failed; trying npm install"
      sudo -u "$USER" npm ci --silent --no-audit --progress=false || sudo -u "$USER" npm install --silent
    }
    sudo -u "$USER" yarn build || sudo -u "$USER" npm run build
  else
    sudo -u "$USER" npm ci --silent --no-audit --progress=false || sudo -u "$USER" npm install --silent
    sudo -u "$USER" npm run build || warn "npm run build failed"
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
    warn "Frontend build output not found (dist/build/out)."
  fi

  # ensure uploads persisted outside build
  mkdir -p "$UPLOADS_DIR"
  chown -R "$USER:$USER" "$UPLOADS_DIR"
  rm -rf "$CURRENT_DIR/backend/app/static/uploads" || true
  ln -sfn "$UPLOADS_DIR" "$CURRENT_DIR/backend/app/static/uploads" || true
  chown -R "$USER:$USER" "$CURRENT_DIR/backend/app/static" || true
  ok "Frontend build copied."
else
  warn "No frontend directory; skipping frontend build."
fi

# ----------------------------
# Systemd service install
# ----------------------------
if [ -f "$CURRENT_DIR/$SYSTEMD_SRC" ]; then
  info "Installing systemd unit..."
  cp "$CURRENT_DIR/$SYSTEMD_SRC" "$SYSTEMD_UNIT"
  # ensure unit uses the created venv and runs as $USER
  sed -i "s|/opt/component-storage/venv/bin/uvicorn|$VENV_DIR/bin/uvicorn|g" "$SYSTEMD_UNIT" || true
  sed -i "s|User=.*|User=$USER|g" "$SYSTEMD_UNIT" || true
  sed -i "s|Group=.*|Group=$USER|g" "$SYSTEMD_UNIT" || true
  systemctl daemon-reload
  systemctl enable --now "$SERVICE_NAME" || true
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    ok "Service $SERVICE_NAME enabled and started."
  else
    warn "Service installed but not running. Check: journalctl -u $SERVICE_NAME -n 200"
  fi
else
  warn "No systemd unit found in repo; skipping service install."
fi

# ----------------------------
# Nginx site config
# ----------------------------
if [ -f "$CURRENT_DIR/$NGINX_CONF_SRC" ]; then
  info "Installing nginx site configuration..."
  cp "$CURRENT_DIR/$NGINX_CONF_SRC" "$NGINX_SITE"
  ln -fs "$NGINX_SITE" "$NGINX_SITE_ENABLED"
  if nginx -t; then
    systemctl reload nginx || true
    ok "nginx site enabled and reloaded."
  else
    warn "nginx configuration test failed; check $NGINX_SITE"
  fi
else
  warn "No nginx config in repo at $NGINX_CONF_SRC"
fi

# ----------------------------
# Ownership & permissions
# ----------------------------
info "Setting final ownership and permissions..."
chown -R "$USER:$USER" "$INSTALL_DIR"
chown -R "$USER:$USER" "$DATA_DIR"
chmod -R u+rwX,go-rwx "$DATA_DIR"
ok "Permissions applied."

# ----------------------------
# Access URL hint
# ----------------------------
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
echo "Uploads dir: $UPLOADS_DIR"
echo -e "Open the app in your browser: \e[1m$ACCESS_URL\e[0m"
echo
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -n 200 --no-pager"
echo "  tail -n 200 /var/log/nginx/error.log"
echo "-----------------------------------------"

exit 0
