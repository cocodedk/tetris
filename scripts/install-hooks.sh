#!/usr/bin/env bash
# Make the hooks in .githooks/ executable and point git at them.
# Run: bash scripts/install-hooks.sh
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
chmod +x "$root"/.githooks/*
git -C "$root" config core.hooksPath .githooks
echo "Hooks installed: core.hooksPath = .githooks"
