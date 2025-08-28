#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Helper: run with sudo if not root
if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# Optional: load env vars from .env into the environment
if [ -f .env ]; then
  export $(grep -v '^\s*#' .env | xargs)
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== $(date '+%Y-%m-%d %H:%M:%S') Starting deploy ==="

# ──────────────────────────────────────────────────────────────────────────────
# 0) Create ephemeral 1 GB swap
SWAP_FILE=/swapfile.tmp
echo "-- Checking for swap…"
if ! swapon --show --noheadings | grep -q "$SWAP_FILE"; then
  echo "-- Creating 1 GB swap at $SWAP_FILE"
  # try fallocate, fallback to dd
  $SUDO fallocate -l 1G "$SWAP_FILE" 2>/dev/null \
    || $SUDO dd if=/dev/zero of="$SWAP_FILE" bs=1M count=1024 status=progress
  $SUDO chmod 600 "$SWAP_FILE"
  $SUDO mkswap "$SWAP_FILE"
  $SUDO swapon "$SWAP_FILE"
  echo "-- Swap enabled ($(swapon --show))"
else
  echo "-- Swap already active"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 1) Build client
echo "-- Building client --"
cd client
npm ci
npm run build

# ──────────────────────────────────────────────────────────────────────────────
# 2) Build server
echo "-- Building server --"
cd ../server
npm ci
npm run build

# ──────────────────────────────────────────────────────────────────────────────
# 3) (Re)start both processes with PM2
echo "-- Reloading PM2 processes --"
cd "$ROOT_DIR"
pm2 startOrReload ecosystem.config.js --env production

# ──────────────────────────────────────────────────────────────────────────────
# 4) Teardown swap
echo "-- Removing swap --"
if swapon --show --noheadings | grep -q "$SWAP_FILE"; then
  $SUDO swapoff "$SWAP_FILE"
  $SUDO rm -f "$SWAP_FILE"
  echo "-- Swap removed"
else
  echo "-- No swap to remove"
fi

echo "=== $(date '+%Y-%m-%d %H:%M:%S') Deploy finished ==="