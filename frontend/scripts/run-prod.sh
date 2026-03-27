#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/dpr-teksys/frontend/dpr-web"
PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

cd "$APP_DIR"

/usr/bin/npm run build
exec /usr/bin/npm run start -- --hostname "$HOST" --port "$PORT"
