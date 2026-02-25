#!/usr/bin/env bash
set -euo pipefail
echo "=== RECOVER: cleaning and reinstalling ==="
rm -rf node_modules .turbo apps/*/node_modules packages/*/node_modules
rm -rf apps/*/.next apps/*/.turbo packages/*/dist
bun install
turbo run build --no-daemon
echo "recovery complete"
