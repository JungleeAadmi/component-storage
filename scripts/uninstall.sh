#!/usr/bin/env bash
set -euo pipefail
INSTALL_DIR="/opt/component-storage"
DATA_DIR="/var/lib/component-storage"
CONFIG_DIR="/etc/component-storage"
SERVICE_NAME="component-storage"

PURGE=false
if [ "${1:-}" = "--purge" ]; then
  PURGE=true
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root."
  exit 1
fi

echo "Stopping service if running..."
systemctl stop $SERVICE_NAME || true
systemctl disable $SERVICE_NAME || true
rm -f /etc/systemd/system/${SERVICE_NAME}.service
systemctl daemon-reload

echo "Removing application files in $INSTALL_DIR and config in $CONFIG_DIR..."
rm -rf "$INSTALL_DIR"
rm -rf "$CONFIG_DIR"

if [ "$PURGE" = true ]; then
  echo "Purging data directory $DATA_DIR (this will delete the DB and uploads)"
  rm -rf "$DATA_DIR"
else
  echo "Leaving data dir $DATA_DIR intact. Use --purge to delete it."
fi

echo "Uninstall complete."
