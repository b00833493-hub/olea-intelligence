#!/usr/bin/env python3
"""
OLEA Intelligence — Agrégateur de news pan-africain
====================================================

Screen des sources de presse de confiance, dédoublonnage par similarité,
cross-vérification multi-sources, classification par pays OLEA + catégorie
métier (assurance / risque), scoring de sévérité.

Usage : python3 fetch_news.py
Sortie : news.json

Aucune dépendance externe (stdlib uniquement).
"""

import json
import re
import sys
import time
import unicodedata
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from hashlib import md5

OUT_PATH = Path(__file__).parent / "news.json"
USER_AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
              "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 "
              "OLEA-Intelligence-Aggregator/1.0")
TIMEOUT = 12
MAX_AGE_DAYS = 250  # couvre YTD (les news accumulées par le bot horaire)

# =============================================================================
# SOURCES — tier 1 = wire services / pure-play news ; tier 2 = Afrique reconnue
# =============================================================================
SOURCES = [
    # ---- Wire services & grands médias internationaux (tier 1) -------------
    {"id": "bbc-afr",    "name": "BBC Africa",          "tier": 1, "lang": "en",
     "url": "https://feeds.bbci.co.uk/news/world/africa/rss.xml"},
    {"id": "f24-afr",    "name": "France 24 Afrique",   "tier": 1, "lang": "fr",
     "url": "https://www.france24.com/fr/afrique/rss"},
    {"id": "rfi-afr",    "name": "RFI Afrique",         "tier": 1, "lang": "fr",
     "url": "https://www.rfi.fr/fr/afrique/rss"},
    {"id": "aljazeera",  "name": "Al Jazeera",          "tier": 1, "lang": "en",
     "url": "https://www.aljazeera.com/xml/rss/all.xml"},

    # ---- Médias dédiés Afrique (tier 2) ------------------------------------
    {"id": "afnews-en",  "name": "Africanews",          "tier": 2, "lang": "en",
     "url": "https://www.africanews.com/feed/rss"},
    {"id": "afnews-fr",  "name": "Africanews FR",       "tier": 2, "lang": "fr",
     "url": "https://fr.africanews.com/feed/rss"},
    {"id": "ja",         "name": "Jeune Afrique",       "tier": 2, "lang": "fr",
     "url": "https://www.jeuneafrique.com/feed/"},
    {"id": "ecofin",     "name": "Agence Ecofin",       "tier": 2, "lang": "fr",
     "url": "https://www.agenceecofin.com/feed"},
    {"id": "financ-afr", "name": "Financial Afrik",     "tier": 2, "lang": "fr",
     "url": "https://www.financialafrik.com/feed/"},
    {"id": "africa-rep", "name": "The Africa Report",   "tier": 2, "lang": "en",
     "url": "https://www.theafricareport.com/feed/"},

    # ---- Est-Afrique en anglais (tier 2) ----------------------------------
    {"id": "east-afr",   "name": "The East African",       "tier": 2, "lang": "en",
     "url": "https://www.theeastafrican.co.ke/rss.xml"},
    {"id": "addis-fort", "name": "Addis Fortune",          "tier": 2, "lang": "en",
     "url": "https://addisfortune.news/feed/"},
    {"id": "ethio-rep",  "name": "Ethiopian Reporter",     "tier": 2, "lang": "en",
     "url": "https://www.ethiopianreporter.com/feed"},
    {"id": "cio-afr",    "name": "CIO Africa",             "tier": 2, "lang": "en",
     "url": "https://cioafrica.co/feed/"},
    {"id": "daily-mav",  "name": "Daily Maverick",         "tier": 2, "lang": "en",
     "url": "https://www.dailymaverick.co.za/rss"},
    {"id": "further-af", "name": "Further Africa",         "tier": 2, "lang": "en",
     "url": "https://furtherafrica.com/feed/"},

    # ---- Afrique lusophone (tier 2) ---------------------------------------
    {"id": "rfi-pt",     "name": "RFI Português",          "tier": 1, "lang": "pt",
     "url": "https://www.rfi.fr/pt/rss"},
    {"id": "lusa",       "name": "Lusa (Agência)",         "tier": 1, "lang": "pt",
     "url": "https://www.lusa.pt/rss"},
    {"id": "jorn-ang",   "name": "Jornal de Angola",       "tier": 2, "lang": "pt",
     "url": "https://www.jornaldeangola.ao/rss"},
    {"id": "club-moz",   "name": "Club of Mozambique",     "tier": 2, "lang": "en", "force_country": "MOZ",
     "url": "https://clubofmozambique.com/feed/"},
    {"id": "observador", "name": "Observador",             "tier": 2, "lang": "pt",
     "url": "https://observador.pt/seccao/mundo/feed/"},

    # ---- AllAfrica per-country (tier 2, fallback) --------------------------
    # Slugs vérifiés ; les autres sont skippés s'ils ne répondent pas.
    {"id": "aa-civ",     "name": "AllAfrica · Côte d'Ivoire", "tier": 2, "lang": "fr", "force_country": "CIV",
     "url": "https://allafrica.com/tools/headlines/rdf/cotedivoire/headlines.rdf"},
    {"id": "aa-sen",     "name": "AllAfrica · Sénégal",       "tier": 2, "lang": "fr", "force_country": "SEN",
     "url": "https://allafrica.com/tools/headlines/rdf/senegal/headlines.rdf"},
    {"id": "aa-mli",     "name": "AllAfrica · Mali",          "tier": 2, "lang": "fr", "force_country": "MLI",
     "url": "https://allafrica.com/tools/headlines/rdf/mali/headlines.rdf"},
    {"id": "aa-nga",     "name": "AllAfrica · Nigeria",       "tier": 2, "lang": "en", "force_country": "NGA",
     "url": "https://allafrica.com/tools/headlines/rdf/nigeria/headlines.rdf"},
    {"id": "aa-mar",     "name": "AllAfrica · Maroc",         "tier": 2, "lang": "en", "force_country": "MAR",
     "url": "https://allafrica.com/tools/headlines/rdf/morocco/headlines.rdf"},
    {"id": "aa-ken",     "name": "AllAfrica · Kenya",         "tier": 2, "lang": "en", "force_country": "KEN",
     "url": "https://allafrica.com/tools/headlines/rdf/kenya/headlines.rdf"},
    {"id": "aa-tza",     "name": "AllAfrica · Tanzanie",      "tier": 2, "lang": "en", "force_country": "TZA",
     "url": "https://allafrica.com/tools/headlines/rdf/tanzania/headlines.rdf"},
    {"id": "aa-uga",     "name": "AllAfrica · Ouganda",       "tier": 2, "lang": "en", "force_country": "UGA",
     "url": "https://allafrica.com/tools/headlines/rdf/uganda/headlines.rdf"},
    {"id": "aa-zaf",     "name": "AllAfrica · Afrique du Sud","tier": 2, "lang": "en", "force_country": "ZAF",
     "url": "https://allafrica.com/tools/headlines/rdf/southafrica/headlines.rdf"},
    {"id": "aa-moz",     "name": "AllAfrica · Mozambique",    "tier": 2, "lang": "en", "force_country": "MOZ",
     "url": "https://allafrica.com/tools/headlines/rdf/mozambique/headlines.rdf"},
    {"id": "aa-ago",     "name": "AllAfrica · Angola",        "tier": 2, "lang": "en", "force_country": "AGO",
     "url": "https://allafrica.com/tools/headlines/rdf/angola/headlines.rdf"},
]

