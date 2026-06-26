#!/usr/bin/env bash
#
# Sobe backend (FastAPI/uvicorn) + frontend (Vite) juntos.
# Ctrl+C derruba os dois.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACK="$ROOT/back"
FRONT="$ROOT/front"

# --- Backend: venv + deps ---
echo ">> Backend: preparando venv"
if [ ! -d "$BACK/.venv" ]; then
  python3 -m venv "$BACK/.venv"
fi
# shellcheck disable=SC1091
source "$BACK/.venv/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet -r "$BACK/requirements.txt"

# --- Frontend: deps ---
echo ">> Frontend: instalando deps"
if [ ! -d "$FRONT/node_modules" ]; then
  (cd "$FRONT" && npm install)
fi

# --- Sobe os dois, derruba ambos no Ctrl+C ---
PIDS=()
cleanup() {
  echo ""
  echo ">> Encerrando..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

echo ">> Backend  -> http://localhost:8000"
(cd "$BACK" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload) &
PIDS+=($!)

echo ">> Frontend -> http://localhost:5173"
(cd "$FRONT" && npm run dev) &
PIDS+=($!)

wait
