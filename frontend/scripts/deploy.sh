#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/dpr-teksys/frontend/dpr-web"
SERVICE_NAME="dpr-next.service"
APP_USER="teksys"
APP_GROUP="teksys"

cd "$APP_DIR"

echo "[deploy] removing old build artifacts"
rm -rf .next

echo "[deploy] ensuring app ownership for service user"
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

echo "[deploy] restarting live systemd service"
systemctl restart "$SERVICE_NAME"

echo "[deploy] service status"
systemctl status "$SERVICE_NAME" --no-pager -l
