#!/bin/sh
# Husky helper (lightweight shim for pre-commit script to load environment)
set -e
if [ -z "$HUSKY" ]; then
  export HUSKY=1
fi
_dir="$(cd "$(dirname "$0")" && pwd)"
exec "$@"
