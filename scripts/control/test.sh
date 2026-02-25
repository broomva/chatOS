#!/usr/bin/env bash
set -euo pipefail
echo "=== TEST: full verification ==="
bash "$(dirname "$0")/check.sh"
turbo run test --no-daemon
echo "test passed"
