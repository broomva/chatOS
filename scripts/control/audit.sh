#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0
FAIL=0

check_file() {
  if [ -f "$REPO_ROOT/$1" ]; then
    echo "  OK   $1"
    PASS=$((PASS + 1))
  else
    echo "  MISSING  $1"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== CONTROL AUDIT ==="
echo ""
echo "--- Agent docs ---"
check_file "AGENTS.md"
check_file "PLANS.md"
check_file "METALAYER.md"
check_file "CLAUDE.md"

echo ""
echo "--- Control plane ---"
check_file ".control/policy.yaml"
check_file ".control/commands.yaml"
check_file ".control/topology.yaml"

echo ""
echo "--- Control docs ---"
check_file "docs/control/ARCHITECTURE.md"
check_file "docs/control/OBSERVABILITY.md"
check_file "docs/control/CONTROL_LOOP.md"

echo ""
echo "--- Control scripts ---"
check_file "scripts/control/smoke.sh"
check_file "scripts/control/check.sh"
check_file "scripts/control/test.sh"
check_file "scripts/control/recover.sh"
check_file "scripts/control/install_hooks.sh"

echo ""
echo "--- Makefile ---"
check_file "Makefile"
check_file "Makefile.control"

echo ""
echo "--- Metrics ---"
check_file "evals/control-metrics.yaml"

echo ""
echo "--- Git hooks ---"
check_file ".githooks/pre-commit"
check_file ".githooks/pre-push"

echo ""
echo "--- Skills ---"
check_file "skills/chatos-dev/SKILL.md"
check_file "skills/chatos-ai/SKILL.md"
check_file "skills/chatos-deploy/SKILL.md"

echo ""
echo "=== RESULT: $PASS passed, $FAIL missing ==="

if [ "$FAIL" -gt 0 ]; then
  echo "AUDIT FAILED — resolve missing artifacts before proceeding"
  exit 1
fi
echo "AUDIT PASSED"
