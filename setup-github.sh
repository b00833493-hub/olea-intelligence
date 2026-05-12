#!/bin/bash
# OLEA Intelligence — initialise un repo Git et guide pour le push vers GitHub.
# Une fois en place, le workflow .github/workflows/refresh.yml refetch
# automatiquement les news toutes les heures, et GitHub Pages redéploie.

set -e
cd "$(dirname "$0")"

cyan()   { printf "\033[36m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
red()    { printf "\033[31m%s\033[0m\n" "$*"; }

echo ""
echo "┌─────────────────────────────────────────────────────────────"
echo "│  OLEA Intelligence · setup CI/CD"
echo "└─────────────────────────────────────────────────────────────"
echo ""

# ─── 1. Vérifs préliminaires ──────────────────────────────────────
if ! command -v git >/dev/null 2>&1; then
  red "✗ git n'est pas installé."
  exit 1
fi

if [ -d .git ]; then
  yellow "→ Repo git déjà initialisé ici. Skip init."
else
  cyan "→ Initialisation du repo git…"
  git init -b main
  git config user.email "${GIT_EMAIL:-felix@local}"
  git config user.name  "${GIT_NAME:-Felix}"
fi

# ─── 2. Première mise sous git ────────────────────────────────────
cyan "→ Staging des fichiers projet…"
git add .gitignore .github _headers robots.txt \
        index.html styles.css app.js data.js gate.js \
        news.json fetch_news.py \
        start.sh package.sh set-password.sh setup-github.sh \
        assets/ 2>/dev/null || true

if git diff --cached --quiet; then
  yellow "→ Rien de neuf à committer."
else
  git commit -m "OLEA Intelligence · version initiale" >/dev/null
  green "  ✓ Commit initial créé."
fi

# ─── 3. Instructions pour la suite ────────────────────────────────
echo ""
green "════════════════════════════════════════════════════════════════"
green "  Étapes manuelles suivantes"
green "════════════════════════════════════════════════════════════════"
echo ""
cyan  "  1. Crée un repo (privé recommandé) sur GitHub :"
echo  "     ▸ https://github.com/new"
echo  "     ▸ Nom suggéré : olea-intelligence"
echo  "     ▸ NE coche AUCUNE option (pas de README, pas de licence)"
echo ""
cyan  "  2. Lie ce dossier au repo distant (remplace TON-USER) :"
echo  "     git remote add origin https://github.com/TON-USER/olea-intelligence.git"
echo  "     git push -u origin main"
echo ""
cyan  "  3. Active GitHub Pages :"
echo  "     ▸ Repo → Settings → Pages"
echo  "     ▸ Source : « Deploy from a branch »"
echo  "     ▸ Branch : main, dossier : / (root)"
echo  "     ▸ Save  →  URL publiée : https://TON-USER.github.io/olea-intelligence/"
echo ""
cyan  "  4. Vérifie que le workflow tourne :"
echo  "     ▸ Repo → Actions → onglet « Refresh news »"
echo  "     ▸ Clique « Run workflow » pour un test immédiat (sinon, cron horaire)"
echo ""
yellow "  💡 Sécurité : si ton repo est PUBLIC, le hash SHA-256 du code"
yellow "     d'accès est visible — toujours déchiffrable par brute-force"
yellow "     sur un mot de passe court. Préfère un repo PRIVÉ ; GitHub Pages"
yellow "     reste accessible en privé (avec GH Pro) ou bascule sur Netlify"
yellow "     (cf. plus bas)."
echo ""
cyan  "  ↺ Alternative Netlify (au lieu de GitHub Pages) :"
echo  "     ▸ https://app.netlify.com → « Import from Git » → choisir le repo"
echo  "     ▸ Build command : (vide)        |  Publish dir : .  (point)"
echo  "     ▸ Netlify auto-deploy à chaque commit. URL Netlify Drop-like."
echo ""
green "  ✓ Setup terminé. Le bot bossera pour toi toutes les heures."
echo ""