# =============================================================================
# PAYS OLEA — détection multilingue (nom + capitale + villes + gentilé)
# =============================================================================
COUNTRIES = [
    # ===== FILIALES (26) =====
    {"code": "CIV", "tier": "filiale", "name": "Côte d'Ivoire", "kw": ["côte d'ivoire", "cote d'ivoire", "ivory coast", "ivorian", "ivoirien", "ivoirienne", "abidjan", "yamoussoukro", "bouaké"]},
    {"code": "SEN", "tier": "filiale", "name": "Sénégal",        "kw": ["sénégal", "senegal", "senegalese", "sénégalais", "dakar", "saint-louis", "thiès"]},
    {"code": "MLI", "tier": "filiale", "name": "Mali",           "kw": ["mali ", "malian", "malien", "bamako", "tombouctou", "timbuktu", "gao", "kidal"]},
    {"code": "BFA", "tier": "filiale", "name": "Burkina Faso",   "kw": ["burkina", "burkinabè", "burkinabe", "burkinabé", "ouagadougou", "bobo-dioulasso"]},
    {"code": "BEN", "tier": "filiale", "name": "Bénin",          "kw": ["bénin", "benin ", "beninese", "béninois", "cotonou", "porto-novo"]},
    {"code": "TGO", "tier": "filiale", "name": "Togo",           "kw": ["togo ", "togolese", "togolais", "lomé", "lome", "sokodé"]},
    {"code": "NER", "tier": "filiale", "name": "Niger",          "kw": ["niger ", "nigerien", "nigérien", "niamey", "agadez", "zinder"]},
    {"code": "GIN", "tier": "filiale", "name": "Guinée",         "kw": ["guinée", "guinea ", "guinean", "guinéen", "conakry", "kankan", "nzérékoré"]},
    {"code": "SLE", "tier": "filiale", "name": "Sierra Leone",   "kw": ["sierra leone", "sierra-leone", "sierra leonean", "sierra-léonais", "sierra léonais", "freetown"]},
    {"code": "LBR", "tier": "filiale", "name": "Libéria",        "kw": ["liberia", "libéria", "liberian", "libérien", "monrovia"]},
    {"code": "GHA", "tier": "filiale", "name": "Ghana",          "kw": ["ghana", "ghanaian", "ghanéen", "accra", "kumasi", "tema"]},
    {"code": "MRT", "tier": "filiale", "name": "Mauritanie",     "kw": ["mauritanie", "mauritania", "mauritanien", "mauritanian", "nouakchott", "nouadhibou"]},
    {"code": "MAR", "tier": "filiale", "name": "Maroc",          "kw": ["maroc", "morocco", "moroccan", "marocain", "rabat", "casablanca", "marrakech", "tanger", "fès"]},
    {"code": "TUN", "tier": "filiale", "name": "Tunisie",        "kw": ["tunisie", "tunisia", "tunisian", "tunisien", "tunis", "sfax", "sousse"]},
    {"code": "DZA", "tier": "filiale", "name": "Algérie",        "kw": ["algérie", "algeria", "algerian", "algérien", "alger ", "oran", "constantine"]},
    {"code": "CMR", "tier": "filiale", "name": "Cameroun",       "kw": ["cameroun", "cameroon", "cameroonian", "camerounais", "yaoundé", "yaounde", "douala", "kribi"]},
    {"code": "GAB", "tier": "filiale", "name": "Gabon",          "kw": ["gabon", "gabonese", "gabonais", "libreville", "port-gentil"]},
    {"code": "COG", "tier": "filiale", "name": "Congo",          "kw": ["congo-brazzaville", "republic of congo", "république du congo", "brazzaville", "pointe-noire"]},
    {"code": "TCD", "tier": "filiale", "name": "Tchad",          "kw": ["tchad", "chad ", "chadian", "tchadien", "n'djamena", "ndjamena"]},
    {"code": "KEN", "tier": "filiale", "name": "Kenya",          "kw": ["kenya", "kenyan", "nairobi", "mombasa", "kisumu"]},
    {"code": "TZA", "tier": "filiale", "name": "Tanzanie",       "kw": ["tanzania", "tanzanie", "tanzanian", "tanzanien", "dar es salaam", "dodoma", "zanzibar"]},
    {"code": "UGA", "tier": "filiale", "name": "Ouganda",        "kw": ["uganda", "ouganda", "ugandan", "ougandais", "kampala", "entebbe"]},
    {"code": "AGO", "tier": "filiale", "name": "Angola",         "kw": ["angola", "angolan", "angolais", "luanda", "lobito", "huambo"]},
    {"code": "NAM", "tier": "filiale", "name": "Namibie",        "kw": ["namibie", "namibia", "namibian", "namibien", "windhoek", "walvis bay"]},
    {"code": "BWA", "tier": "filiale", "name": "Botswana",       "kw": ["botswana", "botswanais", "batswana", "gaborone", "francistown"]},
    {"code": "ZAF", "tier": "filiale", "name": "Afrique du Sud", "kw": ["afrique du sud", "south africa", "south african", "sud-africain", "sud africain", "sudafricain", "johannesburg", "johannesbourg", "cape town", "le cap", "pretoria", "durban", "soweto"]},

    # ===== PARTENARIATS (13) =====
    {"code": "NGA", "tier": "partenariat", "name": "Nigéria",        "kw": ["nigeria", "nigerian", "nigérian", "lagos", "abuja", "kano", "ibadan", "port harcourt"]},
    {"code": "COD", "tier": "partenariat", "name": "RD Congo",       "kw": ["rdc", "drc ", "dr congo", "congo-kinshasa", "democratic republic of the congo", "république démocratique du congo", "kinshasa", "lubumbashi", "goma", "bukavu", "kivu"]},
    {"code": "CAF", "tier": "partenariat", "name": "Centrafrique",   "kw": ["centrafrique", "centrafricaine", "central african republic", "centrafricain", "bangui", "rca"]},
    {"code": "GNQ", "tier": "partenariat", "name": "Guinée équatoriale","kw": ["guinée équatoriale", "guinee equatoriale", "equatorial guinea", "malabo", "bata"]},
    {"code": "ETH", "tier": "partenariat", "name": "Éthiopie",       "kw": ["ethiopia", "éthiopie", "ethiopian", "éthiopien", "addis-abeba", "addis ababa"]},
    {"code": "RWA", "tier": "partenariat", "name": "Rwanda",         "kw": ["rwanda", "rwandan", "rwandais", "kigali"]},
    {"code": "BDI", "tier": "partenariat", "name": "Burundi",        "kw": ["burundi", "burundian", "burundais", "bujumbura", "gitega"]},
    {"code": "ZMB", "tier": "partenariat", "name": "Zambie",         "kw": ["zambia", "zambie", "zambian", "zambien", "lusaka", "ndola"]},
    {"code": "ZWE", "tier": "partenariat", "name": "Zimbabwe",       "kw": ["zimbabwe", "zimbabwean", "zimbabwéen", "harare", "bulawayo"]},
    {"code": "MWI", "tier": "partenariat", "name": "Malawi",         "kw": ["malawi", "malawian", "malawien", "lilongwe", "blantyre"]},
    {"code": "MOZ", "tier": "partenariat", "name": "Mozambique",     "kw": ["mozambique", "mozambican", "mozambicain", "maputo", "beira", "pemba", "cabo delgado"]},
    {"code": "MDG", "tier": "partenariat", "name": "Madagascar",     "kw": ["madagascar", "malagasy", "malgache", "antananarivo", "tananarive"]},
    {"code": "MUS", "tier": "partenariat", "name": "Maurice",        "kw": ["mauritius", "île maurice", "maurice ", "mauritian", "port-louis", "port louis"]},
]

