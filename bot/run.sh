#!/usr/bin/env bash
# Yuerta Stock Agent — run wrapper.
# Default: --dry-run (no transactions). Pass --live only after contracts are
# deployed and bot/addresses.json exists.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node bot/agent.js "$@"
