#!/usr/bin/env bash  
set -e  
# OR, if you’re not using Docker:  
cd client && npm ci && npm run build  
cd ../server && npm ci && npm run build  
pm2 reload ecosystem.config.js