# =============================================================================
# CATÉGORIES — orientées courtage / risque assurable
# =============================================================================
CATEGORIES = {
    # Climat & catastrophes naturelles
    "CLIMAT": [
        "cyclone", "typhoon", "tempête", "tornado", "ouragan", "hurricane",
        "inondation", "flood", "flooding", "submersion", "crue",
        "sécheresse", "drought", "famine",
        "séisme", "earthquake", "tremblement", "magnitude",
        "incendie de forêt", "wildfire", "bushfire",
        "climat", "climate change", "réchauffement", "el niño", "el nino",
        "pluies diluviennes", "torrential",
    ],
    # Sinistres majeurs / accidents industriels
    "SINISTRE": [
        "explosion", "incendie", "fire ", "blaze",
        "crash", "écrasé", "naufrage", "shipwreck", "sinking",
        "déraillement", "derailment", "collision",
        "effondrement", "collapse",
        "marée noire", "oil spill", "leak",
        "accident industriel", "industrial accident",
    ],
    # Réglementation assurance / finance
    "REGULATION": [
        "cima", "naicom", "acaps", "ira ", "asac", "fsc", "csbf",
        "régulation", "regulation", "regulator", "régulateur",
        "réforme", "reform", "loi ", "law ", "décret", "decree",
        "solvabilité", "solvency", "capital minimum",
        "central bank", "banque centrale", "bceao", "beac",
        "supervision", "directive", "circulaire",
    ],
    # Politique & sécurité
    "POLITIQUE": [
        "élection", "election", "présidentielle", "presidential",
        "coup", "putsch", "junte", "junta",
        "manifestation", "protest", "émeute", "riot",
        "terroris", "attentat", "attack", "attaque",
        "jihadi", "djihadi", "rebelle", "rebel", "insurrection",
        "couvre-feu", "curfew", "état d'urgence", "state of emergency",
        "sanction", "embargo",
    ],
    # Économie & marchés
    "ECONOMIE": [
        "bourse", "stock exchange", "brvm", "market",
        "inflation", "croissance", "growth", "récession", "recession",
        "fmi", "imf", "banque mondiale", "world bank",
        "pib", "gdp", "dette", "debt", "obligation", "eurobond",
        "monnaie", "currency", "dévaluation", "devaluation",
        "naira", "cedi", "rand", "dirham", "dinar", "shilling",
        "investissement", "investment",
        "pétrole", "oil", "gaz", "gas", "lng",
        "gold", "cobalt", "cuivre", "copper", "uranium",
        "économ", "economy", "economic", "économique",
    ],
    # Cyber & technologie
    "CYBER": [
        "cyber", "piratage", "hack", "hacker", "hacking",
        "ransomware", "rançongiciel", "malware", "phishing",
        "fuite de données", "data leak", "data breach",
        "cyberattaque", "cyberattack",
    ],
    # Santé publique
    "SANTE": [
        "épidémie", "epidemic", "outbreak", "pandemie", "pandemic",
        "ebola", "mpox", "monkeypox", "variole", "lassa",
        "covid", "choléra", "cholera", "rougeole", "measles",
        "vaccination", "vaccin", "vaccine",
        "oms", "who ", "ministère de la santé",
    ],
    # Infrastructure / BTP / transport
    "INFRASTRUCTURE": [
        "aéroport", "airport", "port ", "terminal",
        "autoroute", "highway", "pont ", "bridge",
        "pipeline", "eacop",
        "chemin de fer", "railway", "lgv", "train",
        "barrage", "dam ",
        "centrale", "power plant", "électricité", "electricity",
        "construction", "btp", "infrastructure",
    ],
}

