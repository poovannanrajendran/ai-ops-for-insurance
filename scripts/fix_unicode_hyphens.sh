#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
rename_root_dir=false

if [[ "${1:-}" == "--rename-root-dir" ]]; then
  rename_root_dir=true
fi

replace_hyphens() {
  perl -CS -i -pe 's/[\x{2010}\x{2011}\x{2012}\x{2013}\x{2014}\x{2212}\x{00AD}]/-/g' "$@"
}

echo "Normalizing Unicode hyphen-like characters in tracked text files..."

if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  while IFS= read -r file; do
    replace_hyphens "$repo_root/$file"
  done < <(git -C "$repo_root" grep -Il .)
else
  while IFS= read -r file; do
    replace_hyphens "$file"
  done < <(
    find "$repo_root" -type f \
      ! -path "$repo_root/.git/*" \
      ! -path "$repo_root/node_modules/*"
  )
fi

echo "Text replacement complete."

if [[ "$rename_root_dir" != true ]]; then
  echo
  echo "Repo directory rename skipped."
  echo "Run with --rename-root-dir to also rename the repo folder itself."
  exit 0
fi

current_dir="$repo_root"
parent_dir="$(dirname "$current_dir")"
current_name="$(basename "$current_dir")"
ascii_name="$(
  printf '%s' "$current_name" |
    perl -CS -pe 's/[\x{2010}\x{2011}\x{2012}\x{2013}\x{2014}\x{2212}\x{00AD}]/-/g'
)"

if [[ "$current_name" == "$ascii_name" ]]; then
  echo
  echo "Repo directory name is already ASCII-safe: $current_name"
  exit 0
fi

target_dir="$parent_dir/$ascii_name"

if [[ -e "$target_dir" ]]; then
  echo
  echo "Cannot rename repo directory because target already exists:"
  echo "  $target_dir"
  exit 1
fi

echo
echo "Renaming repo directory:"
echo "  from: $current_dir"
echo "  to:   $target_dir"

mv "$current_dir" "$target_dir"

echo
echo "Rename complete."
echo "Change into the new directory before running more commands:"
echo "  cd \"$target_dir\""
