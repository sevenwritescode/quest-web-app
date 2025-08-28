#!/bin/bash

# Deploy script for quest-web-app
# This script pulls the latest code, builds the application, and starts it

# Error handling
set -e

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Directory of this script
APP_DIR="$(dirname "$(realpath "$0")")"

log "Starting deployment of quest-web-app"
log "Working directory: $APP_DIR"

# Navigate to app directory
cd "$APP_DIR"

# Pull latest changes
log "Pulling latest code from repository..."
git pull
log "Code updated successfully"

# Install dependencies
log "Installing dependencies..."
npm install  # Use npm or yarn depending on your project
log "Dependencies installed successfully"

# Build the application
log "Building the application..."
npm run build  # Adjust build command according to your project
log "Build completed successfully"

# Stop any running instance
log "Checking for running instances..."
if [ -f ".pid" ]; then
    OLD_PID=$(cat .pid)
    if ps -p "$OLD_PID" > /dev/null; then
        log "Stopping existing application (PID: $OLD_PID)"
        kill "$OLD_PID"
        sleep 2
    fi
    rm .pid
fi

# Start the application
log "Starting the application..."
# Modify the start command according to your project:
nohup npm start > app.log 2>&1 &
# Save the process ID
echo $! > .pid
log "Application started with PID: $(cat .pid)"

log "Deployment completed successfully"