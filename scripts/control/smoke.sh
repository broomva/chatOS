#!/usr/bin/env bash
set -euo pipefail
echo "=== SMOKE: env + build sanity ==="
command -v bun >/dev/null 2>&1 || { echo "ERROR: bun not found"; exit 1; }
command -v turbo >/dev/null 2>&1 || { echo "ERROR: turbo not found"; exit 1; }
test -f package.json || { echo "ERROR: not in repo root"; exit 1; }
bun install --frozen-lockfile 2>/dev/null || bun install
echo "smoke passed"
