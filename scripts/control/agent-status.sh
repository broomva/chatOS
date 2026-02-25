#!/usr/bin/env bash
set -euo pipefail

# Agent Status — reads .agent/ directory and outputs runtime metrics
# Usage: bash scripts/control/agent-status.sh [state-dir]

STATE_DIR="${1:-.agent}"

if [ ! -d "$STATE_DIR" ]; then
  echo "agent_state_dir_exists=false"
  echo "total_sessions=0"
  echo "total_messages=0"
  echo "total_observations=0"
  exit 0
fi

echo "agent_state_dir_exists=true"
echo "state_dir=$STATE_DIR"

# Count sessions
if [ -d "$STATE_DIR/sessions" ]; then
  SESSIONS=$(find "$STATE_DIR/sessions" -name "meta.json" 2>/dev/null | wc -l | tr -d ' ')
else
  SESSIONS=0
fi
echo "total_sessions=$SESSIONS"

# Count messages
if [ -d "$STATE_DIR/sessions" ]; then
  MESSAGES=$(find "$STATE_DIR/sessions" -path "*/messages/*.json" 2>/dev/null | wc -l | tr -d ' ')
else
  MESSAGES=0
fi
echo "total_messages=$MESSAGES"

# Count observations
if [ -d "$STATE_DIR/observations" ]; then
  OBSERVATIONS=$(find "$STATE_DIR/observations" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
else
  OBSERVATIONS=0
fi
echo "total_observations=$OBSERVATIONS"

# Count memory items
if [ -d "$STATE_DIR/memory" ]; then
  MEMORY=$(find "$STATE_DIR/memory" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
else
  MEMORY=0
fi
echo "total_memory_items=$MEMORY"

# Check for schema
if [ -f "$STATE_DIR/schema.json" ]; then
  echo "schema_exists=true"
else
  echo "schema_exists=false"
fi

# Platform breakdown (from session meta files)
if [ "$SESSIONS" -gt 0 ]; then
  echo "# Platform breakdown:"
  find "$STATE_DIR/sessions" -name "meta.json" -exec grep -h '"platform"' {} \; 2>/dev/null \
    | sed 's/.*"platform"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' \
    | sort | uniq -c | sort -rn \
    | while read -r count platform; do
        echo "platform_${platform}=${count}"
      done
fi

echo "# Agent status collected at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
