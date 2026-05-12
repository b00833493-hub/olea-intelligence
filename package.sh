#!/bin/bash
# Construit un zip déployable sur Netlify Drop / Cloudflare Pages / Vercel.
# Exclut les outils internes (fetcher Python, scripts, .claude/, etc.)
set -e
cd "$(dirname "$0")"

OUT="olea-intelligence-deploy.zip"
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo ""
echo "┌─ Construction du package déployable"
echo "│"

# 1) Rafraîchit les news avant packaging
if [ -f fetch_news.py ]; then
  echo "│  → fetch_news.py (peut prendre 15-25s)"
  python3 fetch_news.py | sed 's/^/│  /'
fi

# 2) Copie uniquement les assets nécessaires
mkdir -p "$TMPDIR/olea-intelligence"
cp index.html  "$TMPDIR/olea-intelligence/"
cp styles.css  "$TMPDIR/olea-intelligence/"
cp data.js     "$TMPDIR/olea-intelligence/"
cp app.js      "$TMPDIR/olea-intelligence/"
cp gate.js     "$TMPDIR/olea-intelligence/"
cp news.json   "$TMPDIR/olea-intelligence/"
cp -R assets   "$TMPDIR/olea-intelligence/"

# Fichier _headers pour Netlify (no-index par robots + cache mediocre)
cat > "$TMPDIR/olea-intelligence/_headers" <<'EOF'
/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Referrer-Policy: no-referrer
  X-Frame-Options: SAMEORIGIN
  Cache-Control: no-cache, no-store, must-revalidate
EOF

# robots.txt pour bloquer les crawlers
cat > "$TMPDIR/olea-intelligence/robots.txt" <<'EOF'
User-agent: *
Disallow: /
EOF

# 3) Zip
rm -f "$OUT"
(cd "$TMPDIR" && zip -qr "$OLDPWD/$OUT" olea-intelligence)

SIZE=$(du -h "$OUT" | cut -f1)
echo "│"
echo "│  ✓ $OUT créé ($SIZE)"
echo "│"
echo "│  Déploiement le plus rapide (sans compte) :"
echo "│   1. Ouvre   https://app.netlify.com/drop"
echo "│   2. Glisse $OUT dans la zone (Netlify dézippera tout seul)"
echo "│   3. Tu obtiens une URL  https://xxx.netlify.app"
echo "│   4. (optionnel) Crée un compte gratuit pour renommer l'URL"
echo "│"
echo "│  Envoie au prospect :"
echo "│   • Le lien Netlify (e-mail OK)"
echo "│   • Le code d'accès — séparément, par un autre canal (verbal / SMS / WhatsApp)"
echo "│"
echo "└─"
