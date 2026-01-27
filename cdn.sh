hp() {
  local ORIG="$PWD"

  local ROOT
  ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "Not inside a git repo"
    return 1
  }

  local SRC="$ROOT/src"
  local WRANGLER="$ROOT/wrangler.jsonc"

  cd "$SRC" || { echo "Failed to cd to $SRC"; return 1; }

  if [[ ! -f "index.html" ]]; then
    echo "index.html not found in $SRC"
    cd "$ORIG"
    return 1
  fi

  # Detect bucket
  local BUCKET
  BUCKET=$(
    sed 's://.*$::' "$WRANGLER" |
    sed 's:/\*.*\*/::g' |
    tr -d '\n' |
    grep -o '"bucket_name"[[:space:]]*:[[:space:]]*"[^"]*"' |
    head -n1 |
    sed 's/.*"bucket_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/'
  )

  if [[ -z "$BUCKET" ]]; then
    echo "Could not detect R2 bucket from wrangler.jsonc"
    cd "$ORIG"
    return 1
  fi

  echo "Bucket: $BUCKET"
  echo "Uploading index.html → R2"

  wrangler r2 object put "$BUCKET/index.html" --file index.html --remote

  cd "$ORIG"
}


alias d='pnpm run deploy'