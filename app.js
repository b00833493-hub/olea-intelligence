// ============================================================
// OLEA Intelligence — Logique applicative
// ============================================================
// Charge news.json (généré par fetch_news.py), construit la carte
// interactive de l'Afrique, le fil temps réel, le dashboard.

const WORLD_TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const NEWS_URL = "news.json";
const FX_URL   = "fx.json";
const FDI_URL  = "fdi.json";
const REFRESH_MS = 60 * 1000;

// État global
const state = {
  signals: [],
  generatedAt: null,
  stats: null,
  sources: [],
  selectedCountry: null,
  activeCategory: null,
  sortMode: "severity", // 'severity' | 'recent' | 'credibility'
  reguTheme: null,      // filtre thème actif (null = tous)
  reguStatus: null,     // filtre statut actif (null = tous)
  searchQuery: "",      // recherche libre (transverse aux deux feeds)
  fx: null,             // fx.json (taux EUR → devises locales)
  fdi: null,            // fdi.json (IDE World Bank par pays)
};

// Normalise pour matching : minuscules + sans accents.
function normForSearch(s) {
  if (!s) return "";
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Renvoie true si tous les tokens de la query sont présents dans le texte du signal.
function signalMatchesSearch(s) {
  const q = state.searchQuery.trim();
  if (!q) return true;
  const tokens = normForSearch(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const c = countryByCode(s.country);
  const cat = CATEGORIES[s.category];
  const theme = s.theme ? THEMES[s.theme] : null;
  const haystack = normForSearch([
    s.title, s.summary,
    c?.name, c?.city, c?.region,
    cat?.label, theme?.label,
    s.legal_status,
    s.lead_source?.name,
    ...(s.confirming_sources || []).map((x) => x.name),
  ].filter(Boolean).join(" • "));
  return tokens.every((tok) => haystack.includes(tok));
}

// Highlight des matches dans une chaîne (renvoie du HTML safe).
function highlight(text) {
  const safe = escapeHtml(text || "");
  const q = state.searchQuery.trim();
  if (!q) return safe;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (!tokens.length) return safe;
  const re = new RegExp("(" + tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
  return safe.replace(re, "<mark>$1</mark>");
}

const SORT_FNS = {
  severity:    (a, b) => (b.severity - a.severity)
                       || (b.credibility - a.credibility)
                       || (new Date(b.published || 0) - new Date(a.published || 0)),
  recent:      (a, b) => (new Date(b.published || 0) - new Date(a.published || 0)),
  credibility: (a, b) => (b.credibility - a.credibility)
                       || (Number(b.verified) - Number(a.verified))
                       || (b.severity - a.severity)
                       || (new Date(b.published || 0) - new Date(a.published || 0)),
};
const SORT_LABELS = {
  severity:    "sévérité",
  recent:      "date",
  credibility: "fiabilité",
};

// ============================================================
// Utilitaires
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatClock(date = new Date()) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function countryByCode(code) {
  return OLEA_COUNTRIES.find((c) => c.code === code);
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// ============================================================
// Chargement news.json
// ============================================================
async function loadNews() {
  try {
    const res = await fetch(`${NEWS_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    state.signals = data.signals || [];
    state.generatedAt = data.generated_at;
    state.stats = data.stats || {};
    state.sources = data.sources || [];
    return true;
  } catch (e) {
    console.error("Échec du chargement de news.json :", e);
    document.getElementById("feed-list").innerHTML = `
      <div class="feed-empty">
        <strong>Aucune donnée chargée</strong>
        Lance <code>python3 fetch_news.py</code> pour générer <code>news.json</code>, puis recharge la page.
      </div>`;
    return false;
  }
}

async function loadFX() {
  try {
    const res = await fetch(`${FX_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.fx = await res.json();
    return true;
  } catch (e) { console.warn("FX non chargé :", e); state.fx = null; return false; }
}

async function loadFDI() {
  try {
    const res = await fetch(`${FDI_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.fdi = await res.json();
    return true;
  } catch (e) { console.warn("FDI non chargé :", e); state.fdi = null; return false; }
}

// ============================================================
// Carte interactive (D3 + topojson)
// ============================================================
// Codes ISO numériques 3-digit (padded) des pays africains.
// Source : ISO 3166-1 ; on liste explicitement pour éviter qu'un pays
// hors continent ne soit dessiné (le filtre par centroïde laisse passer
// les voisins proches de la bbox).
const AFRICAN_ISO = new Set([
  "012","024","072","086","108","120","132","140","148","174","175","178",
  "180","204","226","231","232","262","266","270","288","324","384","404",
  "426","430","434","450","454","466","478","480","504","508","516","562",
  "566","624","646","654","678","686","690","694","706","710","716","728",
  "729","732","748","768","788","800","818","834","854","894",
]);

async function renderMap() {
  const svg = d3.select("#africa-map");
  // viewBox : 0 0 1000 940 (cf. index.html). Doit englober Maurice à l'Est
  // et le Cap Agulhas au Sud.
  const W = 1000, H = 940;

  const pad3 = (n) => String(n).padStart(3, "0");

  const topo = await fetch(WORLD_TOPO_URL).then((r) => r.json());
  const countries = topojson.feature(topo, topo.objects.countries).features;
  const africaFeatures = countries.filter((f) => AFRICAN_ISO.has(pad3(f.id)));

  // Projection Mercator recadrée :
  //  - centre [18, 0]  → légèrement décalé au sud pour donner de l'air à ZAF
  //  - scale 600       → permet d'inclure Cabo Verde à l'Ouest et Maurice à l'Est
  //  - translate [500, 470] → centre dans le viewBox 1000×940
  const projection = d3.geoMercator()
    .center([18, 0])
    .scale(600)
    .translate([W / 2, H * 0.50]);
  const path = d3.geoPath(projection);

  // Codes OLEA → IDs topojson (padding 3 chars)
  const oleaIds = new Set(Object.values(ISO_NUMERIC).map(pad3));

  // Background subtil : océan
  svg.append("rect")
    .attr("x", 0).attr("y", 0)
    .attr("width", W).attr("height", H)
    .attr("fill", "transparent");

  // Pays
  svg.append("g").attr("class", "countries-layer")
    .selectAll("path")
    .data(africaFeatures)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", (d) => "country-shape" + (oleaIds.has(String(d.id)) ? " olea" : ""))
    .attr("data-id", (d) => d.id)
    .on("click", (event, d) => {
      const oleaCode = Object.keys(ISO_NUMERIC).find((k) => ISO_NUMERIC[k] === Number(d.id));
      if (oleaCode) selectCountry(oleaCode);
    })
    .on("mouseenter", (event, d) => {
      const oleaCode = Object.keys(ISO_NUMERIC).find((k) => ISO_NUMERIC[k] === Number(d.id));
      if (oleaCode) showPopup(oleaCode, event);
    })
    .on("mousemove", positionPopup)
    .on("mouseleave", hidePopup);

  // Markers OLEA (avec sévérité max du pays)
  const sevByCountry = {};
  for (const sig of state.signals) {
    sevByCountry[sig.country] = Math.max(sevByCountry[sig.country] || 0, sig.severity || 1);
  }

  const markersLayer = svg.append("g").attr("class", "markers-layer");

  // Tri : partenariats d'abord (rendus en dessous), filiales par-dessus
  const sortedCountries = OLEA_COUNTRIES.slice().sort((a, b) => {
    const ta = a.tier === "filiale" ? 1 : 0;
    const tb = b.tier === "filiale" ? 1 : 0;
    return ta - tb;
  });

  for (const c of sortedCountries) {
    const [x, y] = projection([c.lon, c.lat]);
    if (isNaN(x) || isNaN(y)) continue;

    const sev = sevByCountry[c.code] || 1;
    const color = sev === 4 ? "#B4482B" : sev === 3 ? "#FF9924" : sev === 2 ? "#F5AC3C" : "#4CB07A";
    const isPartner = c.tier === "partenariat";
    const radius = c.hq ? 7 : (isPartner ? 4 : 5.5);

    const g = markersLayer.append("g")
      .attr("class", `olea-marker sev-${sev}${c.hq ? " is-hq" : ""} tier-${c.tier}`)
      .attr("data-country", c.code)
      .attr("data-tier", c.tier)
      .attr("transform", `translate(${x}, ${y})`)
      .on("click", () => selectCountry(c.code))
      .on("mouseenter", (event) => showPopup(c.code, event))
      .on("mousemove", positionPopup)
      .on("mouseleave", hidePopup);

    // Anneau pulsant pour filiales en sév >= 3 uniquement
    if (sev >= 3 && !isPartner) {
      g.append("circle")
        .attr("class", "marker-pulse")
        .attr("r", radius)
        .attr("stroke", color);
    }
    if (isPartner) {
      // Partenariat : petit point translucide avec halo discret
      g.append("circle")
        .attr("class", "marker-core")
        .attr("r", radius)
        .attr("fill", color)
        .attr("fill-opacity", 0.55)
        .attr("stroke", color)
        .attr("stroke-width", 1.2)
        .attr("stroke-opacity", 0.7);
    } else {
      // Filiale : anneau extérieur + noyau plein
      g.append("circle")
        .attr("class", "marker-ring")
        .attr("r", radius + 3)
        .attr("stroke", color);
      g.append("circle")
        .attr("class", "marker-core")
        .attr("r", radius)
        .attr("fill", color);
    }
    // Point central pour HQ
    if (c.hq) {
      g.append("circle")
        .attr("r", 1.6)
        .attr("fill", "#FFFFFF");
    }
  }
}

// ============================================================
// Popup au survol pays
// ============================================================
const popupEl = $("#country-popup");
function showPopup(code, event) {
  const c = countryByCode(code);
  if (!c) return;
  const signalsHere = state.signals.filter((s) => s.country === code);
  const maxSev = signalsHere.reduce((m, s) => Math.max(m, s.severity), 0);
  const verifiedCount = signalsHere.filter((s) => s.verified).length;

  const sevLabel = maxSev === 4 ? "Critique" : maxSev === 3 ? "Alerte" : maxSev === 2 ? "Vigilance" : "Calme";
  const sevColor = maxSev === 4 ? "#C8311F" : maxSev === 3 ? "#E27431" : maxSev === 2 ? "#D9A12B" : "#4CB07A";

  const tierBadge = c.tier === "partenariat"
    ? '<span class="popup-tier-badge partner">Partenariat</span>'
    : `<span class="popup-tier-badge filiale">${c.hq ? "Siège" : "Filiale"}</span>`;
  $("#popup-flag").textContent = c.flag;
  $("#popup-name").innerHTML = `${escapeHtml(c.name)} ${tierBadge}`;
  $("#popup-meta").innerHTML = `${escapeHtml(c.region)} · ${escapeHtml(c.city)}`;
  $("#popup-stats").innerHTML = `
    <div><strong>${signalsHere.length}</strong><span>Signaux 14j</span></div>
    <div><strong>${verifiedCount}</strong><span>Multi-sources</span></div>
    <div><strong style="color:${sevColor}">${sevLabel}</strong><span>Niveau</span></div>
  `;
  popupEl.hidden = false;
  positionPopup(event);
}
function positionPopup(event) {
  popupEl.style.left = event.clientX + "px";
  popupEl.style.top = event.clientY + "px";
}
function hidePopup() { popupEl.hidden = true; }

// ============================================================
// Sélection pays
// ============================================================
function selectCountry(code) {
  state.selectedCountry = (state.selectedCountry === code) ? null : code;
  state.activeCategory = null;
  renderFeed();
  renderCategoryFilters();
  renderChips();
  $$(".olea-marker").forEach((m) => {
    m.classList.toggle("selected", m.dataset.country === state.selectedCountry);
  });
  $$("path.country-shape").forEach((p) => p.classList.remove("active"));
  if (state.selectedCountry) {
    const num = String(ISO_NUMERIC[state.selectedCountry]).padStart(3, "0");
    const el = document.querySelector(`path.country-shape[data-id="${num}"]`);
    if (el) el.classList.add("active");
  }
  $("#reset-filter").hidden = !state.selectedCountry;
}

// ============================================================
// Fil de news
// ============================================================
function filteredSignals() {
  let out = state.signals.slice();
  if (state.selectedCountry) out = out.filter((s) => s.country === state.selectedCountry);
  if (state.activeCategory)  out = out.filter((s) => s.category === state.activeCategory);
  if (state.searchQuery.trim()) out = out.filter(signalMatchesSearch);
  out.sort(SORT_FNS[state.sortMode] || SORT_FNS.severity);
  return out;
}

function renderSortControls() {
  $$(".sort-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.sort === state.sortMode);
  });
  const sum = $("#sort-summary");
  if (sum) sum.innerHTML = `tri par <strong>${SORT_LABELS[state.sortMode]}</strong>`;
}

// Bind les boutons de tri (une fois au boot)
function bindSortControls() {
  $$(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.sort;
      if (!SORT_FNS[mode] || state.sortMode === mode) return;
      state.sortMode = mode;
      renderSortControls();
      renderFeed();
    });
  });
}

function renderFeed() {
  const list = $("#feed-list");
  const signals = filteredSignals();

  // Titre
  if (state.selectedCountry) {
    const c = countryByCode(state.selectedCountry);
    $("#feed-title").innerHTML = `${c.flag}&nbsp; ${escapeHtml(c.name)}`;
  } else {
    $("#feed-title").textContent = "Toute l'Afrique OLEA";
  }
  $("#feed-count").textContent = signals.length;

  if (signals.length === 0) {
    list.innerHTML = `
      <div class="feed-empty">
        <strong>Aucun signal pour ces filtres</strong>
        Aucun article remonté sur la fenêtre 14 jours pour cette combinaison.
      </div>`;
    return;
  }

  list.innerHTML = signals.map(renderSignal).join("");
  // Click → ouvre la source
  list.querySelectorAll(".signal").forEach((el) => {
    el.addEventListener("click", () => {
      const url = el.dataset.url;
      if (url && url !== "#") window.open(url, "_blank", "noopener");
    });
  });
}

function renderSignal(s) {
  const c = countryByCode(s.country) || { name: s.country, flag: "" };
  const cat = CATEGORIES[s.category] || { label: s.category, color: "#999" };
  const sevLabels = { 1: "Info", 2: "Vigilance", 3: "Alerte", 4: "Critique" };
  const sev = s.severity || 1;

  const credBars = Array.from({ length: 5 }, (_, i) =>
    `<span class="cred-bar ${i < (s.credibility || 1) ? "on" : ""}"></span>`).join("");

  const verifiedBadge = s.verified ? `
    <span class="verified-badge" title="Cross-vérifié par ${s.confirmation_count} sources">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0L9.96 1.69L12.54 1.21L13.55 3.61L15.84 4.79L15.31 7.38L16.55 9.69L14.69 11.55L14.34 14.17L11.71 14.41L9.69 16L7.45 14.6L4.83 14.96L4.06 12.45L1.84 11L2.44 8.42L1.66 5.91L4.06 4.55L5.24 2.28L7.84 2.62L8 0Z M11.4 5.6L7.2 9.8L4.8 7.4L4 8.2L7.2 11.4L12.2 6.4L11.4 5.6Z"/>
      </svg>
      Vérifié ${s.confirmation_count}× sources
    </span>` : "";

  const confirmingSrcs = (s.confirming_sources || []).slice(0, 3).map((src) => `
    <span class="source-pill tier-${src.tier}">${escapeHtml(src.name)}</span>
  `).join("");

  return `
  <article class="signal sev-${sev}" data-url="${escapeHtml(s.lead_source?.url || "#")}">
    <div class="signal-meta">
      <span class="signal-country-tag">${c.flag} ${escapeHtml(c.name)}</span>
      <span class="signal-cat"><span class="cat-swatch" style="background:${cat.color}"></span>${escapeHtml(cat.label)}</span>
      <span class="signal-time">${timeAgo(s.published)}</span>
      <span class="signal-sev-badge">${sevLabels[sev]}</span>
      ${verifiedBadge}
    </div>
    <h3 class="signal-title">${highlight(s.title)}</h3>
    <p class="signal-summary">${highlight(s.summary || "")}</p>
    <div class="signal-sources">
      ${confirmingSrcs || `<span class="source-pill tier-${s.lead_source?.tier || 2}">${escapeHtml(s.lead_source?.name || "")}</span>`}
      <span class="signal-credibility" title="Fiabilité : ${s.credibility}/5">
        <span style="font-size:10px;color:var(--ink-3);margin-right:4px;letter-spacing:0.05em;">FIABILITÉ</span>
        ${credBars}
      </span>
    </div>
  </article>`;
}

// ============================================================
// Filtres catégories
// ============================================================
function renderCategoryFilters() {
  const wrap = $("#category-filters");
  // compter par catégorie sur le scope actuel (pays sélectionné OU global)
  const scope = state.selectedCountry
    ? state.signals.filter((s) => s.country === state.selectedCountry)
    : state.signals;
  const counts = {};
  for (const s of scope) counts[s.category] = (counts[s.category] || 0) + 1;

  const sorted = Object.entries(CATEGORIES)
    .map(([k, v]) => ({ key: k, ...v, count: counts[k] || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  wrap.innerHTML = sorted.map((c) => `
    <button class="cat-pill ${state.activeCategory === c.key ? "active" : ""}" data-cat="${c.key}">
      <span class="cat-swatch" style="background:${c.color}"></span>
      ${escapeHtml(c.short)}
      <span class="cat-count">${c.count}</span>
    </button>
  `).join("");

  wrap.querySelectorAll(".cat-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      state.activeCategory = (state.activeCategory === cat) ? null : cat;
      renderFeed();
      renderCategoryFilters();
    });
  });
}

// ============================================================
// Chips pays
// ============================================================
function renderChips() {
  const wrap = $("#country-chips");
  const counts = {};
  for (const s of state.signals) counts[s.country] = (counts[s.country] || 0) + 1;

  const sorted = OLEA_COUNTRIES
    .map((c) => ({ ...c, count: counts[c.code] || 0 }))
    .sort((a, b) => b.count - a.count);

  wrap.innerHTML = sorted.map((c) => `
    <button class="country-chip ${state.selectedCountry === c.code ? "active" : ""}" data-code="${c.code}">
      <span>${c.flag}</span>
      <span>${escapeHtml(c.name)}</span>
      <span class="chip-count">${c.count}</span>
    </button>
  `).join("");

  wrap.querySelectorAll(".country-chip").forEach((btn) => {
    btn.addEventListener("click", () => selectCountry(btn.dataset.code));
  });
}

// ============================================================
// Dashboard
// ============================================================
function renderDashboard() {
  // ---- Par catégorie (barres) ----
  const counts = {};
  for (const s of state.signals) counts[s.category] = (counts[s.category] || 0) + 1;
  const max = Math.max(1, ...Object.values(counts));
  const rows = Object.entries(CATEGORIES)
    .map(([k, v]) => ({ key: k, ...v, count: counts[k] || 0 }))
    .sort((a, b) => b.count - a.count);

  $("#cat-bars").innerHTML = rows.map((r) => `
    <div class="cat-row">
      <span class="cat-name"><span class="cat-swatch" style="background:${r.color}"></span>${escapeHtml(r.label)}</span>
      <span class="cat-track"><span class="cat-fill" style="width:${(r.count / max) * 100}%; background:${r.color}"></span></span>
      <span class="cat-val">${r.count}</span>
    </div>
  `).join("");

  // ---- Par région (sévérité moyenne) ----
  const byRegion = {};
  for (const c of OLEA_COUNTRIES) {
    if (!byRegion[c.region]) byRegion[c.region] = { codes: [], maxSev: 0, total: 0 };
    byRegion[c.region].codes.push(c.code);
  }
  for (const sig of state.signals) {
    const c = countryByCode(sig.country);
    if (!c) continue;
    byRegion[c.region].total += 1;
    byRegion[c.region].maxSev = Math.max(byRegion[c.region].maxSev, sig.severity);
  }
  const regionRows = Object.entries(byRegion).map(([name, r]) => ({
    name, ...r,
  })).sort((a, b) => b.maxSev - a.maxSev || b.total - a.total);

  $("#region-list").innerHTML = regionRows.map((r) => {
    const gauges = [1, 2, 3, 4].map((lvl) =>
      `<span class="g ${lvl <= r.maxSev ? "on-" + r.maxSev : ""}"></span>`
    ).join("");
    return `
    <div class="region-row">
      <div>
        <div class="region-name">${escapeHtml(r.name)}</div>
        <div class="region-name-sub">${r.codes.length} filiales · ${r.total} signaux</div>
      </div>
      <div class="region-gauge">${gauges}</div>
    </div>`;
  }).join("");

  // ---- Alertes critiques ----
  const critical = state.signals
    .filter((s) => s.severity >= 3)
    .slice(0, 10);
  $("#critical-badge").textContent = state.signals.filter((s) => s.severity === 4).length;
  $("#alerts-list").innerHTML = critical.map((s) => {
    const c = countryByCode(s.country) || { flag: "", name: s.country };
    return `
    <div class="alert-item" data-url="${escapeHtml(s.lead_source?.url || "#")}" style="border-left-color: ${s.severity === 4 ? "var(--sev-4)" : "var(--sev-3)"}">
      <div class="alert-head">
        <span class="alert-flag">${c.flag}</span>
        <span>${escapeHtml(c.name)}</span>
        <span style="margin-left:auto">${timeAgo(s.published)}</span>
      </div>
      <div class="alert-title">${escapeHtml(s.title)}</div>
    </div>`;
  }).join("");
  $$("#alerts-list .alert-item").forEach((el) => {
    el.addEventListener("click", () => {
      const url = el.dataset.url;
      if (url && url !== "#") window.open(url, "_blank", "noopener");
    });
  });
}

// ============================================================
// KPIs
// ============================================================
function renderKPIs() {
  const nFil = OLEA_COUNTRIES.filter((c) => c.tier === "filiale").length;
  const nPart = OLEA_COUNTRIES.filter((c) => c.tier === "partenariat").length;
  $("#kpi-countries").textContent = OLEA_COUNTRIES.length;
  const lab = $("#kpi-countries-label");
  if (lab) lab.textContent = `${nFil} filiales · ${nPart} partenariats`;
  $("#kpi-sources").textContent = state.sources?.length || "—";
  $("#kpi-articles").textContent = state.signals.length;
  // Articles critiques sur 24h
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const critical24 = state.signals.filter((s) =>
    s.severity >= 3 && s.published && new Date(s.published).getTime() > dayAgo
  ).length;
  $("#kpi-critical").textContent = critical24;
  renderSnapshot();
}

// Affiche la fraîcheur des données + couleur si stale.
function renderSnapshot() {
  const snap = $("#snapshot-info");
  if (!snap || !state.generatedAt) return;
  const d = new Date(state.generatedAt);
  const ageMin = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  let freshness;
  if (ageMin < 1)        freshness = "à l'instant";
  else if (ageMin < 60)  freshness = `il y a ${ageMin} min`;
  else if (ageMin < 1440) freshness = `il y a ${Math.round(ageMin/60)} h`;
  else                   freshness = `il y a ${Math.round(ageMin/1440)} j`;
  const stamp = d.toLocaleString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
  snap.innerHTML = `Actualisé <strong>${freshness}</strong> · ${stamp} · ↻ rafraîchir`;
  // Couleur si stale
  snap.classList.remove("stale", "very-stale");
  if (ageMin >= 30 && ageMin < 120) snap.classList.add("stale");
  else if (ageMin >= 120)           snap.classList.add("very-stale");
}

// ============================================================
// Marchés économiques (FX + IDE)
// ============================================================
function formatRate(v) {
  if (v == null) return "—";
  if (v >= 1000) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
  if (v >= 100)  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v);
  if (v >= 10)   return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v);
  if (v >= 1)    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(v);
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 5 }).format(v);
}

function formatUSD(v) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e9)  return (v / 1e9).toFixed(2) + " Mds";
  if (Math.abs(v) >= 1e6)  return (v / 1e6).toFixed(1) + " M";
  if (Math.abs(v) >= 1e3)  return (v / 1e3).toFixed(1) + " k";
  return String(v);
}

function renderFXDashboardCard() {
  if (!state.fx) return;
  const sub = $("#fx-card-sub");
  if (sub && state.fx.provider?.api_updated_utc) {
    const d = new Date(state.fx.provider.api_updated_utc);
    sub.textContent = "MAJ " + d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }
  // 6 marchés clés affichés en dashboard
  const featured = [
    { code: "MAR", ccy: "MAD" },
    { code: "NGA", ccy: "NGN" },
    { code: "ZAF", ccy: "ZAR" },
    { code: "KEN", ccy: "KES" },
    { code: "GHA", ccy: "GHS" },
    { code: "CIV", ccy: "XOF" },
  ];
  const list = $("#fx-mini-list");
  if (!list) return;
  list.innerHTML = featured.map((f) => {
    const c = countryByCode(f.code);
    const r = state.fx.rates?.[f.ccy];
    const meta = state.fx.currency_meta?.[f.ccy] || {};
    const pct = state.fx.changes_pct?.[f.ccy];
    const isPeg = !!meta.pegged_eur;
    let arrow = "↔", cls = "tick-flat", ch = "";
    if (isPeg) { arrow = "↔"; cls = "tick-flat"; ch = "PEG"; }
    else if (pct == null) { arrow = "·"; cls = "tick-flat"; ch = ""; }
    else if (pct > 0.01) { arrow = "▲"; cls = "tick-up"; ch = "+" + pct.toFixed(2) + "%"; }
    else if (pct < -0.01) { arrow = "▼"; cls = "tick-down"; ch = pct.toFixed(2) + "%"; }
    return `
      <div class="fx-mini-row">
        <span class="fx-mini-flag">${c?.flag || ""}</span>
        <span class="fx-mini-label">
          <span class="fx-mini-code">${f.ccy} <span style="color:var(--ink-3);font-weight:500;font-size:11px">${escapeHtml(c?.name || "")}</span></span>
          <span class="fx-mini-name">${escapeHtml(meta.name || "")}</span>
        </span>
        <span style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:1px">
          <span class="fx-mini-rate">${formatRate(r)}</span>
          <span class="${cls}" style="font-family:var(--font-mono);font-size:10.5px;font-weight:700">${arrow} ${ch}</span>
        </span>
      </div>`;
  }).join("");
}

// SVG sparkline générique
function buildSparkSVG(values, opts = {}) {
  const W = opts.width || 72, H = opts.height || 18, PAD = 1;
  if (!values || values.length < 2) {
    return `<span class="spark-empty"></span>`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (W - PAD * 2) / (values.length - 1);
  const yFor = (v) => PAD + (H - PAD * 2) * (1 - (v - min) / span);
  let d = "M";
  values.forEach((v, i) => {
    d += `${i === 0 ? "" : " L"}${(PAD + i * stepX).toFixed(2)},${yFor(v).toFixed(2)}`;
  });
  const last = values[values.length - 1];
  const first = values[0];
  const trendCls = last > first ? "up" : (last < first ? "down" : "");
  const area = `${d} L${(W - PAD).toFixed(2)},${(H - PAD).toFixed(2)} L${PAD.toFixed(2)},${(H - PAD).toFixed(2)} Z`;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <path class="area ${trendCls}" d="${area}"></path>
    <path class="line ${trendCls}" d="${d}"></path>
    <circle class="dot ${trendCls}" cx="${(PAD + (values.length - 1) * stepX).toFixed(2)}" cy="${yFor(last).toFixed(2)}" r="1.6"/>
  </svg>`;
}

function renderMarketsSection() {
  // ---- KPIs ----
  if (state.fx) {
    $("#fx-count").textContent = Object.keys(state.fx.rates || {}).length;
    if (state.fx.provider?.api_updated_utc) {
      const d = new Date(state.fx.provider.api_updated_utc);
      const fmt = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
      $("#fx-updated").textContent = fmt;
      const stamp = $("#fx-stamp"); if (stamp) stamp.textContent = fmt;
    }
  }
  if (state.fdi) {
    $("#fdi-coverage").textContent = state.fdi.coverage_count + "/" + OLEA_COUNTRIES.length;
    const total = state.fdi.total_latest_usd || 0;
    $("#fdi-total").textContent = "$" + formatUSD(total);
  }

  // ---- FX table (groupée par région) ----
  const tbody = $("#fx-tbody");
  if (state.fx && tbody) {
    const byRegion = {};
    for (const c of OLEA_COUNTRIES) {
      const ccy = state.fx.country_currency?.[c.code];
      if (!ccy) continue;
      (byRegion[c.region] = byRegion[c.region] || []).push({ country: c, ccy });
    }
    const regionOrder = ["Afrique de l'Ouest", "Afrique du Nord", "Afrique Centrale",
                         "Afrique de l'Est", "Afrique Australe", "Océan Indien"];
    let html = "";
    for (const region of regionOrder) {
      const items = byRegion[region] || [];
      if (!items.length) continue;
      html += `<tr class="region-row"><td colspan="8">${escapeHtml(region.toUpperCase())} · ${items.length} marché${items.length > 1 ? "s" : ""}</td></tr>`;
      for (const it of items) {
        const rate = state.fx.rates?.[it.ccy];
        const meta = state.fx.currency_meta?.[it.ccy] || {};
        const isPeg = !!meta.pegged_eur;
        const pct = state.fx.changes_pct?.[it.ccy];
        const histArr = (state.fx.history?.[it.ccy] || []).map((h) => h.rate).slice(-30);
        if (typeof rate === "number") histArr.push(rate);
        // Tick : pour un taux EUR→local, une HAUSSE du nombre = EUR s'apprécie = local se déprécie.
        // Bloomberg-style : on indique simplement le mouvement du chiffre.
        let arrow = "↔", cls = "tick-flat", changeStr = "0.00%";
        if (isPeg) {
          arrow = "↔"; cls = "tick-flat"; changeStr = "PEGGED";
        } else if (pct == null) {
          arrow = "·"; cls = "tick-flat"; changeStr = "—";
        } else if (pct > 0.01) {
          arrow = "▲"; cls = "tick-up"; changeStr = "+" + pct.toFixed(2) + "%";
        } else if (pct < -0.01) {
          arrow = "▼"; cls = "tick-down"; changeStr = pct.toFixed(2) + "%";
        }
        const sparkHtml = (isPeg || histArr.length < 2)
          ? `<span class="spark-empty"></span>`
          : buildSparkSVG(histArr);
        html += `
          <tr>
            <td class="col-flag fx-flag-cell">${it.country.flag}</td>
            <td class="col-code">${it.ccy}</td>
            <td class="col-country">${escapeHtml(it.country.name)}</td>
            <td class="col-currency-name">${escapeHtml(meta.name || "")}</td>
            <td class="col-last col-last-big">${formatRate(rate)}</td>
            <td class="tick-cell ${cls}"><span class="arrow">${arrow}</span>${changeStr}</td>
            <td class="col-spark">${sparkHtml}</td>
            <td><span class="regime-tag ${isPeg ? "pegged" : "floating"}">${isPeg ? "PEGGED EUR" : "FLOATING"}</span></td>
          </tr>`;
      }
    }
    tbody.innerHTML = html;
  }

  // ---- FDI table (tri par valeur décroissante) ----
  const fdibody = $("#fdi-tbody");
  if (state.fdi && fdibody) {
    const items = OLEA_COUNTRIES.map((c) => {
      const data = state.fdi.countries?.[c.code] || null;
      return { country: c, data };
    }).sort((a, b) => {
      const va = a.data?.latest?.value ?? -Infinity;
      const vb = b.data?.latest?.value ?? -Infinity;
      return vb - va;
    });

    let html = "";
    for (const { country: c, data } of items) {
      if (!data || !data.latest) {
        html += `
          <tr>
            <td class="col-flag fdi-flag-cell">${c.flag}</td>
            <td class="col-iso">${c.code}</td>
            <td class="col-country">${escapeHtml(c.name)}</td>
            <td colspan="5" class="fdi-empty">— données indisponibles World Bank</td>
          </tr>`;
        continue;
      }
      const latest = data.latest;
      const yoy = data.yoy_pct;
      let arrow = "·", cls = "tick-flat", yoyStr = "—";
      if (yoy == null) { /* keep defaults */ }
      else if (yoy > 1)   { arrow = "▲"; cls = "tick-up";   yoyStr = "+" + yoy.toFixed(1) + "%"; }
      else if (yoy < -1)  { arrow = "▼"; cls = "tick-down"; yoyStr = yoy.toFixed(1) + "%"; }
      else                { arrow = "·"; cls = "tick-flat"; yoyStr = yoy.toFixed(1) + "%"; }

      const histVals = (data.history || []).filter((h) => h.value != null).slice(-7).map((h) => h.value);
      const sparkHtml = buildSparkSVG(histVals);
      const avg5Str = data.avg_5y_usd ? "$" + formatUSD(data.avg_5y_usd) : "—";

      html += `
        <tr>
          <td class="col-flag fdi-flag-cell">${c.flag}</td>
          <td class="col-iso">${c.code}</td>
          <td class="col-country">${escapeHtml(c.name)}</td>
          <td class="col-num" style="font-weight:500;color:var(--ink-3)">${latest.year}</td>
          <td class="col-num col-last-big">$${formatUSD(latest.value)}</td>
          <td class="tick-cell ${cls}"><span class="arrow">${arrow}</span>${yoyStr}</td>
          <td class="col-num fdi-avg" style="color:var(--ink-3)">${avg5Str}</td>
          <td class="col-spark">${sparkHtml}</td>
        </tr>`;
    }
    fdibody.innerHTML = html;
  }
}

// ============================================================
// Veille réglementaire
// ============================================================
function regulatorySignals() {
  let out = state.signals.filter((s) => s.regulatory);
  if (state.searchQuery.trim()) out = out.filter(signalMatchesSearch);
  return out;
}

function renderRegulatoryKPIs() {
  const all = regulatorySignals();
  $("#regu-total").textContent       = all.length;
  $("#regu-en-vigueur").textContent  = all.filter((s) => s.legal_status === "EN_VIGUEUR").length;
  $("#regu-adopte").textContent      = all.filter((s) => s.legal_status === "ADOPTE" || s.legal_status === "PROMULGUE").length;
  $("#regu-projet").textContent      = all.filter((s) => s.legal_status === "PROJET").length;
}

function renderRegulatoryThemes() {
  const wrap = $("#regu-themes");
  if (!wrap) return;
  const all = regulatorySignals();
  // Compte par thème (les articles sans thème explicite → GENERIQUE)
  const counts = {};
  for (const s of all) {
    const t = s.theme || "GENERIQUE";
    counts[t] = (counts[t] || 0) + 1;
  }
  const sorted = Object.entries(THEMES)
    .map(([k, v]) => ({ key: k, ...v, count: counts[k] || 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const html = [
    `<button class="theme-pill ${state.reguTheme === null ? "active" : ""}" data-theme="">
       <span>Tous</span>
       <span class="theme-count">${all.length}</span>
     </button>`
  ];
  for (const t of sorted) {
    html.push(`
      <button class="theme-pill ${state.reguTheme === t.key ? "active" : ""}" data-theme="${t.key}">
        <span class="theme-swatch" style="background:${t.color}"></span>
        ${escapeHtml(t.short)}
        <span class="theme-count">${t.count}</span>
      </button>`);
  }
  wrap.innerHTML = html.join("");
  wrap.querySelectorAll(".theme-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.theme;
      state.reguTheme = t === "" ? null : (state.reguTheme === t ? null : t);
      renderRegulatoryThemes();
      renderRegulatoryFeed();
    });
  });
}

function renderRegulatoryStatuses() {
  const wrap = $("#regu-statuses");
  if (!wrap) return;
  const all = regulatorySignals();
  const counts = {};
  for (const s of all) {
    if (s.legal_status) counts[s.legal_status] = (counts[s.legal_status] || 0) + 1;
  }
  const order = ["PROJET", "ADOPTE", "PROMULGUE", "EN_VIGUEUR"];
  const html = [
    `<button class="status-pill ${state.reguStatus === null ? "active" : ""}" data-status="">
       <span>Tous statuts</span>
     </button>`
  ];
  for (const k of order) {
    const meta = LEGAL_STATUSES[k];
    if (!meta) continue;
    const n = counts[k] || 0;
    const cls = "status-" + k.toLowerCase();
    html.push(`
      <button class="status-pill ${cls} ${state.reguStatus === k ? "active" : ""}" data-status="${k}" ${n === 0 ? "disabled" : ""}>
        ${escapeHtml(meta.label)}
        <span class="status-count">${n}</span>
      </button>`);
  }
  wrap.innerHTML = html.join("");
  wrap.querySelectorAll(".status-pill:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = btn.dataset.status;
      state.reguStatus = s === "" ? null : (state.reguStatus === s ? null : s);
      renderRegulatoryStatuses();
      renderRegulatoryFeed();
    });
  });
}

function renderRegulatoryFeed() {
  const list = $("#regu-feed");
  if (!list) return;
  let items = regulatorySignals();
  if (state.reguTheme) items = items.filter((s) => (s.theme || "GENERIQUE") === state.reguTheme);
  if (state.reguStatus) items = items.filter((s) => s.legal_status === state.reguStatus);

  // Tri : statut "EN_VIGUEUR" et "PROMULGUE" d'abord (criticité business), puis récence
  const statusOrder = { EN_VIGUEUR: 4, PROMULGUE: 3, ADOPTE: 2, PROJET: 1 };
  items.sort((a, b) => {
    const da = (statusOrder[a.legal_status] || 0);
    const db = (statusOrder[b.legal_status] || 0);
    if (da !== db) return db - da;
    return new Date(b.published || 0) - new Date(a.published || 0);
  });

  if (items.length === 0) {
    list.innerHTML = `
      <div class="regu-feed-empty">
        <strong>Aucun signal pour ce filtre</strong>
        Essaie un autre thème ou statut — ou relâche les filtres.
      </div>`;
    return;
  }

  list.innerHTML = items.map(renderRegulatoryCard).join("");
  list.querySelectorAll(".regu-card").forEach((el) => {
    el.addEventListener("click", () => {
      const url = el.dataset.url;
      if (url && url !== "#") window.open(url, "_blank", "noopener");
    });
  });
}

function renderRegulatoryCard(s) {
  const c = countryByCode(s.country) || { name: s.country, flag: "" };
  const themeKey = s.theme || "GENERIQUE";
  const theme = THEMES[themeKey] || THEMES.GENERIQUE;
  const statusMeta = s.legal_status ? LEGAL_STATUSES[s.legal_status] : null;
  const statusCls = s.legal_status ? "s-" + s.legal_status.toLowerCase() : "";

  const themeBadge = `
    <span class="regu-theme-badge" style="background:${theme.color}15;color:${theme.color}">
      <span class="swatch" style="background:${theme.color}"></span>
      ${escapeHtml(theme.short)}
    </span>`;
  const statusBadge = statusMeta
    ? `<span class="regu-status-badge ${statusCls}">${escapeHtml(statusMeta.label)}</span>`
    : "";

  return `
  <article class="regu-card" data-url="${escapeHtml(s.lead_source?.url || "#")}"
    style="border-top-color:${theme.color}">
    <div class="regu-card-head">
      <span class="regu-country-tag">${c.flag} ${escapeHtml(c.name)}</span>
      ${themeBadge}
      ${statusBadge}
      <span class="regu-time">${timeAgo(s.published)}</span>
    </div>
    <h3 class="regu-card-title">${highlight(s.title)}</h3>
    <p class="regu-card-summary">${highlight(s.summary || "")}</p>
    <div class="regu-card-foot">
      <span class="source-pill">${escapeHtml(s.lead_source?.name || "")}</span>
      ${s.verified ? `<span class="verified-badge" style="margin-left:auto"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.96 1.69L12.54 1.21L13.55 3.61L15.84 4.79L15.31 7.38L16.55 9.69L14.69 11.55L14.34 14.17L11.71 14.41L9.69 16L7.45 14.6L4.83 14.96L4.06 12.45L1.84 11L2.44 8.42L1.66 5.91L4.06 4.55L5.24 2.28L7.84 2.62L8 0Z M11.4 5.6L7.2 9.8L4.8 7.4L4 8.2L7.2 11.4L12.2 6.4L11.4 5.6Z"/></svg>Vérifié</span>` : ""}
    </div>
  </article>`;
}

// ============================================================
// Sources (footer)
// ============================================================
function renderSourcesFooter() {
  const wrap = $("#sources-list");
  wrap.innerHTML = state.sources.map((s) =>
    `<span class="src-chip tier-${s.tier}">${escapeHtml(s.name)}</span>`
  ).join("");
}

// ============================================================
// Reset
// ============================================================
$("#reset-filter").addEventListener("click", () => {
  state.selectedCountry = null;
  state.activeCategory = null;
  renderFeed();
  renderCategoryFilters();
  renderChips();
  $$(".olea-marker").forEach((m) => m.classList.remove("selected"));
  $$("path.country-shape").forEach((p) => p.classList.remove("active"));
  $("#reset-filter").hidden = true;
});

// ============================================================
// Horloge live
// ============================================================
function tickClock() { $("#live-time").textContent = formatClock(); }
setInterval(tickClock, 1000);
tickClock();

// ============================================================
// Recherche transverse
// ============================================================
let searchDebounce = null;
function bindSearch() {
  const input = $("#search-input");
  const clear = $("#search-clear");
  if (!input) return;

  const applyQuery = (q) => {
    state.searchQuery = q || "";
    input.value = state.searchQuery;
    clear.hidden = !state.searchQuery;
    renderFeed();
    renderRegulatoryFeed();
    renderRegulatoryKPIs();
    renderRegulatoryThemes();
    renderRegulatoryStatuses();
  };

  input.addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    const val = e.target.value;
    searchDebounce = setTimeout(() => applyQuery(val), 150);
  });

  clear.addEventListener("click", () => applyQuery(""));

  // Cmd+K / Ctrl+K → focus
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
      input.select();
    }
    if (e.key === "Escape" && document.activeElement === input) {
      applyQuery("");
      input.blur();
    }
  });
}

// ============================================================
// Snapshot — click-to-refresh + tick toutes les minutes
// ============================================================
function bindSnapshotRefresh() {
  const snap = $("#snapshot-info");
  if (!snap) return;
  snap.addEventListener("click", async () => {
    snap.classList.add("refreshing");
    snap.innerHTML = "↻ rafraîchissement…";
    await autoRefresh({ silent: true });
    setTimeout(() => snap.classList.remove("refreshing"), 600);
  });
}
// Re-render le label "il y a X min" chaque 30s sans re-fetch
setInterval(renderSnapshot, 30 * 1000);

// ============================================================
// Auto-refresh
// ============================================================
async function autoRefresh(opts = {}) {
  const previousIds = new Set(state.signals.map((s) => s.id));
  const [ok] = await Promise.all([loadNews(), loadFX(), loadFDI()]);
  if (!ok) return;
  const newOnes = state.signals.filter((s) => !previousIds.has(s.id));
  if (newOnes.length > 0) {
    const toast = $("#toast");
    toast.querySelector(".toast-text").textContent =
      `${newOnes.length} nouveau${newOnes.length > 1 ? "x" : ""} signal détecté`;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 4000);
  }
  renderFeed();
  renderCategoryFilters();
  renderChips();
  renderDashboard();
  renderKPIs();
  renderRegulatoryKPIs();
  renderRegulatoryThemes();
  renderRegulatoryStatuses();
  renderRegulatoryFeed();
  renderFXDashboardCard();
  renderMarketsSection();
}

// ============================================================
// BOOT
// ============================================================
(async function init() {
  await Promise.all([loadNews(), loadFX(), loadFDI()]);
  await renderMap();
  renderChips();
  renderCategoryFilters();
  bindSortControls();
  renderSortControls();
  bindSnapshotRefresh();
  bindSearch();
  renderFeed();
  renderDashboard();
  renderKPIs();
  renderRegulatoryKPIs();
  renderRegulatoryThemes();
  renderRegulatoryStatuses();
  renderRegulatoryFeed();
  renderFXDashboardCard();
  renderMarketsSection();
  renderSourcesFooter();
  setInterval(autoRefresh, REFRESH_MS);
})();
