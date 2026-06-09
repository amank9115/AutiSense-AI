#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "Building application..."
npm run build

echo "Starting PM2 cluster..."
pm2 start ecosystem.config.js --env production

echo "Saving PM2 process list..."
pm2 save

echo "Backend started. Run 'pm2 status' to verify."
