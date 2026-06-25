#!/usr/bin/env bash
# One-shot backend launcher. Guarantees you run THIS code (not an old server).
set -e
cd "$(dirname "$0")"

echo "==> [1/5] Stopping any old server on port 8000..."
lsof -ti tcp:8000 | xargs kill -9 2>/dev/null || true

echo "==> [2/5] Creating / activating virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

echo "==> [3/5] Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "==> [4/5] Resetting database (schema changed for Improvement 6)..."
rm -f employees.db

echo "==> [5/5] Starting backend at http://localhost:8000 ..."
echo "    (Verify in another terminal:  curl -s http://localhost:8000/openapi.json | grep -o /api/invitations )"
python run.py