# =============================================================================
# THÈMES RÉGLEMENTAIRES / CONFORMITÉ / JURIDIQUE
# =============================================================================
# Un article peut avoir à la fois une CATEGORY (axe sinistre/économie/etc.)
# ET un THEME (axe réglementaire/conformité). Les deux sont indépendants.
THEMES = {
    "SOLVABILITE": [
        "solvabilité", "solvency", "fonds propres", "capital minimum",
        "orsa", "stress test", "ratio prudentiel", "marge de solvabilité",
        "recapitalisation", "exigence en capital", "own funds",
        "solvency ii", "rbc ", "risk-based capital",
    ],
    "REASSURANCE": [
        "réassurance", "reinsurance", "rétention", "fronting", "cession",
        "cica re", "africa re", "scor ", "munich re", "swiss re",
        "réassureur", "cession obligatoire", "art. 308", "article 308",
    ],
    "PRODUITS_OBL": [
        "assurance obligatoire", "obligatory insurance", "rc décennale",
        "couverture maladie universelle", "cmu ",
        "micro-assurance", "microinsurance", "assurance inclusive",
        "rc auto", "responsabilité civile",
        "assurance santé universelle", "mutuelle de santé",
    ],
    "AML_CFT": [
        "blanchiment", "money laundering", "lcb-ft", "lcbft",
        "kyc", "know your customer", "lutte contre le financement",
        "sanctions", "ofac", "giaba", "menafatf", "gafi", "fatf",
        "tracfin", "déclaration de soupçon", "freeze of assets",
        "gel des avoirs", "due diligence",
    ],
    "DATA_CYBER": [
        "protection des données", "data protection", "ndpr", "popia",
        "rgpd", "gdpr", "cnil", "loi 09-08",
        "résilience cyber", "cyber resilience", "ansi ", "anssi ",
        "incident reporting", "fuite de données", "data breach",
        "registre des traitements", "dpia",
    ],
    "ESG_CLIMAT": [
        "esg ", "tcfd", "ifrs s1", "ifrs s2", "ifrs s ",
        "stress test climatique", "climate stress test",
        "taxonomie verte", "finance durable", "sustainable finance",
        "climate disclosure", "transition climatique",
        "obligation verte", "green bond",
    ],
    "MA_GOUV": [
        "fusion", "acquisition", "prise de contrôle", "agrément",
        "approval", "merger", "takeover", "concentration",
        "rachat", "consolidation", "joint-venture", "joint venture",
        "agrément d'exploitation", "retrait d'agrément",
    ],
    "FISCALITE": [
        "fiscalité", "taxe assurance", "taxe sur les conventions",
        "ips ", "tspa",
        "régime fiscal", "exonération", "tax", "tva ",
        "convention fiscale", "ohada acte uniforme fiscal",
        "loi de finances",
    ],
    "JURIS_OHADA": [
        "ohada", "ccja", "cour commune de justice",
        "cour suprême", "cour d'appel", "arrêt n°", "arrêt du",
        "jurisprudence", "judgement", "court ruling", "supreme court ruling",
        "tribunal de commerce", "tribunal arbitral", "sentence arbitrale",
        "acte uniforme",
    ],
}

# Statut juridique d'un texte mentionné dans l'article
LEGAL_STATUSES = {
    "PROJET": [
        "projet de loi", "proposition de loi", "draft bill", "préprojet",
        "en cours d'examen", "examen en commission", "à l'étude",
        "consultation publique", "public consultation",
    ],
    "ADOPTE": [
        "adopté", "voté", "passed", "approved by", "vote final",
        "adoption", "adoption à l'unanimité",
    ],
    "PROMULGUE": [
        "promulgué", "promulgated", "publié au journal officiel",
        "publication au jo", "signed into law", "signature présidentielle",
    ],
    "EN_VIGUEUR": [
        "entré en vigueur", "entrée en vigueur", "in force",
        "effective from", "applicable depuis", "applicable à compter",
        "prend effet le", "comes into effect",
    ],
}

