// ============================================================
// OLEA Intelligence — Internationalisation (FR / EN / PT)
// ============================================================
// La chrome UI est intégralement traduite via ce dictionnaire.
// Les articles restent dans leur langue d'origine (badge FR/EN/PT
// affiché sur chaque card). Un bouton "Traduire" par article
// utilise MyMemory API (gratuit, sans clé, 5k mots/jour).

const I18N_LANGS  = ["fr", "en", "pt"];
const I18N_LABELS = { fr: "Français", en: "English", pt: "Português" };

const STRINGS = {
  // ===== Gate =====
  "gate.title":  { fr: "Démo confidentielle", en: "Confidential demo", pt: "Demonstração confidencial" },
  "gate.lede":   {
    fr: "Cet espace est réservé aux représentants d'OLEA Insurance Solutions ayant reçu le code d'accès. Le lien et le code ne sont pas destinés à être partagés.",
    en: "This space is reserved for OLEA Insurance Solutions representatives who have received an access code. The link and the code are not meant to be shared.",
    pt: "Este espaço é reservado aos representantes da OLEA Insurance Solutions que receberam o código de acesso. O link e o código não devem ser partilhados.",
  },
  "gate.label":  { fr: "Code d'accès",     en: "Access code",       pt: "Código de acesso" },
  "gate.btn":    { fr: "Accéder à la démo →", en: "Enter the demo →", pt: "Entrar na demo →" },
  "gate.error":  { fr: "Code invalide.",   en: "Invalid code.",     pt: "Código inválido." },
  "gate.foot":   {
    fr: "Session limitée à ce navigateur · données démonstratives non contractuelles",
    en: "Session limited to this browser · demonstrative data, non-contractual",
    pt: "Sessão limitada a este navegador · dados demonstrativos não contratuais",
  },

  // ===== Bandeau confidentiel =====
  "strip.confidential": {
    fr: "● Démo confidentielle · OLEA Insurance Solutions",
    en: "● Confidential demo · OLEA Insurance Solutions",
    pt: "● Demonstração confidencial · OLEA Insurance Solutions",
  },
  "snapshot.actualise":  { fr: "Actualisé",  en: "Updated",  pt: "Atualizado" },
  "snapshot.refresh":    { fr: "↻ rafraîchir", en: "↻ refresh", pt: "↻ atualizar" },
  "snapshot.refreshing": { fr: "↻ rafraîchissement…", en: "↻ refreshing…", pt: "↻ a atualizar…" },
  "snapshot.title":      { fr: "Cliquer pour rafraîchir maintenant", en: "Click to refresh now", pt: "Clicar para atualizar agora" },

  // ===== Nav =====
  "nav.home":       { fr: "Accueil",              en: "Home",                  pt: "Início" },
  "nav.regulatory": { fr: "Veille réglementaire", en: "Regulatory watch",      pt: "Vigilância regulatória" },
  "nav.markets":    { fr: "Marchés & IDE",        en: "Markets & FDI",         pt: "Mercados & IDE" },
  "search.placeholder": {
    fr: "Rechercher : Mali, fiscalité, OHADA, projet de loi…",
    en: "Search: Mali, tax, OHADA, draft bill…",
    pt: "Procurar: Mali, fiscalidade, OHADA, projeto de lei…",
  },
  "live":       { fr: "LIVE", en: "LIVE", pt: "AO VIVO" },
  "lang.label": { fr: "Langue", en: "Language", pt: "Idioma" },

  // ===== Hero =====
  "hero.tagline": {
    fr: "Plateforme propriétaire · pitch concept",
    en: "Proprietary platform · pitch concept",
    pt: "Plataforma proprietária · conceito de apresentação",
  },
  "hero.title": {
    fr: "L'asymétrie d'information n'a plus<br/>sa place dans le courtage africain.",
    en: "Information asymmetry no longer has<br/>a place in African insurance broking.",
    pt: "A assimetria de informação já não tem<br/>lugar na corretagem africana.",
  },
  "hero.lede": {
    fr: "OLEA Intelligence agrège en continu les <strong>sources de presse de confiance</strong> couvrant les <strong>26 filiales</strong> et <strong>13 partenariats</strong> du réseau OLEA à travers l'Afrique. Sinistres majeurs, climat, réglementation, cyber, politique : chaque signal pertinent pour vos clients corporate, avec <strong>vérification croisée multi-sources</strong> pour filtrer le bruit.",
    en: "OLEA Intelligence continuously aggregates <strong>trusted press sources</strong> covering the <strong>26 subsidiaries</strong> and <strong>13 partnerships</strong> of the OLEA network across Africa. Major claims, climate, regulation, cyber, politics: every signal relevant to your corporate clients, with <strong>multi-source cross-verification</strong> to filter out noise.",
    pt: "A OLEA Intelligence agrega continuamente <strong>fontes de imprensa de confiança</strong> que cobrem as <strong>26 filiais</strong> e <strong>13 parcerias</strong> da rede OLEA em África. Sinistros graves, clima, regulação, ciber, política: cada sinal relevante para os seus clientes corporativos, com <strong>verificação cruzada multi-fonte</strong> para filtrar o ruído.",
  },
  "kpi.countries.label": { fr: "26 filiales · 13 partenariats", en: "26 subsidiaries · 13 partnerships", pt: "26 filiais · 13 parcerias" },
  "kpi.sources":         { fr: "Sources monitorées",  en: "Sources monitored",  pt: "Fontes monitorizadas" },
  "kpi.articles":        { fr: "Articles cette semaine", en: "Articles this week", pt: "Artigos esta semana" },
  "kpi.critical":        { fr: "Alertes critiques 24h", en: "Critical alerts 24h", pt: "Alertas críticos 24h" },

  // ===== Workspace map =====
  "map.eyebrow":        { fr: "Cartographie active", en: "Active mapping", pt: "Cartografia ativa" },
  "map.title":          { fr: "Présence OLEA & signaux du jour", en: "OLEA presence & today's signals", pt: "Presença OLEA e sinais do dia" },
  "legend.network":     { fr: "Réseau", en: "Network", pt: "Rede" },
  "legend.level":       { fr: "Niveau", en: "Level", pt: "Nível" },
  "legend.subsidiary":  { fr: "Filiale", en: "Subsidiary", pt: "Filial" },
  "legend.partnership": { fr: "Partenariat", en: "Partnership", pt: "Parceria" },
  "legend.calm":        { fr: "Calme", en: "Calm", pt: "Calmo" },
  "legend.vigilance":   { fr: "Vigilance", en: "Watch", pt: "Vigilância" },
  "legend.alert":       { fr: "Alerte", en: "Alert", pt: "Alerta" },
  "legend.critical":    { fr: "Critique", en: "Critical", pt: "Crítico" },
  "map.hint":           { fr: "Cliquez sur un pays pour filtrer le fil de news", en: "Click a country to filter the news feed", pt: "Clique num país para filtrar o feed" },

  // ===== Feed =====
  "feed.eyebrow":   { fr: "Fil temps réel",       en: "Real-time feed",       pt: "Feed em tempo real" },
  "feed.title.all":{ fr: "Toute l'Afrique OLEA", en: "All OLEA Africa",      pt: "Toda a África OLEA" },
  "feed.reset":    { fr: "← Tous les pays",      en: "← All countries",      pt: "← Todos os países" },
  "sort.label":    { fr: "Trier par",            en: "Sort by",              pt: "Ordenar por" },
  "sort.severity": { fr: "Critiques",            en: "Critical",             pt: "Críticos" },
  "sort.recent":   { fr: "Récentes",             en: "Recent",               pt: "Recentes" },
  "sort.credibility": { fr: "Fiables",           en: "Reliable",             pt: "Fiáveis" },
  "sort.summary.prefix":     { fr: "tri par", en: "sorted by", pt: "ordenado por" },
  "sort.summary.severity":   { fr: "sévérité", en: "severity", pt: "severidade" },
  "sort.summary.recent":     { fr: "date", en: "date", pt: "data" },
  "sort.summary.credibility":{ fr: "fiabilité", en: "reliability", pt: "fiabilidade" },
  "feed.meta.signals":       { fr: "signaux", en: "signals", pt: "sinais" },
  "feed.meta.autorefresh":   { fr: "auto-refresh actif", en: "auto-refresh on", pt: "auto-atualização ativa" },
  "feed.empty.title":        { fr: "Aucun signal pour ces filtres", en: "No signals for these filters", pt: "Sem sinais para estes filtros" },
  "feed.empty.body":         { fr: "Aucun article remonté sur la fenêtre courante pour cette combinaison.", en: "No articles in the current window for this combination.", pt: "Nenhum artigo na janela atual para esta combinação." },
  "verified.label":   { fr: "Vérifié", en: "Verified", pt: "Verificado" },
  "verified.sources": { fr: "sources", en: "sources", pt: "fontes" },
  "reliability":         { fr: "FIABILITÉ", en: "RELIABILITY", pt: "FIABILIDADE" },
  "reliability.tooltip": { fr: "Fiabilité", en: "Reliability", pt: "Fiabilidade" },
  "translate.action":  { fr: "Traduire", en: "Translate", pt: "Traduzir" },
  "translate.loading": { fr: "Traduction…", en: "Translating…", pt: "A traduzir…" },
  "translate.error":   { fr: "Traduction indisponible", en: "Translation unavailable", pt: "Tradução indisponível" },
  "translate.original":{ fr: "Voir l'original", en: "View original", pt: "Ver original" },

  // ===== Sector filter (home page) =====
  "sector.eyebrow": { fr: "Filtre secteur", en: "Sector filter", pt: "Filtro setor" },
  "sector.all":     { fr: "Tous secteurs", en: "All sectors",   pt: "Todos os setores" },
  "sector.explainer": {
    fr: "Sélectionnez le secteur d'assurance à surveiller : le fil se limite aux signaux touchant à cette branche.",
    en: "Select the insurance branch to monitor: the feed is limited to signals related to that sector.",
    pt: "Selecione o ramo de seguro a monitorizar: o feed é limitado aos sinais relacionados com esse setor.",
  },

  // Severity
  "sev.1": { fr: "Info", en: "Info", pt: "Info" },
  "sev.2": { fr: "Vigilance", en: "Watch", pt: "Vigilância" },
  "sev.3": { fr: "Alerte", en: "Alert", pt: "Alerta" },
  "sev.4": { fr: "Critique", en: "Critical", pt: "Crítico" },

  // Time relative
  "time.now":      { fr: "à l'instant", en: "just now", pt: "agora mesmo" },
  "time.minAgo":   { fr: "il y a {n} min", en: "{n} min ago", pt: "há {n} min" },
  "time.hourAgo":  { fr: "il y a {n} h", en: "{n} h ago", pt: "há {n} h" },
  "time.dayAgo":   { fr: "il y a {n} j", en: "{n} d ago", pt: "há {n} d" },

  // Popup pays
  "popup.signals14": { fr: "Signaux 14j", en: "14d signals", pt: "Sinais 14d" },
  "popup.verified":  { fr: "Multi-sources", en: "Multi-source", pt: "Multi-fonte" },
  "popup.level":     { fr: "Niveau", en: "Level", pt: "Nível" },
  "popup.cta":       { fr: "Cliquez pour ouvrir le fil →", en: "Click to open the feed →", pt: "Clicar para abrir o feed →" },
  "popup.hq":        { fr: "Siège", en: "Head office", pt: "Sede" },

  // ===== Dashboard =====
  "dash.eyebrow":         { fr: "Dashboard de pilotage", en: "Control dashboard", pt: "Painel de controlo" },
  "dash.title":           { fr: "Vue d'ensemble du risque pan-africain", en: "Pan-African risk overview", pt: "Visão geral do risco pan-africano" },
  "dash.byCategory":      { fr: "Par catégorie de risque", en: "By risk category", pt: "Por categoria de risco" },
  "dash.last7days":       { fr: "7 derniers jours", en: "Last 7 days", pt: "Últimos 7 dias" },
  "dash.byRegion":        { fr: "Par région", en: "By region", pt: "Por região" },
  "dash.avgSeverity":     { fr: "Sévérité moyenne", en: "Average severity", pt: "Severidade média" },
  "dash.criticalAlerts":  { fr: "Alertes critiques en cours", en: "Active critical alerts", pt: "Alertas críticos ativos" },
  "dash.fxCard.title":    { fr: "Devises clés & EUR", en: "Key currencies vs EUR", pt: "Divisas-chave vs EUR" },
  "dash.fxCard.link":     { fr: "Voir toutes les devises & IDE →", en: "See all currencies & FDI →", pt: "Ver todas as divisas & IDE →" },

  // ===== Regulatory =====
  "regu.eyebrow":  { fr: "Conformité · juridique", en: "Compliance · legal", pt: "Conformidade · jurídico" },
  "regu.title":    { fr: "Veille réglementaire pan-africaine", en: "Pan-African regulatory monitoring", pt: "Monitorização regulatória pan-africana" },
  "regu.lede": {
    fr: "Détection automatique des signaux juridiques dans les sources monitorées, classifiés par <strong>thème métier</strong> (solvabilité, réassurance, AML/CFT, données, ESG, fiscalité, OHADA…) et par <strong>statut</strong> (projet → en vigueur).",
    en: "Automatic detection of legal signals in monitored sources, classified by <strong>business theme</strong> (solvency, reinsurance, AML/CFT, data, ESG, tax, OHADA…) and by <strong>status</strong> (draft → in force).",
    pt: "Deteção automática de sinais jurídicos nas fontes monitorizadas, classificados por <strong>tema de negócio</strong> (solvência, resseguro, AML/CFT, dados, ESG, fiscalidade, OHADA…) e por <strong>estado</strong> (projeto → em vigor).",
  },
  "regu.kpi.total":     { fr: "Signaux réglementaires 14j", en: "Regulatory signals 14d", pt: "Sinais regulatórios 14d" },
  "regu.kpi.vigueur":   { fr: "Entrés en vigueur",  en: "Entered into force",    pt: "Em vigor" },
  "regu.kpi.adopte":    { fr: "Adoptés / promulgués", en: "Adopted / promulgated", pt: "Adotados / promulgados" },
  "regu.kpi.projet":    { fr: "Projets en discussion", en: "Drafts under discussion", pt: "Projetos em discussão" },
  "regu.filter.theme":  { fr: "Thème", en: "Theme", pt: "Tema" },
  "regu.filter.status": { fr: "Statut juridique", en: "Legal status", pt: "Estado legal" },
  "regu.note": {
    fr: "<strong>v1 — détection par mots-clés sur les flux presse de confiance.</strong> La v2 production ajoutera la connexion directe aux sites des régulateurs (CIMA, NAICOM, ACAPS, IRA, FSCA, NIC, JO nationaux, IFRS, GIABA) et le parsing des actes uniformes OHADA pour une couverture sources primaires.",
    en: "<strong>v1 — keyword-based detection on trusted press feeds.</strong> Production v2 will add direct connection to regulator websites (CIMA, NAICOM, ACAPS, IRA, FSCA, NIC, national Official Gazettes, IFRS, GIABA) and OHADA uniform acts parsing for primary-source coverage.",
    pt: "<strong>v1 — deteção por palavras-chave em fontes de imprensa de confiança.</strong> A v2 de produção adicionará ligação direta aos sites dos reguladores (CIMA, NAICOM, ACAPS, IRA, FSCA, NIC, gazetas oficiais nacionais, IFRS, GIABA) e análise dos atos uniformes OHADA para cobertura de fontes primárias.",
  },
  "regu.feed.empty.title": { fr: "Aucun signal pour ce filtre", en: "No signals for this filter", pt: "Sem sinais para este filtro" },
  "regu.feed.empty.body":  { fr: "Essaie un autre thème ou statut — ou relâche les filtres.", en: "Try another theme or status — or release the filters.", pt: "Tente outro tema ou estado — ou retire os filtros." },
  "pill.all":         { fr: "Tous", en: "All", pt: "Todos" },
  "pill.allStatuses": { fr: "Tous statuts", en: "All statuses", pt: "Todos os estados" },

  // ===== Markets =====
  "markets.eyebrow":  { fr: "Marchés économiques", en: "Economic markets",  pt: "Mercados económicos" },
  "markets.title":    { fr: "Devises locales & investissements directs étrangers", en: "Local currencies & foreign direct investment", pt: "Divisas locais & investimento direto estrangeiro" },
  "markets.lede": {
    fr: "Taux de change <strong>EUR → devises locales</strong> des 28 marchés monétaires OLEA, mis à jour quotidiennement depuis les taux de référence BCE. Flux d'<strong>IDE annuels</strong> par pays sourcés du World Bank Open Data.",
    en: "Exchange rates <strong>EUR → local currencies</strong> for the 28 OLEA monetary markets, updated daily from ECB reference rates. Annual <strong>FDI inflows</strong> per country sourced from World Bank Open Data.",
    pt: "Taxas de câmbio <strong>EUR → divisas locais</strong> para os 28 mercados monetários OLEA, atualizadas diariamente a partir das taxas de referência do BCE. Fluxos anuais de <strong>IDE</strong> por país obtidos do World Bank Open Data.",
  },
  "markets.kpi.fx":     { fr: "Devises monitorées", en: "Currencies monitored", pt: "Divisas monitorizadas" },
  "markets.kpi.fxMaj":  { fr: "Dernière MAJ taux", en: "Latest rate update", pt: "Última atualização de taxas" },
  "markets.kpi.fdiCov": { fr: "Pays avec donnée IDE", en: "Countries with FDI data", pt: "Países com dados IDE" },
  "markets.kpi.fdiTotal":{fr: "Flux IDE agrégé (USD)", en: "Aggregate FDI flow (USD)", pt: "Fluxo IDE agregado (USD)" },
  "markets.note": {
    fr: "Sources : <strong>ExchangeRate-API</strong> pour les taux spot, <strong>Yahoo Finance</strong> pour l'historique 1 an, <strong>World Bank Open Data</strong> (BX.KLT.DINV.CD.WD) pour les flux IDE. Francs CFA <em>XOF</em> / <em>XAF</em> peggés EUR (655,957).",
    en: "Sources: <strong>ExchangeRate-API</strong> for spot rates, <strong>Yahoo Finance</strong> for 1-year history, <strong>World Bank Open Data</strong> (BX.KLT.DINV.CD.WD) for FDI flows. CFA francs <em>XOF</em> / <em>XAF</em> pegged to EUR (655.957).",
    pt: "Fontes: <strong>ExchangeRate-API</strong> para taxas à vista, <strong>Yahoo Finance</strong> para histórico 1 ano, <strong>World Bank Open Data</strong> (BX.KLT.DINV.CD.WD) para fluxos IDE. Francos CFA <em>XOF</em> / <em>XAF</em> indexados ao EUR (655,957).",
  },

  // ===== Converter =====
  "conv.title": { fr: "CURRENCY CONVERTER", en: "CURRENCY CONVERTER", pt: "CURRENCY CONVERTER" },
  "conv.meta":  { fr: "EUR base · historique 1Y quotidien", en: "EUR base · 1Y daily history", pt: "Base EUR · histórico 1A diário" },
  "conv.sub":   {
    fr: "Toutes les devises locales africaines OLEA + EUR + USD",
    en: "All African OLEA local currencies + EUR + USD",
    pt: "Todas as divisas locais OLEA + EUR + USD",
  },
  "conv.amount": { fr: "MONTANT",  en: "AMOUNT", pt: "MONTANTE" },
  "conv.from":   { fr: "DEPUIS",   en: "FROM",   pt: "DE" },
  "conv.to":     { fr: "VERS",     en: "TO",     pt: "PARA" },
  "conv.result": { fr: "RÉSULTAT", en: "RESULT", pt: "RESULTADO" },
  "conv.legend": { fr: "Mouvement courbe ▲ vs début période", en: "Trend ▲ vs start of period", pt: "Movimento ▲ vs início do período" },
  "conv.stat.min": { fr: "Bas",   en: "Low",    pt: "Baixo" },
  "conv.stat.max": { fr: "Haut",  en: "High",   pt: "Alto" },
  "conv.stat.chg": { fr: "Variation", en: "Change", pt: "Variação" },
  "conv.empty": {
    fr: "Historique non disponible pour cette paire — données en cours d'accumulation.",
    en: "History not available for this pair — data is being accumulated.",
    pt: "Histórico indisponível para este par — dados em acumulação.",
  },
  "conv.periodOver": { fr: "sur", en: "over", pt: "em" },

  // ===== FX Terminal Table =====
  "fx.title":        { fr: "FX RATES", en: "FX RATES", pt: "FX RATES" },
  "fx.subtitle":     { fr: "28 devises locales · groupé par région · MAJ", en: "28 local currencies · grouped by region · updated", pt: "28 divisas locais · agrupadas por região · atualizado" },
  "fx.legend.up":    { fr: "appréciation EUR", en: "EUR appreciation", pt: "apreciação EUR" },
  "fx.legend.down":  { fr: "dépréciation EUR", en: "EUR depreciation", pt: "depreciação EUR" },
  "fx.legend.flat":  { fr: "stable / parité fixe", en: "stable / pegged", pt: "estável / indexado" },
  "fx.col.code":     { fr: "CODE",    en: "CODE",     pt: "CÓDIGO" },
  "fx.col.country":  { fr: "PAYS",    en: "COUNTRY",  pt: "PAÍS" },
  "fx.col.currency": { fr: "DEVISE",  en: "CURRENCY", pt: "DIVISA" },
  "fx.col.last":     { fr: "LAST",    en: "LAST",     pt: "ÚLTIMO" },
  "fx.col.change":   { fr: "CHANGE",  en: "CHANGE",   pt: "VAR." },
  "fx.col.hist":     { fr: "HIST 30J", en: "HIST 30D", pt: "HIST 30D" },
  "fx.col.regime":   { fr: "RÉGIME",  en: "REGIME",   pt: "REGIME" },
  "fx.regime.pegged":   { fr: "PEGGED EUR",  en: "PEGGED EUR",  pt: "PEG EUR" },
  "fx.regime.floating": { fr: "FLOATING",    en: "FLOATING",    pt: "FLUTUANTE" },

  // ===== FDI Section (page markets) =====
  "fdi.title":       { fr: "FDI INFLOWS", en: "FDI INFLOWS", pt: "FLUXOS IDE" },
  "fdi.subtitle":    {
    fr: "Choisissez un pays pour voir son flux annuel, tendance et news IDE de l'année en cours (sources vérifiées).",
    en: "Choose a country to see annual flow, trend, and YTD FDI news (verified sources).",
    pt: "Escolha um país para ver o fluxo anual, a tendência e as notícias IDE do ano corrente (fontes verificadas).",
  },
  "fdi.dropdown.label": { fr: "Sélection pays", en: "Select country", pt: "Selecionar país" },
  "fdi.dropdown.placeholder": { fr: "— Choisir un marché OLEA —", en: "— Choose an OLEA market —", pt: "— Escolher um mercado OLEA —" },
  "fdi.latestValue": { fr: "Flux IDE dernière année", en: "Latest FDI flow", pt: "Fluxo IDE mais recente" },
  "fdi.yoy":         { fr: "Variation YoY", en: "YoY change", pt: "Variação YoY" },
  "fdi.avg5":        { fr: "Moyenne 5 ans", en: "5-year average", pt: "Média 5 anos" },
  "fdi.newsYTD":     { fr: "News IDE année en cours", en: "YTD FDI news", pt: "Notícias IDE YTD" },
  "fdi.trusted":     { fr: "Sources vérifiées tier 1 & 2 uniquement", en: "Trusted tier-1 & tier-2 sources only", pt: "Apenas fontes verificadas nível 1 & 2" },
  "fdi.chooseCountry": {
    fr: "Sélectionnez un pays dans la liste ci-dessus pour voir sa fiche IDE et l'actualité investissement étranger.",
    en: "Select a country in the list above to see its FDI profile and foreign investment news.",
    pt: "Selecione um país na lista acima para ver o seu perfil IDE e as notícias de investimento estrangeiro.",
  },
  "fdi.noNews":      { fr: "Aucun signal IDE remonté pour ce pays cette année.", en: "No FDI signal picked up for this country this year.", pt: "Nenhum sinal IDE detetado para este país este ano." },

  // ===== Regions =====
  "region.west":     { fr: "AFRIQUE DE L'OUEST", en: "WEST AFRICA",     pt: "ÁFRICA OCIDENTAL" },
  "region.central":  { fr: "AFRIQUE CENTRALE",   en: "CENTRAL AFRICA",  pt: "ÁFRICA CENTRAL" },
  "region.north":    { fr: "AFRIQUE DU NORD",    en: "NORTH AFRICA",    pt: "ÁFRICA DO NORTE" },
  "region.east":     { fr: "AFRIQUE DE L'EST",   en: "EAST AFRICA",     pt: "ÁFRICA ORIENTAL" },
  "region.south":    { fr: "AFRIQUE AUSTRALE",   en: "SOUTHERN AFRICA", pt: "ÁFRICA AUSTRAL" },
  "region.indian":   { fr: "OCÉAN INDIEN",       en: "INDIAN OCEAN",    pt: "OCEANO ÍNDICO" },

  // ===== Categories =====
  "cat.CLIMAT":          { fr: "Climat & CAT NAT",       en: "Climate & NatCat",     pt: "Clima & CAT NAT" },
  "cat.SINISTRE":        { fr: "Sinistres majeurs",      en: "Major claims",         pt: "Sinistros graves" },
  "cat.REGULATION":      { fr: "Réglementation",         en: "Regulation",           pt: "Regulação" },
  "cat.POLITIQUE":       { fr: "Politique & sécurité",   en: "Politics & security",  pt: "Política & segurança" },
  "cat.ECONOMIE":        { fr: "Économie & marchés",     en: "Economy & markets",    pt: "Economia & mercados" },
  "cat.CYBER":           { fr: "Cyber & tech",           en: "Cyber & tech",         pt: "Ciber & tech" },
  "cat.SANTE":           { fr: "Santé publique",         en: "Public health",        pt: "Saúde pública" },
  "cat.INFRASTRUCTURE":  { fr: "Infrastructures",        en: "Infrastructure",       pt: "Infraestruturas" },
  "cat.AUTRE":           { fr: "Autres",                 en: "Others",               pt: "Outros" },
  "cat.short.CLIMAT":        { fr: "Climat", en: "Climate", pt: "Clima" },
  "cat.short.SINISTRE":      { fr: "Sinistres", en: "Claims", pt: "Sinistros" },
  "cat.short.REGULATION":    { fr: "Régul.", en: "Regul.", pt: "Regul." },
  "cat.short.POLITIQUE":     { fr: "Politique", en: "Politics", pt: "Política" },
  "cat.short.ECONOMIE":      { fr: "Économie", en: "Economy", pt: "Economia" },
  "cat.short.CYBER":         { fr: "Cyber", en: "Cyber", pt: "Ciber" },
  "cat.short.SANTE":         { fr: "Santé", en: "Health", pt: "Saúde" },
  "cat.short.INFRASTRUCTURE":{ fr: "Infra", en: "Infra", pt: "Infra" },
  "cat.short.AUTRE":         { fr: "Autre", en: "Other", pt: "Outro" },

  // ===== Themes reg =====
  "theme.SOLVABILITE":  { fr: "Solvabilité & capital", en: "Solvency & capital", pt: "Solvência & capital" },
  "theme.REASSURANCE":  { fr: "Réassurance & cessions", en: "Reinsurance & cessions", pt: "Resseguro & cessões" },
  "theme.PRODUITS_OBL": { fr: "Produits obligatoires", en: "Compulsory products", pt: "Produtos obrigatórios" },
  "theme.AML_CFT":      { fr: "AML/CFT & sanctions", en: "AML/CFT & sanctions", pt: "AML/CFT & sanções" },
  "theme.DATA_CYBER":   { fr: "Données & cyber", en: "Data & cyber", pt: "Dados & ciber" },
  "theme.ESG_CLIMAT":   { fr: "ESG & climat", en: "ESG & climate", pt: "ESG & clima" },
  "theme.MA_GOUV":      { fr: "M&A & gouvernance", en: "M&A & governance", pt: "M&A & governação" },
  "theme.FISCALITE":    { fr: "Fiscalité de l'assurance", en: "Insurance taxation", pt: "Fiscalidade dos seguros" },
  "theme.JURIS_OHADA":  { fr: "Jurisprudence & OHADA", en: "Case law & OHADA", pt: "Jurisprudência & OHADA" },
  "theme.GENERIQUE":    { fr: "Autre réglementaire", en: "Other regulatory", pt: "Outro regulatório" },
  "theme.short.SOLVABILITE":  { fr: "Solvabilité", en: "Solvency", pt: "Solvência" },
  "theme.short.REASSURANCE":  { fr: "Réassurance", en: "Reinsurance", pt: "Resseguro" },
  "theme.short.PRODUITS_OBL": { fr: "Produits obl.", en: "Compulsory", pt: "Obrigatórios" },
  "theme.short.AML_CFT":      { fr: "AML/CFT", en: "AML/CFT", pt: "AML/CFT" },
  "theme.short.DATA_CYBER":   { fr: "Data/Cyber", en: "Data/Cyber", pt: "Dados/Ciber" },
  "theme.short.ESG_CLIMAT":   { fr: "ESG", en: "ESG", pt: "ESG" },
  "theme.short.MA_GOUV":      { fr: "M&A", en: "M&A", pt: "M&A" },
  "theme.short.FISCALITE":    { fr: "Fiscalité", en: "Tax", pt: "Fiscalidade" },
  "theme.short.JURIS_OHADA":  { fr: "Jurisprudence", en: "Case law", pt: "Jurisprudência" },
  "theme.short.GENERIQUE":    { fr: "Autre régl.", en: "Other regul.", pt: "Outro regul." },

  // ===== Legal statuses =====
  "status.PROJET":     { fr: "Projet",     en: "Draft",       pt: "Projeto" },
  "status.ADOPTE":     { fr: "Adopté",     en: "Adopted",     pt: "Adotado" },
  "status.PROMULGUE":  { fr: "Promulgué",  en: "Promulgated", pt: "Promulgado" },
  "status.EN_VIGUEUR": { fr: "En vigueur", en: "In force",    pt: "Em vigor" },

  // ===== Sectors =====
  "sector.AUTO":              { fr: "Automobile", en: "Automotive", pt: "Automóvel" },
  "sector.PROPERTY":          { fr: "Dommages aux biens", en: "Property damage", pt: "Danos patrimoniais" },
  "sector.LIABILITY":         { fr: "Responsabilité civile", en: "Liability", pt: "Responsabilidade civil" },
  "sector.CYBER":             { fr: "Cyber", en: "Cyber", pt: "Ciber" },
  "sector.POLITICAL_VIOLENCE":{ fr: "Violence politique & terrorisme", en: "Political violence & terrorism", pt: "Violência política & terrorismo" },
  "sector.HEALTH":            { fr: "Santé & prévoyance", en: "Health & welfare", pt: "Saúde & previdência" },
  "sector.MARINE_TRANSPORT":  { fr: "Transport & marine", en: "Transport & marine", pt: "Transporte & marítimo" },
  "sector.AVIATION":          { fr: "Aviation", en: "Aviation", pt: "Aviação" },
  "sector.ENERGY":            { fr: "Énergie", en: "Energy", pt: "Energia" },
  "sector.CONSTRUCTION":      { fr: "Construction & BTP", en: "Construction & civil works", pt: "Construção & obras" },
  "sector.AGRICULTURE":       { fr: "Agriculture", en: "Agriculture", pt: "Agricultura" },

  // ===== Drawer FDI =====
  "drawer.eyebrow":   { fr: "IDE · news vérifiées", en: "FDI · verified news", pt: "IDE · notícias verificadas" },
  "drawer.close":     { fr: "Fermer", en: "Close", pt: "Fechar" },
  "drawer.stats.fdi": { fr: "IDE", en: "FDI", pt: "IDE" },
  "drawer.stats.signals": { fr: "Signaux IDE", en: "FDI signals", pt: "Sinais IDE" },
  "drawer.stats.tier1":   { fr: "Sources tier 1", en: "Tier-1 sources", pt: "Fontes tier 1" },
  "drawer.foot": {
    fr: "Filtre : signaux taggés <b>IDE</b> · pays sélectionné · année en cours · uniquement sources tier 1 et 2 (Reuters/BBC/RFI/France 24/Africanews/Jeune Afrique/Ecofin/Financial Afrik/Africa Report/AllAfrica/The East African/Daily Maverick/Lusa/RFI Português…)",
    en: "Filter: signals tagged <b>FDI</b> · selected country · current year · trusted tier-1 and tier-2 sources only",
    pt: "Filtro: sinais marcados <b>IDE</b> · país selecionado · ano corrente · apenas fontes verificadas nível 1 e 2",
  },

  // ===== Toast =====
  "toast.newSignal":   { fr: "Nouveau signal détecté", en: "New signal detected", pt: "Novo sinal detetado" },
  "toast.newSignalN":  { fr: "{n} nouveaux signaux détectés", en: "{n} new signals detected", pt: "{n} novos sinais detetados" },

  // ===== Value prop =====
  "value.eyebrow": { fr: "Pourquoi cette plateforme", en: "Why this platform", pt: "Porquê esta plataforma" },
  "value.title":   { fr: "Du signal faible au levier commercial.", en: "From weak signal to commercial leverage.", pt: "Do sinal fraco à alavanca comercial." },
  "value.1.title": { fr: "Anticipation des sinistres", en: "Claims anticipation", pt: "Antecipação de sinistros" },
  "value.1.body":  {
    fr: "Détecter un cyclone, une crise politique ou un incendie industriel <em>avant</em> le client.",
    en: "Detect a cyclone, political crisis or industrial fire <em>before</em> the client does.",
    pt: "Detetar um ciclone, uma crise política ou um incêndio industrial <em>antes</em> do cliente.",
  },
  "value.2.title": { fr: "Conformité réglementaire", en: "Regulatory compliance", pt: "Conformidade regulatória" },
  "value.2.body":  {
    fr: "Veille en continu sur la CIMA, NAICOM, ACAPS, IRA, NIC pour les 26 filiales.",
    en: "Continuous monitoring of CIMA, NAICOM, ACAPS, IRA, NIC for the 26 subsidiaries.",
    pt: "Monitorização contínua da CIMA, NAICOM, ACAPS, IRA, NIC para as 26 filiais.",
  },
  "value.3.title": { fr: "Asymétrie inversée", en: "Reversed asymmetry", pt: "Assimetria invertida" },
  "value.3.body":  {
    fr: "OLEA arrive en rendez-vous avec la connaissance la plus à jour du marché du client.",
    en: "OLEA arrives at meetings with the most up-to-date knowledge of the client's market.",
    pt: "A OLEA chega às reuniões com o conhecimento mais atualizado do mercado do cliente.",
  },
  "value.4.title": { fr: "Cross-selling pan-africain", en: "Pan-African cross-selling", pt: "Venda cruzada pan-africana" },
  "value.4.body":  {
    fr: "Une news critique dans un pays suggère automatiquement une extension de couverture chez les clients voisins.",
    en: "Critical news in one country automatically suggests cover extension for clients in neighbouring countries.",
    pt: "Uma notícia crítica num país sugere automaticamente uma extensão de cobertura aos clientes vizinhos.",
  },

  // ===== Footer =====
  "footer.blurb": {
    fr: "Concept-site préparé pour OLEA Insurance Solutions. Données démonstratives.",
    en: "Concept site prepared for OLEA Insurance Solutions. Demonstrative data.",
    pt: "Site conceito preparado para a OLEA Insurance Solutions. Dados demonstrativos.",
  },
  "footer.sources":  { fr: "Sources monitorées", en: "Sources monitored", pt: "Fontes monitorizadas" },
  "footer.coverage": { fr: "Couverture", en: "Coverage", pt: "Cobertura" },
  "footer.coverageBody": {
    fr: "26 filiales · 13 partenariats · 5 régions · 4 zones réglementaires. Mises à jour horaires.",
    en: "26 subsidiaries · 13 partnerships · 5 regions · 4 regulatory zones. Hourly updates.",
    pt: "26 filiais · 13 parcerias · 5 regiões · 4 zonas regulatórias. Atualizações horárias.",
  },
  "footer.copy":       { fr: "© 2026 — Proposition commerciale", en: "© 2026 — Commercial proposal", pt: "© 2026 — Proposta comercial" },
  "footer.disclaimer": { fr: "Données démonstratives · non contractuelles", en: "Demonstrative data · non-contractual", pt: "Dados demonstrativos · não contratuais" },
};

