#!/usr/bin/env bash
set -euo pipefail
echo "=== CHECK: lint + typecheck ==="
bash "$(dirname "$0")/smoke.sh"
turbo run lint --no-daemon
turbo run check-types --no-daemon
echo "check passed"
