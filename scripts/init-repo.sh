#!/usr/bin/env bash
set -e

# Initialize git repo and create initial commit
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "Initial scaffold of sound-creator Nx workspace"
  echo 'Created initial git repo (run `git remote add origin <url>` to add remote)'
else
  echo 'Git repo already initialized'
fi

# Install root dependencies with pnpm
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  echo "pnpm not installed; falling back to npm install (recommended: install pnpm)"
  npm install
fi

echo 'Repository initialized. Use `docker-compose up --build` to build and run containers.'
