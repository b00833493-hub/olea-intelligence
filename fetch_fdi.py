#!/usr/bin/env python3
"""
OLEA Intelligence — Investissements Directs Étrangers (IDE) par marché
=======================================================================
Source : World Bank Open Data API (gratuit, sans clé, illimité)
Indicateur : BX.KLT.DINV.CD.WD — Foreign Direct Investment, net inflows (BoP, current US$)

Récupère les 10 dernières années pour chaque marché OLEA, identifie la dernière
valeur disponible, calcule la tendance YoY et la moyenne 5 ans.

Sortie : fdi.json
"""
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).parent / "fdi.json"
INDICATOR = "BX.KLT.DINV.CD.WD"
START_YEAR = 2015
END_YEAR = datetime.now().year
USER_AGENT = "OLEA-Intelligence-FDI/1.0"
TIMEOUT = 60
RETRIES = 3

# Codes ISO alpha-3 des marchés OLEA (filiales + partenariats)
OLEA_CODES = [
    "CIV","SEN","MLI","BFA","BEN","TGO","NER","GIN","SLE","LBR","GHA","MRT",
    "MAR","TUN","DZA","CMR","GAB","COG","TCD","KEN","TZA","UGA","AGO","NAM",
    "BWA","ZAF","NGA","COD","CAF","GNQ","ETH","RWA","BDI","ZMB","ZWE","MWI",
    "MOZ","MDG","MUS",
]

# La World Bank accepte plusieurs codes séparés par ";". On découpe par batch
# pour éviter une URL trop longue (sécurité).
BATCH_SIZE = 20

def fetch_batch(codes):
    """Récupère les données IDE pour une liste de codes avec retry."""
    url = (
        f"https://api.worldbank.org/v2/country/{';'.join(codes)}/indicator/{INDICATOR}"
        f"?format=json&per_page=500&date={START_YEAR}:{END_YEAR}"
    )
    last_err = None
    for attempt in range(RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            if not isinstance(data, list) or len(data) < 2 or data[1] is None:
                return []
            return data[1]
        except Exception as e:
            last_err = e
            import time; time.sleep(2 * (attempt + 1))
    raise last_err

def main():
    print("┌─ OLEA Intelligence · IDE (Investissements Directs Étrangers)")
    print(f"│  Source : World Bank Open Data — indicateur {INDICATOR}")
    print(f"│  Période : {START_YEAR}–{END_YEAR}")

    all_rows = []
    for i in range(0, len(OLEA_CODES), BATCH_SIZE):
        batch = OLEA_CODES[i:i+BATCH_SIZE]
        print(f"│  → batch {i//BATCH_SIZE+1} : {len(batch)} pays…", end="", flush=True)
        try:
            rows = fetch_batch(batch)
            all_rows.extend(rows)
            print(f" {len(rows)} obs")
        except Exception as e:
            print(f" ✗ {type(e).__name__}")

    # Regroupe par pays : historique trié par année + dernière valeur non-null
    per_country = {}
    for r in all_rows:
        code = r.get("countryiso3code")
        if not code: continue
        year  = int(r["date"]) if r.get("date") else None
        value = r.get("value")
        per_country.setdefault(code, []).append({"year": year, "value": value})

    countries = {}
    for code in OLEA_CODES:
        rows = sorted(per_country.get(code, []), key=lambda x: x["year"] or 0)
        non_null = [r for r in rows if r["value"] is not None]
        latest = non_null[-1] if non_null else None
        previous = non_null[-2] if len(non_null) >= 2 else None
        # Moyenne 5 dernières valeurs non-null
        last5 = non_null[-5:]
        avg5 = sum(r["value"] for r in last5) / len(last5) if last5 else None
        # YoY (%)
        yoy_pct = None
        if latest and previous and previous["value"] not in (0, None):
            yoy_pct = (latest["value"] - previous["value"]) / abs(previous["value"]) * 100
        countries[code] = {
            "latest": latest,         # {year, value} en USD
            "previous": previous,
            "yoy_pct": yoy_pct,
            "avg_5y_usd": avg5,
            "history": rows,
        }

    # Stats globales
    total_latest = sum(c["latest"]["value"] for c in countries.values() if c["latest"] and c["latest"]["value"])
    covered = sum(1 for c in countries.values() if c["latest"])
    print(f"│  → {covered}/{len(OLEA_CODES)} pays avec donnée IDE")
    print(f"│  → Flux IDE total agrégé (dernières années dispo) : ${total_latest:,.0f} USD")

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "indicator": {
            "id": INDICATOR,
            "name": "Foreign Direct Investment, net inflows (BoP, current US$)",
            "name_fr": "Investissements directs étrangers, entrées nettes (BdP, USD courants)",
            "source": "World Bank — World Development Indicators",
            "source_url": f"https://api.worldbank.org/v2/indicator/{INDICATOR}",
        },
        "coverage_count": covered,
        "total_latest_usd": total_latest,
        "countries": countries,
    }

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"└─ ✓ fdi.json écrit ({OUT.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