# Pour qu'un article soit considéré "réglementaire", il doit soit
# (a) matcher au moins un thème, soit
# (b) contenir un mot-clé "régulateur" générique.
# =============================================================================
# SECTEURS D'ACTIVITÉ (métiers OLEA en tant que courtier assurance)
# =============================================================================
# Source : olea.africa/fr/offres — branches d'assurance principales couvertes
# par OLEA en tant que broker pour ses clients corporate.
SECTORS = {
    "AUTO": {
        "label": "Automobile",
        "kw": [
            "automobile", "auto ", "voiture", "flotte auto", "flotte de véhicules",
            "car ", "vehicle", "vehicles", "car fleet", "trucks",
            "accident de la route", "accident de circulation",
            "code de la route", "road traffic", "car crash",
            "assurance auto", "car insurance",
        ],
    },
    "PROPERTY": {
        "label": "Dommages aux biens",
        "kw": [
            "incendie", "fire", "blaze",
            "dommages aux biens", "property damage", "property insurance",
            "vol", "burglary", "theft",
            "dégât des eaux", "water damage", "flood damage",
            "sinistre habitation", "commercial property",
            "immeuble", "building damage",
        ],
    },
    "LIABILITY": {
        "label": "Responsabilité civile",
        "kw": [
            "responsabilité civile", "rc ",
            "liability", "third-party", "third party liability",
            "rc décennale", "rc professionnelle",
            "faute professionnelle", "professional liability",
            "d&o ", "directors and officers",
            "malpractice",
        ],
    },
    "CYBER": {
        "label": "Cyber",
        "kw": [
            "cyber", "cyberattack", "cyberattaque",
            "ransomware", "rançongiciel", "malware", "phishing",
            "hack", "hacking", "hacker", "piratage",
            "data breach", "fuite de données", "cyber insurance",
            "ddos", "cybersécurité", "cybersecurity",
        ],
    },
    "POLITICAL_VIOLENCE": {
        "label": "Violence politique & terrorisme",
        "kw": [
            "attentat", "terroriste", "terrorism", "terrorist",
            "attaque terroriste", "terror attack",
            "coup d'état", "coup", "putsch", "junta", "junte",
            "insurrection", "rebellion", "rebels", "rebelle",
            "émeute", "riot", "violence politique", "political violence",
            "jihad", "djihad", "boko haram", "isis", "al-shabaab", "shabaab",
            "adf ", "m23",
        ],
    },
    "HEALTH": {
        "label": "Santé & prévoyance",
        "kw": [
            "assurance santé", "assurance maladie", "couverture maladie",
            "health insurance", "medical insurance",
            "épidémie", "epidemic", "outbreak", "pandemic", "pandémie",
            "ebola", "mpox", "cholera", "choléra", "covid",
            "hôpital", "hospital", "vaccination", "vaccin",
            "cmu", "prévoyance",
        ],
    },
    "MARINE_TRANSPORT": {
        "label": "Transport & marine",
        "kw": [
            "transport", "trucking", "trucker",
            "cargo", "conteneur", "container",
            "port ", "terminal portuaire", "shipping", "shipwreck", "vessel",
            "navire", "cargo ship", "tanker",
            "marine insurance", "assurance marine", "assurance cargo",
            "logistique", "logistics", "supply chain",
        ],
    },
    "AVIATION": {
        "label": "Aviation",
        "kw": [
            "aviation", "airline", "compagnie aérienne", "airport", "aéroport",
            "avion", "airplane", "plane crash", "crash aérien",
            "vol ", "flight", "flights",
            "boeing", "airbus", "atr ",
            "assurance aviation", "aviation insurance",
        ],
    },
    "ENERGY": {
        "label": "Énergie",
        "kw": [
            "pétrole", "oil", "oilfield", "champ pétrolier",
            "gaz", "gas", "lng", "lpg",
            "raffinerie", "refinery", "pipeline",
            "centrale électrique", "power plant", "électricité", "electricity",
            "énergie", "energy", "renewable",
            "solaire", "solar", "éolien", "wind farm", "hydroélectrique", "hydropower",
            "totalenergies", "shell", "eni ", "chevron", "exxonmobil",
        ],
    },
    "CONSTRUCTION": {
        "label": "Construction & BTP",
        "kw": [
            "construction", "btp",
            "chantier", "worksite", "construction site",
            "immeuble en construction", "building site",
            "grue", "crane", "excavator",
            "car ", "ear ", "all risk construction",
            "décennale", "10-year warranty",
            "génie civil", "civil engineering",
            "route", "autoroute", "highway", "pont", "bridge",
            "barrage", "dam ",
        ],
    },
    "AGRICULTURE": {
        "label": "Agriculture",
        "kw": [
            "agriculture", "agricole", "agricultural",
            "récolte", "harvest", "crop",
            "farmer", "agriculteur", "élevage", "livestock",
            "cacao", "cocoa", "café", "coffee", "cotton", "coton",
            "vanille", "vanilla", "cashew", "anacarde",
            "sécheresse", "drought", "famine",
            "assurance récolte", "crop insurance", "index-based",
        ],
    },
}

# Mots-clés "IDE" — investissements directs étrangers / capital étranger
FDI_KEYWORDS = [
    # FR
    "investissement direct", "investissements directs",
    "investissement étranger", "investissements étrangers",
    "investisseur étranger", "investisseurs étrangers",
    "capital étranger", "capitaux étrangers", "fonds étrangers",
    "annonce d'investissement", "milliards d'investissement",
    "millions d'investissement",
    "rachat", "acquisition", "acquière", "acquiert",
    "joint-venture", "joint venture", "co-entreprise",
    "implantation", "implantent", "implante",
    "fusion", "fusion-acquisition",
    "participations", "prise de participation", "prend une part",
    "capital-investissement", "private equity",
    "tour de table", "levée de fonds",
    "filiale", "lance une filiale",
    # EN
    "foreign direct investment", "fdi",
    "foreign investment", "foreign investor", "foreign investors",
    "invests in", "to invest", "investment in",
    "stake in", "acquisition of", "acquires", "acquired",
    "buyout", "subsidiary", "spin-off",
    "raised funds", "raises funds", "raised $",
    "capital injection", "equity stake",
    "joint venture", "consortium",
    # Acteurs notoires
    "ifc ", "afdb", "world bank", "edf",
    "private equity", "venture capital",
    "sovereign wealth", "abu dhabi", "qatar investment",
    "africa50", "proparco", "fmo ", "norfund",
]

