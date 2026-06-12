#!/bin/sh
set -eu

BUNDLED_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if command -v node >/dev/null 2>&1; then
  exec node server.mjs
elif [ -x "$BUNDLED_NODE" ]; then
  exec "$BUNDLED_NODE" server.mjs
else
  echo "Node.js 20 or newer is required." >&2
  exit 1
fi
