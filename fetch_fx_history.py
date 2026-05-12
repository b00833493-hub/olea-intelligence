#!/usr/bin/env python3
"""
OLEA Intelligence — Historique 1 an de taux de change (pour graphiques)
========================================================================
Source : Yahoo Finance (gratuit, sans clé, illimité raisonnable).
Pour chaque paire EUR/XXX (et USD/XXX), fetch 1 an de cotations quotidiennes.

Format URL : https://query1.finance.yahoo.com/v8/finance/chart/EURXYZ=X?period1=...&period2=...&interval=1d

Sortie : fx_history.json
{
  "generated_at": "...",
  "base": "EUR",
  "pairs": {
    "USD": [{"d":"2025-05-12","r":1.0844}, ...],
    "MAD": [...],
    ...
  },
  "secondary_base": "USD",  # pour conversions cross
  "pairs_usd": { ... même structure ... }
}
"""
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT = Path(__file__).parent / "fx_history.json"
TIMEOUT = 20
RETRIES = 3
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36"

# Devises à historiser : toutes les devises locales OLEA + standards
TARGETS = [
    # Réserve / standard
    "USD",
    # Africaines (XOF/XAF peggées EUR, on les laisse de côté — ligne plate inutile)
    "MAD", "TND", "DZD", "NGN", "GHS", "GNF", "MRU",
    "KES", "TZS", "UGX", "ETB", "RWF", "BIF",
    "AOA", "ZAR", "ZMW", "MWK", "MZN",
    "MGA", "MUR", "BWP", "NAD",
    # SLE, LRD, CDF, ZWG : Yahoo a parfois des trous, on tente quand même
    "SLL", "LRD", "CDF", "ZWL",
]

def fetch_pair(base, quote, period1, period2):
    """Récupère une série daily Yahoo Finance EUR/XYZ ou USD/XYZ."""
    symbol = f"{base}{quote}=X"
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?period1={period1}&period2={period2}&interval=1d"
    )
    last_err = None
    for attempt in range(RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            res = payload.get("chart", {}).get("result", [])
            if not res:
                return []
            r = res[0]
            ts = r.get("timestamp") or []
            quote_block = r.get("indicators", {}).get("quote", [])
            if not quote_block:
                return []
            closes = quote_block[0].get("close") or []
            out = []
            for t, c in zip(ts, closes):
                if c is None:
                    continue
                d = datetime.fromtimestamp(t, tz=timezone.utc).strftime("%Y-%m-%d")
                out.append({"d": d, "r": round(c, 6)})
            # Dédoublonne par date (Yahoo peut renvoyer 2 ticks pour la même journée)
            dedup = {}
            for p in out: dedup[p["d"]] = p["r"]
            return [{"d": d, "r": r} for d, r in sorted(dedup.items())]
        except Exception as e:
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    print(f"   ✗ {base}/{quote} : {type(last_err).__name__}")
    return []

def main():
    print("┌─ OLEA Intelligence · historique FX 1 an (Yahoo Finance)")

    now = int(time.time())
    one_year_ago = now - 365 * 24 * 3600

    pairs_eur = {}
    pairs_usd = {}

    print(f"│  Période : {datetime.fromtimestamp(one_year_ago)} → maintenant")
    print(f"│")
    print(f"│  Fetching EUR/* :")
    for ccy in TARGETS:
        ts = fetch_pair("EUR", ccy, one_year_ago, now)
        if ts:
            pairs_eur[ccy] = ts
            print(f"│   ✓ EUR/{ccy} : {len(ts)} points")
        time.sleep(0.25)  # gentle

    print(f"│")
    print(f"│  Fetching USD/* (pour conversions cross) :")
    # On fait USD/* en plus pour permettre cross-conversions sans EUR
    for ccy in TARGETS:
        if ccy == "USD": continue
        ts = fetch_pair("USD", ccy, one_year_ago, now)
        if ts:
            pairs_usd[ccy] = ts
            print(f"│   ✓ USD/{ccy} : {len(ts)} points")
        time.sleep(0.25)

    # Ajoute EUR/EUR = 1 trivialement
    pairs_eur["EUR"] = [{"d": p["d"], "r": 1.0} for p in (pairs_eur.get("USD") or [])]

    # XOF/XAF pegged EUR : on fabrique la ligne plate (655.957)
    for peg in ["XOF", "XAF"]:
        pairs_eur[peg] = [{"d": p["d"], "r": 655.957} for p in (pairs_eur.get("USD") or [])]

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "provider": {
            "name": "Yahoo Finance",
            "url": "https://finance.yahoo.com",
            "interval": "1d",
            "period_days": 365,
        },
        "pairs": pairs_eur,        # 1 EUR = X (devise)
        "pairs_usd": pairs_usd,    # 1 USD = X (devise)
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"│")
    print(f"│  → {len(pairs_eur)} séries EUR/* · {len(pairs_usd)} séries USD/*")
    print(f"└─ ✓ fx_history.json écrit ({OUT.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