REGULATORY_TRIGGER = [
    "régulateur", "regulator", "supervision",
    "projet de loi", "draft bill", "draft law", "loi de finances",
    "décret", "decree", "arrêté ministériel", "circulaire",
    "directive européenne", "réforme bancaire", "réforme du code",
    "cima ", "naicom", "acaps", "asac ", "fsca ", "nic ",
    "code des assurances", "insurance code", "tax code",
    "agrément", "licensing", "compliance", "conformité",
]

# Mots qui boostent la sévérité (1..4)
SEVERITY_HIGH = ["mort", "morts", "killed", "dead", "deaths", "tué",
                 "catastrophe", "catastrophic",
                 "urgence", "emergency", "état d'urgence",
                 "massacre", "victims", "victimes",
                 "disaster", "désastre"]
SEVERITY_MEDIUM = ["explosion", "incendie", "fire", "attaque", "attack",
                   "crash", "effondrement", "collapse",
                   "coup d'état", "coup", "putsch",
                   "épidémie", "outbreak",
                   "fuite", "leak", "cyberattaque",
                   "blessé", "wounded", "injured"]
SEVERITY_LOW = ["réforme", "reform", "signe", "signs",
                "annonce", "announce",  "lance", "launch",
                "hausse", "baisse", "growth", "increase"]

# =============================================================================
# HELPERS
# =============================================================================
class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
    def handle_data(self, d): self.text.append(d)
    def get(self): return "".join(self.text)

def strip_html(s):
    if not s: return ""
    p = _HTMLStripper()
    try: p.feed(s)
    except Exception: return re.sub(r"<[^>]+>", "", s)
    return p.get()

def norm(s):
    """Normalise pour matching : minuscule, sans accents, espaces compactés."""
    if not s: return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"\s+", " ", s)
    return s

def fetch_url(url, retries=2):
    last_err = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
            })
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.read()
        except Exception as e:
            last_err = e
            time.sleep(1.2 * (attempt + 1))
    raise last_err

# =============================================================================
# RSS / ATOM PARSER
# =============================================================================
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rss10": "http://purl.org/rss/1.0/",
}

def _t(el, *tags):
    """Premier sous-élément non-vide trouvé parmi tags."""
    if el is None: return None
    for tag in tags:
        # essai sans namespace (RSS 2.0)
        x = el.find(tag)
        if x is not None and (x.text or x.attrib): return x
        # essai en parcourant tous les enfants
        for child in el:
            if child.tag.endswith("}" + tag) or child.tag == tag:
                return child
    return None

def _text(el):
    if el is None: return ""
    if el.text: return el.text.strip()
    return ""

def parse_date(s):
    if not s: return None
    s = s.strip()
    # essai 1 : RFC 822 / 2822 (RSS 2.0)
    try: return parsedate_to_datetime(s).astimezone(timezone.utc)
    except Exception: pass
    # essai 2 : ISO 8601 (Atom)
    try:
        # Python 3.7+ : fromisoformat ne gère pas 'Z'
        s2 = s.replace("Z", "+00:00")
        d = datetime.fromisoformat(s2)
        if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(timezone.utc)
    except Exception: pass
    return None

def parse_feed(xml_bytes, source):
    """Renvoie une liste d'items {title, link, summary, published}."""
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        # Certains flux ont un BOM ou déclaration foireuse — on tente une cleanup
        text = xml_bytes.decode("utf-8", errors="replace")
        text = text.lstrip("﻿").strip()
        text = re.sub(r"^[^<]*", "", text)
        root = ET.fromstring(text.encode("utf-8"))

    items = []
    tag = root.tag.lower()
    is_atom = tag.endswith("feed") or "atom" in tag
    is_rdf  = tag.endswith("rdf")

    if is_atom:
        for entry in root.findall("atom:entry", NS):
            title = _text(entry.find("atom:title", NS))
            link_el = entry.find("atom:link", NS)
            link = link_el.attrib.get("href", "") if link_el is not None else ""
            summary = _text(entry.find("atom:summary", NS)) or _text(entry.find("atom:content", NS))
            published = _text(entry.find("atom:published", NS)) or _text(entry.find("atom:updated", NS))
            items.append({"title": title, "link": link, "summary": summary, "published": published})
    elif is_rdf:
        # RSS 1.0 (RDF) — utilisé par AllAfrica
        for item in root.findall("rss10:item", NS):
            title = _text(item.find("rss10:title", NS))
            link  = _text(item.find("rss10:link",  NS))
            summary = _text(item.find("rss10:description", NS)) or _text(item.find("dc:description", NS))
            published = _text(item.find("dc:date", NS))
            items.append({"title": title, "link": link, "summary": summary, "published": published})
    else:
        # RSS 2.0
        for item in root.iter("item"):
            title = _text(item.find("title"))
            link  = _text(item.find("link"))
            summary = _text(item.find("description"))
            if not summary:
                ce = item.find("{http://purl.org/rss/1.0/modules/content/}encoded")
                if ce is not None: summary = ce.text or ""
            published = _text(item.find("pubDate"))
            if not published:
                dc = item.find("{http://purl.org/dc/elements/1.1/}date")
                if dc is not None: published = dc.text or ""
            items.append({"title": title, "link": link, "summary": summary, "published": published})

    # Cleanup
    for it in items:
        it["title"] = (it["title"] or "").strip()
        it["summary"] = strip_html(it["summary"] or "").strip()
        if len(it["summary"]) > 480:
            it["summary"] = it["summary"][:477].rsplit(" ", 1)[0] + "…"
        it["published_dt"] = parse_date(it["published"])
    return items

