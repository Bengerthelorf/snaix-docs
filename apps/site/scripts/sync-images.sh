#!/usr/bin/env bash
set -euo pipefail

site_dir="$(cd "$(dirname "$0")/.." && pwd)"
root_dir="$(cd "$site_dir/../.." && pwd)"

cd "$root_dir"

# Copy content/{slug}/docs/images/** → public/{slug}/images/** preserving
# the full directory tree so markdown refs like /images/ablation/flow/x.svg
# resolve after the path-prefix rewrite pass.
for slug in bcmr claudit pikpaktui iconchanger; do
  src="content/$slug/docs/images"
  dest="$site_dir/public/$slug/images"
  [ -d "$src" ] || continue

  # Some product repos (iconchanger) nest images as docs/images/images/*.
  # Markdown still refers to /images/foo.png, so treat the inner images/
  # directory as the source root when the outer has no direct image files.
  if [ -d "$src/images" ]; then
    root_files=$(find "$src" -maxdepth 1 -type f \
      \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \
      -o -name "*.svg" -o -name "*.gif" -o -name "*.webp" \) 2>/dev/null)
    if [ -z "$root_files" ]; then
      src="$src/images"
    fi
  fi

  rm -rf "$dest"
  mkdir -p "$dest"
  while IFS= read -r -d '' f; do
    rel="${f#$src/}"
    mkdir -p "$dest/$(dirname "$rel")"
    cp "$f" "$dest/$rel"
  done < <(find "$src" -type f \
    \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \
    -o -name "*.svg" -o -name "*.gif" -o -name "*.webp" \) -print0)
done
