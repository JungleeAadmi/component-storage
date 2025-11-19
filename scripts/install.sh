#!/usr/bin/env bash
set -euo pipefail

# Component Storage installer (robust)
# Repo: https://github.com/JungleeAadmi/component-storage.git
# Locations:
#   /opt/component-storage/current  -> app code
#   /var/lib/component-storage      -> data (db, uploads, backups)
#   /etc/component-storage/.env     -> runtime config

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

info "Starting Component Storage installer (robust, python3.12-aware)."

# detect distro
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO_ID=${ID,,}
else
  DISTRO_ID=""
fi

if [[ "$DISTRO_ID" != "debian" && "$DISTRO_ID" != "ubuntu" && "$DISTRO_ID" != "linuxmint" && "$DISTRO_ID" != "pop" && "$DISTRO_ID" != "raspbian" ]]; then
  warn "This installer targets Debian/Ubuntu derivatives. It may still work, but not guaranteed."
fi

info "Running apt update & upgrade..."
apt-get update -y
apt-get upgrade -y

info "Installing base prerequisites..."
apt-get install -y --no-install-recommends \
  git curl ca-certificates gnupg lsb-release software-properties-common \
  python3 python3-venv python3-pip build-essential pkg-config \
  libssl-dev apt-transport-https

ok "Base packages installed."

# Node.js
if command -v node >/dev/null 2>&1; then
  ok "Node present: $(node -v)"
else
  info "Installing Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  ok "Node installed: $(node -v || echo unknown)"
fi

# npm/yarn checks
if command -v npm >/dev/null 2>&1; then ok "npm: $(npm -v)"; else warn "npm missing"; fi
if command -v yarn >/dev/null 2>&1; then ok "yarn: $(yarn -v)"; else warn "yarn not installed (using npm)"; fi

# nginx (install non-interactively)
if command -v nginx >/dev/null 2>&1; then ok "nginx: $(nginx -v 2>&1 | head -n1)"; else
  info "Installing nginx..."
  apt-get install -y nginx
  systemctl enable --now nginx
  ok "nginx installed"
fi

# create user & directories
if ! id -u $USER >/dev/null 2>&1; then
  info "Creating system user $USER"
  useradd --system --no-create-home --shell /usr/sbin/nologin $USER
fi

info "Creating directories..."
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR" "$UPLOADS_DIR"
chown -R $USER:$USER "$INSTALL_DIR" "$DATA_DIR" "$CONFIG_DIR"
chmod 750 "$DATA_DIR" "$UPLOADS_DIR"

# git safe.directory (avoid dubious ownership)
if command -v git >/dev/null 2>&1; then
  if ! git config --global --get-all safe.directory | grep -qx "$CURRENT_DIR"; then
    info "Adding $CURRENT_DIR to git safe.directory"
    git config --global --add safe.directory "$CURRENT_DIR" || true
  fi
fi

# clone or update repo
if [ -d "$CURRENT_DIR/.git" ]; then
  info "Repository present; fetching latest..."
  git -C "$CURRENT_DIR" fetch --all --tags || true
  git -C "$CURRENT_DIR" reset --hard origin/main || true
else
  info "Cloning repository..."
  git clone "$REPO" "$CURRENT_DIR"
  chown -R $USER:$USER "$CURRENT_DIR"
  git config --global --add safe.directory "$CURRENT_DIR" || true
fi

# Prefer python3.12 for venv (install if missing)
if ! command -v python3.12 >/dev/null 2>&1; then
  info "python3.12 not found. Installing via deadsnakes PPA..."
  add-apt-repository -y ppa:deadsnakes/ppa || true
  apt-get update -y
  apt-get install -y python3.12 python3.12-venv python3.12-dev || {
    warn "Failed to install python3.12 via deadsnakes. Installer will fall back to system python3."
  }
else
  ok "python3.12 available"
fi

# pick python binary for venv (prefer python3.12)
PY_BIN="/usr/bin/python3"
if command -v python3.12 >/dev/null 2>&1; then
  PY_BIN="$(command -v python3.12)"
fi
info "Using $PY_BIN to create venv at $VENV_DIR"

