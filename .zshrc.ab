export QF_RECURSIVE_OK=1

hp() {
  local ORIG="$PWD"

  # Find git repo root
  local ROOT
  ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "Not inside a git repo"
    return 1
  }

  local SRC="$ROOT/src"

  # Jump to src
  cd "$SRC" || { echo "Failed to cd to $SRC"; return 1; }

  # Sanity check
  if [[ ! -f "index.html" ]]; then
    echo "index.html not found in $SRC"
    cd "$ORIG"
    return 1
  fi

  echo "Uploading src/index.html to R2..."
  wrangler r2 object put cdn/index.html --file index.html --remote

  # Return to original dir
  cd "$ORIG"
}


alias d='pnpm run deploy'