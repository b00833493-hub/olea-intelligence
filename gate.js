// ============================================================
// OLEA Intelligence — Gate (code d'accès)
// ============================================================
// Verrou client-side pour pitch confidentiel.
//
// → Soft-security : le hash du code est embarqué côté navigateur.
//   Empêche le partage casual, mais ne remplace pas une vraie auth
//   serveur. Pour un pitch commercial c'est l'usage standard.
//
// → Changer le code d'accès :
//     python3 -c "import hashlib; print(hashlib.sha256(b'TON_CODE').hexdigest())"
//   puis coller le résultat dans EXPECTED_HASH ci-dessous.
//   Ou exécuter ./set-password.sh

const EXPECTED_HASH = "997a2f65ec5d5f2e7166b1b59fea6f11138a92d6bb2a44a135b2fb5030904f8f"; // code généré aléatoirement (cf .access-code-DO-NOT-COMMIT.txt)
const SESSION_KEY   = "olea-intel-unlock";

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function unlock() {
  document.body.classList.remove("locked");
  sessionStorage.setItem(SESSION_KEY, "1");
}

function lock() {
  document.body.classList.add("locked");
}

// Déverrouillage immédiat si la session est déjà ouverte
if (sessionStorage.getItem(SESSION_KEY) === "1") {
  unlock();
} else {
  lock();
}

document.addEventListener("DOMContentLoaded", () => {
  const form  = document.getElementById("gate-form");
  const input = document.getElementById("gate-input");
  const err   = document.getElementById("gate-error");
  const card  = document.querySelector(".gate-card");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    const value = (input.value || "").trim();
    if (!value) return;
    const hash = await sha256Hex(value);
    if (hash === EXPECTED_HASH) {
      unlock();
      // Smooth fade : le CSS gère l'animation
      document.getElementById("gate")?.classList.add("gate-leaving");
      setTimeout(() => { document.getElementById("gate")?.setAttribute("hidden", ""); }, 350);
    } else {
      err.hidden = false;
      card.classList.remove("shake");
      void card.offsetWidth; // re-trigger animation
      card.classList.add("shake");
      input.select();
    }
  });

  // Bouton "déverrouiller" depuis URL ?key=...
  // (pour magic-link-style — optionnel)
  const params = new URLSearchParams(location.search);
  const urlKey = params.get("key");
  if (urlKey) {
    sha256Hex(urlKey).then((h) => {
      if (h === EXPECTED_HASH) {
        unlock();
        document.getElementById("gate")?.setAttribute("hidden", "");
        // Nettoie l'URL pour ne pas laisser le code traîner
        history.replaceState({}, "", location.pathname);
      }
    });
  }
});

// Bouton "verrouiller" (pour démos) — accessible via console : oleaLock()
window.oleaLock = () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
};
