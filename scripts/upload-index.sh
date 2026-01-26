#!/usr/bin/env bash
set -e

ROOT=$(git rev-parse --show-toplevel)
SRC="$ROOT/src"
FILE="$SRC/index.html"

if [[ ! -f "$FILE" ]]; then
  echo "index.html not found at $FILE"
  exit 1
fi

echo "Uploading src/index.html to R2…"
wrangler r2 object put abc/index.html --file "$FILE" --remote
echo "Uploaded index.html to R2"
