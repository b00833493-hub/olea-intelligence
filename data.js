// ============================================================
// OLEA Intelligence — Métadonnées pays & catégories
// ============================================================
// Référentiel basé sur la carte officielle olea.africa :
//   - 26 filiales      (tier = "filiale")
//   - 13 partenariats  (tier = "partenariat")
// Coordonnées = capitale ou centre commercial.

const OLEA_COUNTRIES = [
  // ===== FILIALES (26) =====
  { code: "CIV", name: "Côte d'Ivoire",  flag: "🇨🇮", tier: "filiale", hq: true, lat: 5.32,   lon: -4.03,  city: "Abidjan",       region: "Afrique de l'Ouest" },
  { code: "SEN", name: "Sénégal",         flag: "🇸🇳", tier: "filiale", lat: 14.69,  lon: -17.45, city: "Dakar",         region: "Afrique de l'Ouest" },
  { code: "MLI", name: "Mali",            flag: "🇲🇱", tier: "filiale", lat: 12.65,  lon: -8.00,  city: "Bamako",        region: "Afrique de l'Ouest" },
  { code: "BFA", name: "Burkina Faso",    flag: "🇧🇫", tier: "filiale", lat: 12.37,  lon: -1.52,  city: "Ouagadougou",   region: "Afrique de l'Ouest" },
  { code: "BEN", name: "Bénin",           flag: "🇧🇯", tier: "filiale", lat: 6.36,   lon: 2.42,   city: "Cotonou",       region: "Afrique de l'Ouest" },
  { code: "TGO", name: "Togo",            flag: "🇹🇬", tier: "filiale", lat: 6.13,   lon: 1.22,   city: "Lomé",          region: "Afrique de l'Ouest" },
  { code: "NER", name: "Niger",           flag: "🇳🇪", tier: "filiale", lat: 13.51,  lon: 2.11,   city: "Niamey",        region: "Afrique de l'Ouest" },
  { code: "GIN", name: "Guinée",          flag: "🇬🇳", tier: "filiale", lat: 9.64,   lon: -13.58, city: "Conakry",       region: "Afrique de l'Ouest" },
  { code: "SLE", name: "Sierra Leone",    flag: "🇸🇱", tier: "filiale", lat: 8.48,   lon: -13.23, city: "Freetown",      region: "Afrique de l'Ouest" },
  { code: "LBR", name: "Libéria",         flag: "🇱🇷", tier: "filiale", lat: 6.30,   lon: -10.80, city: "Monrovia",      region: "Afrique de l'Ouest" },
  { code: "GHA", name: "Ghana",           flag: "🇬🇭", tier: "filiale", lat: 5.55,   lon: -0.20,  city: "Accra",         region: "Afrique de l'Ouest" },
  { code: "MRT", name: "Mauritanie",      flag: "🇲🇷", tier: "filiale", lat: 18.07,  lon: -15.97, city: "Nouakchott",    region: "Afrique du Nord" },
  { code: "MAR", name: "Maroc",           flag: "🇲🇦", tier: "filiale", lat: 33.59,  lon: -7.62,  city: "Casablanca",    region: "Afrique du Nord" },
  { code: "TUN", name: "Tunisie",         flag: "🇹🇳", tier: "filiale", lat: 36.81,  lon: 10.18,  city: "Tunis",         region: "Afrique du Nord" },
  { code: "DZA", name: "Algérie",         flag: "🇩🇿", tier: "filiale", lat: 36.75,  lon: 3.06,   city: "Alger",         region: "Afrique du Nord" },
  { code: "CMR", name: "Cameroun",        flag: "🇨🇲", tier: "filiale", lat: 4.05,   lon: 9.70,   city: "Douala",        region: "Afrique Centrale" },
  { code: "GAB", name: "Gabon",           flag: "🇬🇦", tier: "filiale", lat: 0.42,   lon: 9.45,   city: "Libreville",    region: "Afrique Centrale" },
  { code: "COG", name: "Congo",           flag: "🇨🇬", tier: "filiale", lat: -4.27,  lon: 15.28,  city: "Brazzaville",   region: "Afrique Centrale" },
  { code: "TCD", name: "Tchad",           flag: "🇹🇩", tier: "filiale", lat: 12.13,  lon: 15.06,  city: "N'Djamena",     region: "Afrique Centrale" },
  { code: "KEN", name: "Kenya",           flag: "🇰🇪", tier: "filiale", lat: -1.29,  lon: 36.82,  city: "Nairobi",       region: "Afrique de l'Est" },
  { code: "TZA", name: "Tanzanie",        flag: "🇹🇿", tier: "filiale", lat: -6.79,  lon: 39.21,  city: "Dar es Salaam", region: "Afrique de l'Est" },
  { code: "UGA", name: "Ouganda",         flag: "🇺🇬", tier: "filiale", lat: 0.31,   lon: 32.58,  city: "Kampala",       region: "Afrique de l'Est" },
  { code: "AGO", name: "Angola",          flag: "🇦🇴", tier: "filiale", lat: -8.84,  lon: 13.23,  city: "Luanda",        region: "Afrique Australe" },
  { code: "NAM", name: "Namibie",         flag: "🇳🇦", tier: "filiale", lat: -22.56, lon: 17.09,  city: "Windhoek",      region: "Afrique Australe" },
  { code: "BWA", name: "Botswana",        flag: "🇧🇼", tier: "filiale", lat: -24.65, lon: 25.91,  city: "Gaborone",      region: "Afrique Australe" },
  { code: "ZAF", name: "Afrique du Sud",  flag: "🇿🇦", tier: "filiale", lat: -26.20, lon: 28.04,  city: "Johannesburg",  region: "Afrique Australe" },

  // ===== PARTENARIATS (13) =====
  { code: "NGA", name: "Nigéria",                flag: "🇳🇬", tier: "partenariat", lat: 6.46,   lon: 3.40,   city: "Lagos",     region: "Afrique de l'Ouest" },
  { code: "COD", name: "RD Congo",               flag: "🇨🇩", tier: "partenariat", lat: -4.32,  lon: 15.32,  city: "Kinshasa",  region: "Afrique Centrale" },
  { code: "CAF", name: "Centrafrique",           flag: "🇨🇫", tier: "partenariat", lat: 4.36,   lon: 18.55,  city: "Bangui",    region: "Afrique Centrale" },
  { code: "GNQ", name: "Guinée équatoriale",     flag: "🇬🇶", tier: "partenariat", lat: 3.75,   lon: 8.78,   city: "Malabo",    region: "Afrique Centrale" },
  { code: "ETH", name: "Éthiopie",               flag: "🇪🇹", tier: "partenariat", lat: 9.03,   lon: 38.74,  city: "Addis-Abeba", region: "Afrique de l'Est" },
  { code: "RWA", name: "Rwanda",                 flag: "🇷🇼", tier: "partenariat", lat: -1.94,  lon: 30.06,  city: "Kigali",    region: "Afrique de l'Est" },
  { code: "BDI", name: "Burundi",                flag: "🇧🇮", tier: "partenariat", lat: -3.43,  lon: 29.93,  city: "Gitega",    region: "Afrique de l'Est" },
  { code: "ZMB", name: "Zambie",                 flag: "🇿🇲", tier: "partenariat", lat: -15.42, lon: 28.28,  city: "Lusaka",    region: "Afrique Australe" },
  { code: "ZWE", name: "Zimbabwe",               flag: "🇿🇼", tier: "partenariat", lat: -17.83, lon: 31.05,  city: "Harare",    region: "Afrique Australe" },
  { code: "MWI", name: "Malawi",                 flag: "🇲🇼", tier: "partenariat", lat: -13.98, lon: 33.78,  city: "Lilongwe",  region: "Afrique Australe" },
  { code: "MOZ", name: "Mozambique",             flag: "🇲🇿", tier: "partenariat", lat: -25.97, lon: 32.58,  city: "Maputo",    region: "Afrique Australe" },
  { code: "MDG", name: "Madagascar",             flag: "🇲🇬", tier: "partenariat", lat: -18.88, lon: 47.51,  city: "Antananarivo", region: "Océan Indien" },
  { code: "MUS", name: "Maurice",                flag: "🇲🇺", tier: "partenariat", lat: -20.16, lon: 57.50,  city: "Port-Louis", region: "Océan Indien" },
];

