#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.githooks"
GIT_DIR="$REPO_ROOT/.git"

if [ ! -d "$GIT_DIR" ]; then
  echo "ERROR: not a git repository"
  exit 1
fi

git config core.hooksPath "$HOOKS_DIR"
chmod +x "$HOOKS_DIR"/*
echo "Git hooks installed from $HOOKS_DIR"
