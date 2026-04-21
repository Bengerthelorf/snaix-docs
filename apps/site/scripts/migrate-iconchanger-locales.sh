#!/usr/bin/env bash
# Restore iconchanger docs translations dropped in the VitePress→snaix
# migration (commit 6ba516d). Rebuild them in the snaix layout
# (docs/<loc>/*.md + docs/<loc>/cli/*.md) with frontmatter added.

set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/../../.." && pwd)/content/iconchanger"
cd "$repo_dir"

pre_sha='6ba516d^'

order_of() {
  case "$1" in
    getting-started) echo 1 ;;
    setup) echo 2 ;;
    changing-icons) echo 3 ;;
    aliases) echo 4 ;;
    display-settings) echo 5 ;;
    background-service) echo 6 ;;
    api-key) echo 7 ;;
    import-export) echo 8 ;;
    *) echo '' ;;
  esac
}

locales='ar cs da de el es fi fr hi hu id it ja ko ms nb nl pl pt ro ru sv th tr uk vi zh-HK'

write_with_frontmatter() {
  local src_sha="$1"
  local out_path="$2"
  local section="$3"
  local order_num="$4"
  local locale="$5"

  mkdir -p "$(dirname "$out_path")"

  local raw
  raw="$(git show "$src_sha" 2>/dev/null)" || return 1

  local title
  title="$(printf '%s\n' "$raw" | awk '/^# / {sub(/^# +/,""); print; exit}')"
  if [ -z "$title" ]; then
    title="$(basename "$out_path" .md)"
  fi

  local body
  body="$(printf '%s\n' "$raw" | awk 'BEGIN{stripped=0} /^# / && !stripped { stripped=1; next } { print }')"

  {
    printf -- '---\n'
    printf 'title: %s\n' "$title"
    printf 'section: %s\n' "$section"
    [ -n "$order_num" ] && printf 'order: %s\n' "$order_num"
    printf 'locale: %s\n' "$locale"
    printf -- '---\n'
    printf '%s' "$body"
  } > "$out_path"
}

total=0
for loc in $locales; do
  dest="docs/$loc"

  for slug in getting-started setup changing-icons aliases display-settings background-service api-key import-export; do
    src="$pre_sha:docs/$loc/guide/$slug.md"
    if git cat-file -e "$src" 2>/dev/null; then
      write_with_frontmatter "$src" "$dest/$slug.md" guide "$(order_of "$slug")" "$loc"
      total=$((total + 1))
    fi
  done

  for name in index commands; do
    src="$pre_sha:docs/$loc/cli/$name.md"
    if git cat-file -e "$src" 2>/dev/null; then
      write_with_frontmatter "$src" "$dest/cli/$name.md" cli '' "$loc"
      total=$((total + 1))
    fi
  done
done

echo "migrated $total files across $(echo "$locales" | wc -w | xargs) locales"
