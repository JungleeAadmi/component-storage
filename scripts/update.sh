#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="/opt/component-storage/current"
DATA_DIR="/var/lib/component-storage"
VENV_DIR="/opt/component-storage/venv"
SERVICE_NAME="component-storage"
USER="component-storage"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

echo "==== Component Storage updater ===="

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root."
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Repo not found at $REPO_DIR. Run install first."
  exit 1
fi

# backup DB
mkdir -p "$DATA_DIR/backups"
if [ -f "$DATA_DIR/app.db" ]; then
  cp "$DATA_DIR/app.db" "$DATA_DIR/backups/app.db.$TIMESTAMP"
  echo "DB backup created: $DATA_DIR/backups/app.db.$TIMESTAMP"
fi

# pull latest code
git -C "$REPO_DIR" fetch --all
git -C "$REPO_DIR" reset --hard origin/main

# update venv deps
source "$VENV_DIR/bin/activate"
pip install -r "$REPO_DIR/backend/requirements.txt"
deactivate

# rebuild frontend if exists
if [ -d "$REPO_DIR/frontend" ]; then
  cd "$REPO_DIR/frontend"
  if command -v yarn >/dev/null 2>&1; then
    sudo -u $USER yarn install --silent
    sudo -u $USER yarn build
  else
    sudo -u $USER npm ci --silent
    sudo -u $USER npm run build
  fi
  mkdir -p "$REPO_DIR/backend/app/static"
  rm -rf "$REPO_DIR/backend/app/static/*" || true
  cp -r "$REPO_DIR/frontend/dist/"* "$REPO_DIR/backend/app/static/" || true
  chown -R $USER:$USER "$REPO_DIR/backend/app/static"
fi

# restart service
systemctl restart $SERVICE_NAME || {
  echo "Failed to restart $SERVICE_NAME - check logs"
  exit 1
}

echo "Update complete."
