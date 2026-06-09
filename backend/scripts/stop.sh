#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "Stopping autisense-backend..."
pm2 stop autisense-backend
pm2 save

echo "Backend stopped."
