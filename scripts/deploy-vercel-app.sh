#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <app-folder-name>"
  echo "Example: $0 submission-triage-copilot"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="$1"
APP_DIR="$REPO_ROOT/apps/$APP_NAME"

if [ ! -d "$APP_DIR" ]; then
  echo "App directory not found: $APP_DIR"
  exit 1
fi

echo "Deploying app: $APP_NAME"
echo "App directory: $APP_DIR"

vercel --cwd "$APP_DIR" --prod

