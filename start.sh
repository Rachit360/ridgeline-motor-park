#!/usr/bin/env bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js LTS from https://nodejs.org first."; exit 1; }
[ -d node_modules ] || npm install
echo "Ridgeline: http://localhost:3000  (staff dashboard: /admin, password: admin)"
npm run dev
