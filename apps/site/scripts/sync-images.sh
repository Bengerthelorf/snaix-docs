#!/usr/bin/env bash
set -euo pipefail

site_dir="$(cd "$(dirname "$0")/.." && pwd)"
root_dir="$(cd "$site_dir/../.." && pwd)"

cd "$root_dir"

for slug in bcmr claudit pikpaktui iconchanger; do
  src="content/$slug"
  dest="$site_dir/public/$slug/images"
  [ -d "$src/docs" ] || continue
  rm -rf "$dest"
  mkdir -p "$dest"
  while IFS= read -r -d '' f; do
    cp "$f" "$dest/"
  done < <(find "$src/docs" -type f \
    \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \
    -o -name "*.svg" -o -name "*.gif" -o -name "*.webp" \) -print0)
done
