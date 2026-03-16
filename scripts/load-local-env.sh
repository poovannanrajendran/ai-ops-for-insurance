#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for env_file in "$REPO_ROOT/.env.local" "$REPO_ROOT/.env.symphony.local"; do
  if [ -f "$env_file" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        ''|'#'*)
          continue
          ;;
      esac

      if [[ "$line" != *=* ]]; then
        continue
      fi

      key="${line%%=*}"
      value="${line#*=}"

      if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        continue
      fi

      export "$key=$value"
    done < "$env_file"
  fi
done