// ============================================================
// Runtime
// ============================================================
let currentLang = "fr";

function t(key, replacements) {
  const entry = STRINGS[key];
  if (!entry) return key;
  let s = entry[currentLang] || entry.fr || key;
  if (replacements) {
    for (const k in replacements) s = s.replace("{" + k + "}", replacements[k]);
  }
  return s;
}

function setLang(lang) {
  if (!I18N_LANGS.includes(lang)) lang = "fr";
  currentLang = lang;
  document.documentElement.lang = lang;
  try { localStorage.setItem("olea-intel-lang", lang); } catch {}
  applyTranslations();
  document.querySelectorAll(".lang-switcher [data-lang]").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  if (typeof window.onLangChanged === "function") window.onLangChanged();
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (el.dataset.i18nHtml === "1") el.innerHTML = t(key);
    else el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const parts = (el.dataset.i18nAttr || "").split(",");
    parts.forEach((p) => {
      const [attr, key] = p.split(":").map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

function initI18n() {
  let lang;
  try { lang = localStorage.getItem("olea-intel-lang"); } catch {}
  if (!lang) {
    const browserLang = (navigator.language || "fr").slice(0, 2).toLowerCase();
    lang = I18N_LANGS.includes(browserLang) ? browserLang : "fr";
  }
  setLang(lang);
}

// ============================================================
// Traduction à la demande (MyMemory Translation API - sans clé)
// 5000 mots/jour anonyme. Cache en session pour éviter double appel.
// ============================================================
const TRANS_CACHE = new Map();
async function translateText(text, sourceLang, targetLang) {
  if (!text || sourceLang === targetLang) return text;
  const key = `${sourceLang}|${targetLang}|${text}`;
  if (TRANS_CACHE.has(key)) return TRANS_CACHE.get(key);
  try {
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${langPair}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText || null;
    if (translated) {
      TRANS_CACHE.set(key, translated);
      return translated;
    }
  } catch (e) {
    console.warn("MyMemory translation failed:", e);
  }
  return null;
}
