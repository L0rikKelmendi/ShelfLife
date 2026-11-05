#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if node -e 'if(Number(process.versions.node.split(".")[0])!==24)process.exit(1)' 2>/dev/null; then
  exec node node_modules/expo/bin/cli start --go "$@"
fi
exec npx --yes --package=node@24 node node_modules/expo/bin/cli start --go "$@"
