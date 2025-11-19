# Component Storage – Self-Hosted Electronic Component Inventory System

A modern, self-hosted full-stack application for organizing electronic components stored in physical trays, partitions, and storage boxes.

Features:
- Custom storage grid layouts
- Unique tray addressing (A1, B3, BIG-A2…)
- Add items with full details
- Fuzzy global search
- QR labels & printable codes
- Local file storage
- One-line install, update, uninstall scripts
- FastAPI backend + React frontend
- SQLite local database

This version is optimized for installation on Linux VMs/LXCs (no Docker).

# Component Storage — Self-hosted Electronic Component Inventory

A modern, self-hosted full-stack inventory system for electronic components.
This repo runs locally on a Linux VM / LXC without Docker.

## Quick install (on target LXC/VM)
Run as root (or via sudo):
```bash
curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/install.sh | sudo bash

```

## Updates

```
curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/update.sh | sudo bash

```
---

```
curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/uninstall.sh | sudo bash
```
---
```
curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/uninstall.sh | sudo bash -- --purge
```

## Project Layout

backend/app/ — FastAPI application files
backend/requirements.txt — Python dependencies
frontend/ — React + Vite frontend (to be scaffolded)
scripts/ — installer, updater, uninstaller
systemd/ — systemd unit file template
nginx/ — example nginx site config
/.env.example — example environment file

## After install

Edit /etc/component-storage/.env to set secrets (SECRET_KEY).
If you have a domain, update /etc/nginx/sites-available/ with nginx/component-storage.conf and enable it.

```
systemctl daemon-reload
systemctl restart component-storage

```

The app runs on 127.0.0.1:8000 by default — use nginx or a reverse proxy to expose externally.



Repository: https://github.com/JungleeAadmi/component-storage.git

