#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ! command -v node >/dev/null 2>&1; then
  printf 'PaperPal requires Node.js 22.12 or newer. Install it from https://nodejs.org.\n'
  exit 1
fi
cd "$SCRIPT_DIR"
exec node "$SCRIPT_DIR/setup.mjs" "$@"
