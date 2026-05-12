#!/usr/bin/env python3
"""
OLEA Intelligence — Taux de change EUR → devises locales
==========================================================
Source : open.er-api.com (ExchangeRate-API, niveau gratuit, sans clé, MAJ ECB quotidienne)
Pas de limite de requêtes documentée pour ce niveau. Mise à jour 1×/jour côté API.
Sortie : fx.json
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).parent / "fx.json"
API = "https://open.er-api.com/v6/latest/EUR"
TIMEOUT = 15

# Devises locales par marché OLEA (ISO 4217)
COUNTRY_CURRENCY = {
    # West Africa
    "CIV": "XOF", "SEN": "XOF", "MLI": "XOF", "BFA": "XOF",
    "BEN": "XOF", "TGO": "XOF", "NER": "XOF",
    "GIN": "GNF", "SLE": "SLE", "LBR": "LRD",
    "GHA": "GHS", "NGA": "NGN", "MRT": "MRU",
    # North Africa
    "MAR": "MAD", "TUN": "TND", "DZA": "DZD",
    # Central Africa
    "CMR": "XAF", "GAB": "XAF", "COG": "XAF", "TCD": "XAF",
    "CAF": "XAF", "GNQ": "XAF",
    "COD": "CDF",
    # East Africa
    "KEN": "KES", "TZA": "TZS", "UGA": "UGX",
    "ETH": "ETB", "RWA": "RWF", "BDI": "BIF",
    # Southern Africa
    "AGO": "AOA", "NAM": "NAD", "BWA": "BWP", "ZAF": "ZAR",
    "ZMB": "ZMW", "ZWE": "ZWG", "MWI": "MWK", "MOZ": "MZN",
    # Indian Ocean
    "MDG": "MGA", "MUS": "MUR",
}

# Métadonnées affichables par code ISO 4217
CURRENCY_META = {
    "XOF": {"name": "Franc CFA BCEAO",            "symbol": "FCFA", "pegged_eur": 655.957},
    "XAF": {"name": "Franc CFA BEAC",             "symbol": "FCFA", "pegged_eur": 655.957},
    "MAD": {"name": "Dirham marocain",            "symbol": "DH"},
    "TND": {"name": "Dinar tunisien",             "symbol": "DT"},
    "DZD": {"name": "Dinar algérien",             "symbol": "DA"},
    "NGN": {"name": "Naira nigérian",             "symbol": "₦"},
    "GHS": {"name": "Cedi ghanéen",               "symbol": "GH₵"},
    "GNF": {"name": "Franc guinéen",              "symbol": "FG"},
    "SLE": {"name": "Leone (Sierra Leone)",       "symbol": "Le"},
    "LRD": {"name": "Dollar libérien",            "symbol": "L$"},
    "MRU": {"name": "Ouguiya mauritanien",        "symbol": "UM"},
    "CDF": {"name": "Franc congolais",            "symbol": "FC"},
    "KES": {"name": "Shilling kényan",            "symbol": "KSh"},
    "TZS": {"name": "Shilling tanzanien",         "symbol": "TSh"},
    "UGX": {"name": "Shilling ougandais",         "symbol": "USh"},
    "ETB": {"name": "Birr éthiopien",             "symbol": "Br"},
    "RWF": {"name": "Franc rwandais",             "symbol": "FRw"},
    "BIF": {"name": "Franc burundais",            "symbol": "FBu"},
    "AOA": {"name": "Kwanza angolais",            "symbol": "Kz"},
    "NAD": {"name": "Dollar namibien",            "symbol": "N$"},
    "BWP": {"name": "Pula botswanais",            "symbol": "P"},
    "ZAR": {"name": "Rand sud-africain",          "symbol": "R"},
    "ZMW": {"name": "Kwacha zambien",             "symbol": "ZK"},
    "ZWG": {"name": "Zimbabwe Gold",              "symbol": "ZiG"},
    "MWK": {"name": "Kwacha malawite",            "symbol": "MK"},
    "MZN": {"name": "Metical mozambicain",        "symbol": "MT"},
    "MGA": {"name": "Ariary malgache",            "symbol": "Ar"},
    "MUR": {"name": "Roupie mauricienne",         "symbol": "₨"},
}

USER_AGENT = "OLEA-Intelligence-FX/1.0 (https://github.com/b00833493-hub/olea-intelligence)"

def main():
    print("┌─ OLEA Intelligence · taux de change EUR → marchés OLEA")
    print(f"│  Source : open.er-api.com (gratuit, MAJ quotidienne ECB)")

    req = urllib.request.Request(API, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    if body.get("result") != "success":
        print(f"│  ✗ API erreur : {body}")
        sys.exit(1)

    rates_all = body.get("rates", {})
    api_updated = body.get("time_last_update_utc")
    api_next    = body.get("time_next_update_utc")

    # Extrait uniquement les devises OLEA + EUR (référence)
    needed = set(COUNTRY_CURRENCY.values())
    rates = {ccy: rates_all[ccy] for ccy in needed if ccy in rates_all}
    missing = sorted(needed - set(rates.keys()))

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base": "EUR",
        "provider": {
            "name": "ExchangeRate-API",
            "url": "https://www.exchangerate-api.com",
            "endpoint": API,
            "api_updated_utc": api_updated,
            "api_next_update_utc": api_next,
        },
        "country_currency": COUNTRY_CURRENCY,
        "currency_meta": {c: CURRENCY_META[c] for c in CURRENCY_META if c in needed},
        "rates": rates,
        "missing": missing,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"│  → {len(rates)} taux récupérés sur {len(needed)} devises OLEA")
    if missing:
        print(f"│  → ⚠ manquant côté API : {', '.join(missing)}")
    print(f"│  → MAJ source API : {api_updated}")
    print(f"│  → Prochaine MAJ  : {api_next}")
    print(f"└─ ✓ fx.json écrit ({OUT.stat().st_size} octets)")

if __name__ == "__main__":
    main()