# recreate venv if python mismatch or missing
if [ -d "$VENV_DIR" ]; then
  # check venv python version
  VENV_PY="$VENV_DIR/bin/python"
  if [ -x "$VENV_PY" ]; then
    CUR_VER=$("$VENV_PY" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))' 2>/dev/null || echo "")
    WANT_VER=$($PY_BIN -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
    if [ "$CUR_VER" != "$WANT_VER" ]; then
      info "Existing venv Python ($CUR_VER) differs from desired ($WANT_VER) — recreating venv."
      rm -rf "$VENV_DIR"
    else
      ok "Existing venv Python matches desired ($WANT_VER)."
    fi
  else
    rm -rf "$VENV_DIR"
  fi
fi

if [ ! -d "$VENV_DIR" ]; then
  "$PY_BIN" -m venv "$VENV_DIR"
  ok "Virtualenv created with $PY_BIN"
fi

# activate venv
source "$VENV_DIR/bin/activate"
pip install --upgrade pip setuptools wheel

# set PYO3 forward-compat for Python >= 3.13 (safeguard)
PY_VSTR=$("$VENV_DIR/bin/python" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
PY_MAJOR=$(echo "$PY_VSTR" | cut -d. -f1)
PY_MINOR=$(echo "$PY_VSTR" | cut -d. -f2)
if [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -ge 13 ]; then
  info "Python $PY_VSTR detected; exporting PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 (helps pyo3 builds)."
  export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
fi

# determine requirements path (prefer backend/requirements.txt)
REQ=""
if [ -f "$CURRENT_DIR/backend/requirements.txt" ]; then
  REQ="$CURRENT_DIR/backend/requirements.txt"
elif [ -f "$CURRENT_DIR/backend/app/requirements.txt" ]; then
  REQ="$CURRENT_DIR/backend/app/requirements.txt"
fi

# If pydantic-core build is needed and cargo not present, install rustup minimally
# We do this just before pip install so we know whether a build might run.
if [ -n "$REQ" ]; then
  # quick pre-check: if requirements mention pydantic or pydantic-core and cargo missing -> prepare rust
  if (grep -Eiq "pydantic|pydantic-core" "$REQ") && ! command -v cargo >/dev/null 2>&1; then
    info "pydantic present in requirements and cargo not found — installing rustup (minimal) to allow wheel build."
    apt-get install -y curl build-essential || true
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y || warn "rustup install failed; continuing (may still work if wheels available)."
    # ensure cargo in PATH for this shell
    if [ -f "$HOME/.cargo/env" ]; then
      # shellcheck disable=SC1090
      . "$HOME/.cargo/env"
    fi
  fi

  info "Installing Python dependencies from $REQ ..."
  if ! pip install -r "$REQ"; then
    warn "pip install failed for $REQ — see pip output above. Attempting pip with --no-build-isolation as fallback."
    pip install --no-build-isolation -r "$REQ" || {
      err "pip install failed - please check network, build tools or Python version. Exiting."
      deactivate
      exit 1
    }
  fi
else
  warn "No requirements file found; installing a default minimal set (it's highly recommended to commit backend/requirements.txt)."
  pip install fastapi==0.110.0 uvicorn[standard]==0.30.1 sqlalchemy==2.0.29 pydantic==2.7.1 \
    pydantic-settings==2.2.1 python-multipart==0.0.9 jinja2==3.1.3 aiofiles==23.2.1 python-dotenv==1.0.1 || true
fi

deactivate
ok "Python environment ready."

# create .env from example if provided
if [ -f "$CURRENT_DIR/.env.example" ]; then
  if [ ! -f "$CONFIG_DIR/.env" ]; then
    info "Creating $CONFIG_DIR/.env from .env.example"
    cp "$CURRENT_DIR/.env.example" "$CONFIG_DIR/.env"
    chown $USER:$USER "$CONFIG_DIR/.env"
    chmod 640 "$CONFIG_DIR/.env"
    ok "Created $CONFIG_DIR/.env (edit as required)"
  else
    info "$CONFIG_DIR/.env already exists - skipping"
  fi
else
  warn "No .env.example found in repo. Create $CONFIG_DIR/.env manually if needed."
fi

# backup existing DB
if [ -f "$DATA_DIR/app.db" ]; then
  TIMESTAMP=$(date +"%Y%m%d%H%M%S")
  mkdir -p "$DATA_DIR/backups"
  cp "$DATA_DIR/app.db" "$DATA_DIR/backups/app.db.$TIMESTAMP"
  ok "Backed up DB to $DATA_DIR/backups/app.db.$TIMESTAMP"
fi

# initialize DB (robust invocation)
info "Initializing database (if db_init.py exists)..."
source "$VENV_DIR/bin/activate"
if [ -f "$CURRENT_DIR/backend/app/db_init.py" ]; then
  python -c "import sys; sys.path.insert(0,'$CURRENT_DIR/backend'); import app.db_init as dbinit; dbinit.init_db()" || {
    warn "Module init failed, trying script execution..."
    python "$CURRENT_DIR/backend/app/db_init.py" || warn "DB init script failed."
  }
else
  warn "db_init.py not found; skipping DB init."
fi
deactivate

# build frontend
if [ -d "$CURRENT_DIR/frontend" ]; then
  info "Building frontend..."
  cd "$CURRENT_DIR/frontend"
  if command -v yarn >/dev/null 2>&1; then
    sudo -u $USER yarn install --silent --network-concurrency 1 || {
      warn "yarn install failed; falling back to npm"
      sudo -u $USER npm ci --silent --no-audit --progress=false || sudo -u $USER npm install --silent
    }
    sudo -u $USER yarn build || sudo -u $USER npm run build
  else
    sudo -u $USER npm ci --silent --no-audit --progress=false || sudo -u $USER npm install --silent
    sudo -u $USER npm run build
  fi

  info "Copying frontend build to backend static..."
  mkdir -p "$CURRENT_DIR/backend/app/static"
  rm -rf "$CURRENT_DIR/backend/app/static/"* || true
  if [ -d "$CURRENT_DIR/frontend/dist" ]; then
    cp -r "$CURRENT_DIR/frontend/dist/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/build" ]; then
    cp -r "$CURRENT_DIR/frontend/build/"* "$CURRENT_DIR/backend/app/static/" || true
  elif [ -d "$CURRENT_DIR/frontend/out" ]; then
    cp -r "$CURRENT_DIR/frontend/out/"* "$CURRENT_DIR/backend/app/static/" || true
  else
    warn "Frontend build output not found (dist|build|out)."
  fi

  # ensure uploads persistence
  mkdir -p "$CURRENT_DIR/backend/app/static/uploads"
  chown -R $USER:$USER "$CURRENT_DIR/backend/app/static" "$UPLOADS_DIR"
  if [ -e "$CURRENT_DIR/backend/app/static/uploads" ]; then
    rm -rf "$CURRENT_DIR/backend/app/static/uploads"
  fi
  ln -sfn "$UPLOADS_DIR" "$CURRENT_DIR/backend/app/static/uploads" || true

  ok "Frontend build copied."
else
  warn "No frontend directory found; skipping frontend build."
fi

# systemd service
if [ -f "$CURRENT_DIR/systemd/component-storage.service" ]; then
  info "Installing systemd unit..."
  cp "$CURRENT_DIR/systemd/component-storage.service" "$SYSTEMD_UNIT"
  sed -i "s|/opt/component-storage/venv/bin/uvicorn|$VENV_DIR/bin/uvicorn|" "$SYSTEMD_UNIT" || true
  sed -i "s|User=.*|User=$USER|g" "$SYSTEMD_UNIT" || true
  sed -i "s|Group=.*|Group=$USER|g" "$SYSTEMD_UNIT" || true
  systemctl daemon-reload
  systemctl enable --now $SERVICE_NAME || true
  if systemctl is-active --quiet $SERVICE_NAME; then
    ok "Service $SERVICE_NAME enabled & running."
  else
    warn "Service installed but not active. Check logs with: journalctl -u $SERVICE_NAME -n 200"
  fi
else
  warn "systemd unit not found; skipping service install."
fi

# nginx site
if [ -f "$CURRENT_DIR/$NGINX_CONF_SRC" ]; then
  info "Installing nginx site config..."
  cp "$CURRENT_DIR/$NGINX_CONF_SRC" "$NGINX_SITE"
  ln -fs "$NGINX_SITE" "$NGINX_SITE_ENABLED"
  if nginx -t; then
    systemctl reload nginx
    ok "nginx config installed."
  else
    warn "nginx test failed; check $NGINX_SITE"
  fi
else
  warn "nginx site config not found in repo at $NGINX_CONF_SRC"
fi

# final perms
info "Setting final ownership & permissions..."
chown -R $USER:$USER "$INSTALL_DIR"
chown -R $USER:$USER "$DATA_DIR"
chmod -R u+rwX,go-rwx "$DATA_DIR"
ok "Permissions applied."

# detect server IP for access URL
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
ok "Installation complete."
echo "-----------------------------------------"
echo "Service: $SERVICE_NAME"
if systemctl is-active --quiet $SERVICE_NAME; then ok "Service running"; else warn "Service not running - check journalctl"; fi
echo "DB path: $DATA_DIR/app.db"
echo "Uploads: $UPLOADS_DIR"
echo -e "Open the app at: \e[1m$ACCESS_URL\e[0m"
echo
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -f"
echo "  sudo tail -n 200 /var/log/nginx/error.log"
echo "-----------------------------------------"
