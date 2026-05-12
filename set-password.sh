#!/bin/bash
# Change le code d'accès du gate.
# Usage : ./set-password.sh
set -e
cd "$(dirname "$0")"

if [ ! -f gate.js ]; then
  echo "✗ gate.js introuvable."; exit 1
fi

echo ""
echo "┌─ OLEA Intelligence · changement du code d'accès"
echo "│"
read -srp "│  Nouveau code (saisie masquée) : " pwd1
echo ""
read -srp "│  Confirmer : " pwd2
echo ""

if [ -z "$pwd1" ]; then echo "│  ✗ Code vide, abandon."; exit 1; fi
if [ "$pwd1" != "$pwd2" ]; then echo "│  ✗ Les deux saisies diffèrent, abandon."; exit 1; fi

hash=$(python3 -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].encode()).hexdigest())" "$pwd1")

# Remplace la valeur de EXPECTED_HASH dans gate.js
python3 -c "
import re, pathlib
p = pathlib.Path('gate.js')
text = p.read_text()
new = re.sub(r'const EXPECTED_HASH = \"[^\"]+\"', 'const EXPECTED_HASH = \"$hash\"', text, count=1)
p.write_text(new)
"

echo "│"
echo "│  ✓ Code d'accès mis à jour."
echo "│  ✓ Hash SHA-256 enregistré : ${hash:0:20}…"
echo "│"
echo "│  N'oublie pas de :"
echo "│   1. Re-zipper le projet  → ./package.sh"
echo "│   2. Re-déployer sur ton hébergeur"
echo "│   3. Communiquer le nouveau code verbalement (jamais dans le même canal que le lien)"
echo "└─"