# =============================================================================
# CLASSIFICATION
# =============================================================================
def detect_country(text_norm, force=None):
    """Renvoie le code pays OLEA détecté (ou None)."""
    if force: return force
    matches = []
    for c in COUNTRIES:
        for kw in c["kw"]:
            kwn = norm(kw)
            # frontières de mots pour éviter "mali" dans "somalia"
            pattern = r"(?<![a-z])" + re.escape(kwn) + r"(?![a-z])"
            if re.search(pattern, text_norm):
                matches.append(c["code"])
                break
    if not matches: return None
    # Si plusieurs pays mentionnés, on prend celui qui apparaît en premier
    first = None
    first_pos = 10**9
    for code in matches:
        c = next(c for c in COUNTRIES if c["code"] == code)
        for kw in c["kw"]:
            kwn = norm(kw)
            pattern = r"(?<![a-z])" + re.escape(kwn) + r"(?![a-z])"
            m = re.search(pattern, text_norm)
            if m and m.start() < first_pos:
                first_pos = m.start()
                first = code
    return first

def detect_category(text_norm):
    """Matching par préfixe (gère plurial/conjugaison)."""
    scores = {}
    for cat, keywords in CATEGORIES.items():
        s = 0
        for kw in keywords:
            kwn = norm(kw)
            # frontière à gauche seulement → "attack" matche "attacks", "attacked"
            s += len(re.findall(r"(?<![a-z])" + re.escape(kwn), text_norm))
        if s > 0: scores[cat] = s
    if not scores: return "AUTRE"
    return max(scores, key=scores.get)

def detect_severity(text_norm):
    """Matching par préfixe pour gérer plurial/conjugaison."""
    score = 1
    def has(kw):
        return re.search(r"(?<![a-z])" + re.escape(norm(kw)), text_norm) is not None
    for kw in SEVERITY_HIGH:
        if has(kw): score = max(score, 4)
    for kw in SEVERITY_MEDIUM:
        if has(kw): score = max(score, 3)
    for kw in SEVERITY_LOW:
        if has(kw): score = max(score, 2)
    return score

def detect_theme(text_norm):
    """Renvoie le thème réglementaire dominant, ou None."""
    scores = {}
    for theme, keywords in THEMES.items():
        s = 0
        for kw in keywords:
            kwn = norm(kw)
            s += len(re.findall(r"(?<![a-z])" + re.escape(kwn), text_norm))
        if s > 0: scores[theme] = s
    if not scores: return None
    return max(scores, key=scores.get)

def detect_legal_status(text_norm):
    """Renvoie le statut juridique le plus 'avancé' détecté (en vigueur > promulgué > adopté > projet)."""
    # Ordre du plus avancé au moins avancé pour priorité
    order = ["EN_VIGUEUR", "PROMULGUE", "ADOPTE", "PROJET"]
    for status in order:
        for kw in LEGAL_STATUSES[status]:
            kwn = norm(kw)
            if re.search(r"(?<![a-z])" + re.escape(kwn), text_norm):
                return status
    return None

def is_regulatory(text_norm, theme):
    """True si l'article touche au réglementaire/conformité/juridique."""
    if theme is not None: return True
    for kw in REGULATORY_TRIGGER:
        kwn = norm(kw)
        if re.search(r"(?<![a-z])" + re.escape(kwn), text_norm):
            return True
    return False

def is_fdi_news(text_norm):
    """True si l'article parle d'investissement direct étranger."""
    for kw in FDI_KEYWORDS:
        kwn = norm(kw)
        if re.search(r"(?<![a-z])" + re.escape(kwn), text_norm):
            return True
    return False

def detect_sectors(text_norm):
    """Retourne la liste des codes secteur détectés (peut être multiple)."""
    hits = []
    for code, meta in SECTORS.items():
        for kw in meta["kw"]:
            kwn = norm(kw)
            if re.search(r"(?<![a-z])" + re.escape(kwn), text_norm):
                hits.append(code)
                break
    return hits

# =============================================================================
# DEDUPE & CROSS-VERIFICATION
# =============================================================================
STOPWORDS = set("""
le la les un une des du de et à a au aux en dans pour par sur avec sans ce cet cette ces
the a an and or of in on at to by for with from is are was were be been being
that this it its his her their our we you they i
""".split())

def signature(title):
    """Set de mots significatifs pour Jaccard."""
    t = norm(title)
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    words = [w for w in t.split() if len(w) >= 4 and w not in STOPWORDS]
    return set(words)

def jaccard(a, b):
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)

