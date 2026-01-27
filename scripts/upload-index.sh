#!/usr/bin/env bash
set -e

ROOT=$(git rev-parse --show-toplevel)
SRC="$ROOT/src"
FILE="$SRC/index.html"
README="$ROOT/README.md"

# Check both files exist
if [[ ! -f "$FILE" || ! -f "$README" ]]; then
  echo "Missing file(s):"
  [[ ! -f "$FILE" ]] && echo "  - $FILE"
  [[ ! -f "$README" ]] && echo "  - $README"
  exit 1
fi

echo "Uploading files to R2…"

wrangler r2 object put cdn/index.html --file "$FILE" --remote
wrangler r2 object put cdn/README.md --file "$README" --remote

echo "Uploaded index.html and README.md to R2"
