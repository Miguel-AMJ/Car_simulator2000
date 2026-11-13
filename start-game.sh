#!/usr/bin/env bash
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale o Node.js 20+ e tente novamente."
  exit 1
fi
npm install
npm start
