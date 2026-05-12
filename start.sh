#!/bin/bash
# OLEA Intelligence — démarrage local avec auto-refresh des news
set -e
cd "$(dirname "$0")"

PORT="${PORT:-8765}"
FETCH_INTERVAL_MIN="${FETCH_INTERVAL_MIN:-10}"   # surchargeable : FETCH_INTERVAL_MIN=5 ./start.sh

echo ""
echo "┌─────────────────────────────────────────────────────────────"
echo "│  OLEA Intelligence · démarrage"
echo "└─────────────────────────────────────────────────────────────"
echo ""

# 1) Refresh initial si news.json absent ou trop vieux (>10 min)
NEED_REFRESH=0
if [ ! -f news.json ]; then
  NEED_REFRESH=1
else
  AGE=$(( $(date +%s) - $(stat -f %m news.json 2>/dev/null || stat -c %Y news.json) ))
  if [ "$AGE" -gt 600 ]; then NEED_REFRESH=1; fi
fi
if [ "$NEED_REFRESH" -eq 1 ]; then
  echo "→ Refresh initial des news (15-25s)…"
  python3 fetch_news.py
  echo ""
fi

# 2) Boucle de rafraîchissement en arrière-plan
(
  while true; do
    sleep $(( FETCH_INTERVAL_MIN * 60 ))
    echo ""
    echo "[$(date '+%H:%M:%S')] ⟳ refresh news (interval ${FETCH_INTERVAL_MIN} min)…"
    python3 fetch_news.py 2>&1 | tail -6 | sed 's/^/  /'
    echo "[$(date '+%H:%M:%S')] ✓ news.json mis à jour"
    echo ""
  done
) &
FETCHER_PID=$!

# Cleanup : tue le fetcher si on Ctrl+C
trap "echo ''; echo '↩ arrêt du fetcher…'; kill $FETCHER_PID 2>/dev/null || true; exit 0" INT TERM EXIT

# 3) Serveur HTTP au premier plan
echo "→ Site disponible sur     : http://localhost:${PORT}"
echo "→ Refresh news automatique : toutes les ${FETCH_INTERVAL_MIN} min"
echo "  (Ctrl+C pour tout arrêter)"
echo ""
python3 -m http.server "$PORT" --bind 127.0.0.1
