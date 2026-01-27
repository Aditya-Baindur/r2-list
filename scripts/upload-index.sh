#!/usr/bin/env bash
set -e

ROOT=$(git rev-parse --show-toplevel)
SRC="$ROOT/src"
FILE="$SRC/index.html"
README="$ROOT/README.md"
WRANGLER="$ROOT/wrangler.jsonc"

# Check files exist
if [[ ! -f "$FILE" || ! -f "$README" ]]; then
  echo "Missing file(s):"
  [[ ! -f "$FILE" ]] && echo "  - $FILE"
  [[ ! -f "$README" ]] && echo "  - $README"
  exit 1
fi

# Check wrangler.jsonc exists
if [[ ! -f "$WRANGLER" ]]; then
  echo "wrangler.jsonc not found"
  exit 1
fi

# Extract bucket name from wrangler.jsonc (handles jsonc comments)
BUCKET=$(sed 's://.*$::' "$WRANGLER" \
  | tr -d '\n' \
  | sed 's/,/,\n/g' \
  | grep '"bucket_name"' \
  | head -n1 \
  | sed 's/.*"bucket_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [[ -z "$BUCKET" ]]; then
  echo "Could not detect R2 bucket name from wrangler.jsonc"
  exit 1
fi

echo "Detected R2 bucket: $BUCKET"
echo "Uploading files to R2…"

wrangler r2 object put "$BUCKET/index.html" --file "$FILE" --remote
wrangler r2 object put "$BUCKET/README.md" --file "$README" --remote

echo "Uploaded index.html and README.md to R2 → bucket: $BUCKET"
