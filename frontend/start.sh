#!/usr/bin/env bash
# One-shot frontend launcher.
set -e
cd "$(dirname "$0")"
echo "==> Stopping anything on port 5173..."
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null || true
echo "==> Installing dependencies..."
npm install
echo "==> Starting frontend at http://localhost:5173 ..."
npm run dev
