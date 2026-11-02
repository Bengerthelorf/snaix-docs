#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$root_dir/content"

clone_product() {
  local slug="$1" repo="$2" dest="$root_dir/content/$1"
  if [ -e "$dest" ]; then
    [ -f "$dest/docs/docs.config.ts" ] || {
      echo "Existing $dest is missing docs/docs.config.ts; inspect it before retrying." >&2
      exit 1
    }
    echo "Keeping existing content/$slug"
  else
    git clone --depth 1 "https://github.com/Bengerthelorf/$repo.git" "$dest"
  fi
}

clone_product bcmr bcmr
clone_product claudit Claudit
clone_product pikpaktui pikpaktui
clone_product iconchanger macIconChanger
