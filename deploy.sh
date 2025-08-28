#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Optional: load env vars from .env into the environment
if [ -f .env ]; then
  export $(grep -v '^\s*#' .env | xargs)
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== $(date '+%Y-%m-%d %H:%M:%S') Starting deploy ==="

# 1) Build client
echo "-- Building client --"
cd client
npm ci
npm run build

# 2) Build server
echo "-- Building server --"
cd ../server
npm ci
npm run build

# 3) (Re)start both processes with PM2
echo "-- Reloading PM2 processes --"
cd "$ROOT_DIR"
pm2 startOrReload ecosystem.config.js --env production

echo "=== $(date '+%Y-%m-%d %H:%M:%S') Deploy finished ==="