def dedupe_and_verify(articles):
    """Regroupe les articles similaires. Chaque cluster a un article 'lead'
    et la liste des sources qui ont publié la même news."""
    clusters = []
    for art in articles:
        sig = art["_sig"]
        placed = False
        for cl in clusters:
            if jaccard(sig, cl["sig"]) >= 0.45:
                cl["members"].append(art)
                cl["sig"] |= sig  # union pour matcher d'autres variantes
                placed = True
                break
        if not placed:
            clusters.append({"sig": set(sig), "members": [art]})

    final = []
    for cl in clusters:
        # lead = plus haut tier puis plus récent
        cl["members"].sort(key=lambda a: (a["source_tier"], -(a["published_dt"].timestamp() if a["published_dt"] else 0)))
        lead = dict(cl["members"][0])
        sources_seen = []
        seen_ids = set()
        for m in cl["members"]:
            if m["source_id"] not in seen_ids:
                sources_seen.append({"id": m["source_id"], "name": m["source_name"],
                                     "tier": m["source_tier"], "url": m["link"]})
                seen_ids.add(m["source_id"])

        lead["confirming_sources"] = sources_seen
        lead["confirmation_count"] = len(sources_seen)
        # Score de fiabilité 1..5
        tier1 = sum(1 for s in sources_seen if s["tier"] == 1)
        tier2 = sum(1 for s in sources_seen if s["tier"] == 2)
        cred = 1 + min(tier1, 3) + min(tier2, 2)  # cap à 5
        if lead["confirmation_count"] >= 2:
            cred += 1
        lead["credibility"] = min(cred, 5)
        lead["verified"] = lead["confirmation_count"] >= 2
        # Severity boost si plusieurs sources le rapportent
        if lead["verified"]:
            lead["severity"] = min(4, lead["severity"] + 1)
        final.append(lead)
    return final

# =============================================================================
# MAIN
# =============================================================================
def main():
    print("\n┌─ OLEA Intelligence · agrégation des sources ─────────────────────")
    all_articles = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)

    for i, src in enumerate(SOURCES):
        label = f"│  [{i+1:>2}/{len(SOURCES)}] {src['name']:<30}"
        try:
            t0 = time.time()
            data = fetch_url(src["url"])
            items = parse_feed(data, src)
            kept = 0
            for it in items:
                if not it["title"]: continue
                if it["published_dt"] and it["published_dt"] < cutoff: continue
                text = it["title"] + " " + (it["summary"] or "")
                text_norm = norm(text)
                country = detect_country(text_norm, force=src.get("force_country"))
                if not country: continue   # on garde uniquement ce qui matche un pays OLEA
                cat = detect_category(text_norm)
                sev = detect_severity(text_norm)
                theme = detect_theme(text_norm)
                lstatus = detect_legal_status(text_norm)
                regu = is_regulatory(text_norm, theme)
                fdi  = is_fdi_news(text_norm)
                sectors = detect_sectors(text_norm)
                all_articles.append({
                    "title": it["title"],
                    "summary": it["summary"],
                    "link": it["link"],
                    "published": it["published_dt"].isoformat() if it["published_dt"] else None,
                    "published_dt": it["published_dt"] or datetime.now(timezone.utc),
                    "source_id": src["id"],
                    "source_name": src["name"],
                    "source_tier": src["tier"],
                    "country": country,
                    "category": cat,
                    "severity": sev,
                    "theme": theme,
                    "legal_status": lstatus,
                    "regulatory": regu,
                    "fdi": fdi,
                    "sectors": sectors,
                    "lang": src.get("lang", "fr"),
                    "_sig": signature(it["title"]),
                })
                kept += 1
            print(f"{label} OK   ({kept:>3} pertinents / {len(items):>3} articles · {time.time()-t0:.1f}s)")
        except Exception as e:
            print(f"{label} SKIP ({type(e).__name__})")
        # délai poli entre les requêtes
        time.sleep(0.7)

    print(f"│")
    print(f"│  → {len(all_articles)} articles pré-filtrés")

    clusters = dedupe_and_verify(all_articles)
    clusters.sort(key=lambda a: (-(a["severity"]), -(a["published_dt"].timestamp())))

    print(f"│  → {len(clusters)} signaux uniques après dédoublonnage")
    verified = sum(1 for c in clusters if c["verified"])
    print(f"│  → {verified} signaux cross-vérifiés (≥2 sources)")

    # Stats par pays
    per_country = {}
    for c in clusters:
        per_country[c["country"]] = per_country.get(c["country"], 0) + 1
    print(f"│  → {len(per_country)} pays OLEA couverts par la veille")

    # Stats IDE
    fdi = [c for c in clusters if c.get("fdi")]
    print(f"│  → {len(fdi)} signaux IDE détectés")

    # Stats réglementaires
    regu = [c for c in clusters if c.get("regulatory")]
    print(f"│  → {len(regu)} signaux réglementaires/juridiques détectés")
    per_theme = {}
    for c in regu:
        t = c.get("theme") or "GENERIQUE"
        per_theme[t] = per_theme.get(t, 0) + 1
    for t, n in sorted(per_theme.items(), key=lambda x: -x[1])[:5]:
        print(f"│     · {t:<16} {n}")

    # Sérialisation
    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "total_signals": len(clusters),
            "verified_signals": verified,
            "countries_covered": len(per_country),
            "sources_active": len(SOURCES),
            "per_country": per_country,
        },
        "sources": [{"id": s["id"], "name": s["name"], "tier": s["tier"], "url": s["url"]} for s in SOURCES],
        "signals": [{
            "id": md5((c["title"] + c["source_id"]).encode("utf-8")).hexdigest()[:10],
            "title": c["title"],
            "summary": c["summary"],
            "country": c["country"],
            "category": c["category"],
            "severity": c["severity"],
            "credibility": c["credibility"],
            "verified": c["verified"],
            "theme": c.get("theme"),
            "legal_status": c.get("legal_status"),
            "regulatory": c.get("regulatory", False),
            "fdi": c.get("fdi", False),
            "sectors": c.get("sectors", []),
            "lang": c.get("lang", "fr"),
            "published": c["published"],
            "lead_source": {"id": c["source_id"], "name": c["source_name"], "tier": c["source_tier"], "url": c["link"]},
            "confirming_sources": c["confirming_sources"],
            "confirmation_count": c["confirmation_count"],
        } for c in clusters],
    }

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"│")
    print(f"└─ ✓ news.json écrit ({OUT_PATH.stat().st_size // 1024} KB)\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrompu.")
        sys.exit(130)
