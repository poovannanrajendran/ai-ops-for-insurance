#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
hyphen_pattern='[\x{2010}\x{2011}\x{2012}\x{2013}\x{2014}\x{2212}\x{00AD}]'

echo "Scanning for Unicode hyphen-like characters under:"
echo "  $repo_root"
echo
echo "Characters matched:"
echo "  U+2010 HYPHEN"
echo "  U+2011 NON-BREAKING HYPHEN"
echo "  U+2012 FIGURE DASH"
echo "  U+2013 EN DASH"
echo "  U+2014 EM DASH"
echo "  U+2212 MINUS SIGN"
echo "  U+00AD SOFT HYPHEN"
echo

echo "File and directory names:"
find "$repo_root" \
  \( -path "$repo_root/.git" -o -path "$repo_root/node_modules" \) -prune -o -print |
  perl -CS -ne "chomp; print qq{  \$_\n} if /$hyphen_pattern/;" || true

echo
echo "Tracked text file contents:"
if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "$repo_root" grep -nIP "$hyphen_pattern" -- . ':(exclude)node_modules' || true
else
  rg -n --hidden --pcre2 \
    --glob '!node_modules/**' \
    --glob '!.git/**' \
    "$hyphen_pattern" \
    "$repo_root" || true
fi