const ISO_NUMERIC = {
  // filiales
  CIV: 384, SEN: 686, MLI: 466, BFA: 854, BEN: 204, TGO: 768, NER: 562,
  GIN: 324, SLE: 694, LBR: 430, GHA: 288, MRT: 478,
  MAR: 504, TUN: 788, DZA: 12,
  CMR: 120, GAB: 266, COG: 178, TCD: 148,
  KEN: 404, TZA: 834, UGA: 800,
  AGO: 24, NAM: 516, BWA: 72, ZAF: 710,
  // partenariats
  NGA: 566, COD: 180, CAF: 140, GNQ: 226,
  ETH: 231, RWA: 646, BDI: 108,
  ZMB: 894, ZWE: 716, MWI: 454, MOZ: 508,
  MDG: 450, MUS: 480,
};

// Catégories — labels affichables et couleurs
const CATEGORIES = {
  CLIMAT:         { label: "Climat & CAT NAT",       color: "#0EA5E9", short: "Climat"   },
  SINISTRE:       { label: "Sinistres majeurs",      color: "#DC2626", short: "Sinistres"},
  REGULATION:     { label: "Réglementation",         color: "#7C3AED", short: "Régul."   },
  POLITIQUE:      { label: "Politique & sécurité",   color: "#EA580C", short: "Politique"},
  ECONOMIE:       { label: "Économie & marchés",     color: "#0E7C5C", short: "Économie" },
  CYBER:          { label: "Cyber & tech",           color: "#1E40AF", short: "Cyber"    },
  SANTE:          { label: "Santé publique",         color: "#BE185D", short: "Santé"    },
  INFRASTRUCTURE: { label: "Infrastructures",        color: "#92400E", short: "Infra"    },
  AUTRE:          { label: "Autres",                 color: "#94A3B8", short: "Autre"    },
};
