#!/usr/bin/env bash
set -euo pipefail
cd /home/deploy/quest-web-app

# update from origin
git fetch --all --prune
git reset --hard origin/main

# install deps & build
npm ci
npm run build

# restart app: prefer pm2 if available, else fallback to systemd
if command -v pm2 >/dev/null 2>&1; then
  # If you use an ecosystem file: pm2 reload ecosystem.config.js --env production
  # Otherwise try to restart existing process named "app", or start it:
  if pm2 describe app >/dev/null 2>&1; then
    pm2 reload app || pm2 restart app
  else
    # start via npm start; adjust to your start script / name
    pm2 start npm --name "app" -- start
  fi
  pm2 save
else
  # fallback to systemd unit name "myapp.service" (see next section)
  sudo systemctl restart myapp.service || true
fi

echo "deploy finished: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
