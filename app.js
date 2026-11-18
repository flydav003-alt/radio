'use strict';
/* RadioDeck 網頁版 (PWA) — port of the desktop app: station search, favourites, EQ, visualiser. */
(() => {
  const $ = (id) => document.getElementById(id);
  const LS_KEY = 'radiodeck.web.v1';
  const LS_CORS = 'radiodeck.web.corsbad';

  // ---------------------------------------------------------------- data
  const COUNTRIES = [['全球', ''], ['台灣', 'TW'], ['日本', 'JP'], ['韓國', 'KR'], ['美國', 'US'],
    ['拉丁美洲', 'LATAM'], ['英國', 'GB'], ['德國', 'DE'], ['法國', 'FR'], ['加拿大', 'CA'], ['澳洲', 'AU']];
  const LATAM_CODE = 'LATAM';
  const LATAM = ['MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'CU'];
  const COUNTRY_NAMES = {
    TW: '台灣', JP: '日本', KR: '韓國', US: '美國', GB: '英國', DE: '德國', FR: '法國', CA: '加拿大', AU: '澳洲',
    HK: '香港', CN: '中國', SG: '新加坡', NL: '荷蘭', IT: '義大利', ES: '西班牙', CH: '瑞士', AT: '奧地利',
    RU: '俄羅斯', SE: '瑞典', BE: '比利時', NZ: '紐西蘭', TH: '泰國', PL: '波蘭', CZ: '捷克',
    MX: '墨西哥', BR: '巴西', AR: '阿根廷', CL: '智利', CO: '哥倫比亞', PE: '秘魯', UY: '烏拉圭', CU: '古巴',
  };
  const GENRES = [['純音樂', 'instrumental'], ['氛圍', 'ambient'], ['Lofi', 'lofi'], ['古典', 'classical'],
    ['爵士', 'jazz'], ['鋼琴', 'piano'], ['放鬆', 'chillout'], ['冥想', 'meditation'], ['電子', 'electronic'], ['不限', '']];
  const GENRE_NAMES = {};
  GENRES.forEach(([n, v]) => { if (v) GENRE_NAMES[v] = n; });
  Object.assign(GENRE_NAMES, { downtempo: 'Downtempo', lounge: 'Lounge', soundtrack: '影視原聲', mellow: 'Mellow' });
  const TALK_TAGS = new Set(['talk', 'talk radio', 'news', 'news talk', 'sports', 'sport', 'podcast', 'politics',
    'comedy', 'religion', 'christian', 'gospel', 'preaching', 'call-in', 'public radio', 'interview']);
  const SORTS = [['🔥 熱門', 'clicks'], ['👍 票數', 'votes']];
  const SORT_API = { clicks: 'clickcount', votes: 'votes' };
  const EQ_BANDS = [60, 150, 400, 1000, 2400, 6000, 12000];
  const EQ_PRESETS = {
    flat: ['關閉（原音）', [0, 0, 0, 0, 0, 0, 0]],
    bass: ['低音加強', [6, 5, 2, 0, 0, 0, 0]],
    vocal: ['人聲清晰', [-3, -2, -1, 2, 4, 3, 1]],
    bright: ['明亮高音', [-1, 0, 0, 0, 2, 4, 5]],
    night: ['夜間模式（柔和低音／高音）', [-6, -4, -1, 0, -1, -3, -5]],
  };
  const THEMES = { obsidian: '黑曜鎏金', tokyo: '東京夜雨', rose: '玫瑰松林', torii: '京都鳥居', rosewater: '玫瑰（淺色）' };
  const VIZ_STYLES = [['長條', 'bars'], ['鏡像', 'mirror'], ['波形', 'wave'], ['圓環', 'circle'], ['關閉', 'off']];
  const AMBIENT = { off: 0, soft: 0.55, strong: 1 };
  const NOTE_DEFAULT = '已自動排除新聞、談話類電台。網頁版只顯示 https 電台；電台有沒有人說話由電台自己決定，播到主持人就換下一台。';

  const soma = (slug, name, tags) => ({
    name: `SomaFM ${name}`, cc: 'US', tags, bitrate: 128, curated: true, urls: [`https://ice.somafm.com/${slug}`],
  });
  const CURATED = [
    soma('groovesalad', 'Groove Salad', ['ambient', 'downtempo', 'chillout']),
    soma('dronezone', 'Drone Zone', ['ambient', 'meditation']),
    soma('deepspaceone', 'Deep Space One', ['ambient', 'meditation']),
    soma('spacestation', 'Space Station', ['electronic', 'ambient']),
    soma('lush', 'Lush', ['chillout', 'downtempo']),
    soma('fluid', 'Fluid', ['instrumental', 'chillout']),
    soma('sonicuniverse', 'Sonic Universe', ['jazz', 'instrumental']),
    soma('secretagent', 'Secret Agent', ['lounge', 'soundtrack', 'chillout']),
    soma('illstreet', 'Illinois Street Lounge', ['jazz', 'lounge']),
    soma('n5md', 'n5MD', ['ambient', 'electronic']),
    soma('synphaera', 'Synphaera', ['ambient', 'electronic']),
    { name: 'Radio Swiss Classic', cc: 'CH', tags: ['classical', 'instrumental'], bitrate: 128, curated: true, urls: ['https://stream.srg-ssr.ch/m/rsc_de/mp3_128'] },
    { name: 'Radio Swiss Jazz', cc: 'CH', tags: ['jazz', 'instrumental'], bitrate: 128, curated: true, urls: ['https://stream.srg-ssr.ch/m/rsj/mp3_128'] },
    { name: 'FIP Jazz', cc: 'FR', tags: ['jazz'], bitrate: 128, curated: true, urls: ['https://icecast.radiofrance.fr/fipjazz-midfi.mp3'] },
    { name: 'FIP Groove', cc: 'FR', tags: ['chillout', 'electronic'], bitrate: 128, curated: true, urls: ['https://icecast.radiofrance.fr/fipgroove-midfi.mp3'] },
    { name: 'Radio Paradise Mellow Mix', cc: 'US', tags: ['chillout', 'mellow'], bitrate: 128, curated: true, urls: ['https://stream.radioparadise.com/mellow-128'] },
  ];

  // ---------------------------------------------------------------- settings
  const DEFAULTS = {
    theme: 'tokyo', volume: 85, country: '', genre: 'ambient', view: 'all', sort: 'clicks',
    eq: 'flat', eqCustom: [0, 0, 0, 0, 0, 0, 0], viz: 'bars', ambient: 'soft', glow: 60,
    enhanced: true, coverColor: true, favorites: [],
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function loadSettings() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { d = {}; }
    const s = { ...DEFAULTS, ...d };
    if (!THEMES[s.theme]) s.theme = DEFAULTS.theme;
    s.volume = Number.isFinite(+s.volume) ? clamp(Math.round(+s.volume), 0, 200) : DEFAULTS.volume;
    if (!['all', 'fav'].includes(s.view)) s.view = 'all';
    if (!SORT_API[s.sort]) s.sort = 'clicks';
    if (typeof s.country !== 'string') s.country = '';
    if (typeof s.genre !== 'string') s.genre = 'ambient';
    if (s.eq !== 'custom' && !EQ_PRESETS[s.eq]) s.eq = 'flat';
    if (!Array.isArray(s.eqCustom)) s.eqCustom = [0, 0, 0, 0, 0, 0, 0];
    s.eqCustom = [...s.eqCustom, 0, 0, 0, 0, 0, 0, 0].slice(0, 7).map((v) => clamp(Math.round(+v) || 0, -12, 12));
    if (!VIZ_STYLES.some(([, v]) => v === s.viz)) s.viz = 'bars';
    if (!(s.ambient in AMBIENT)) s.ambient = 'soft';
    s.glow = clamp(Math.round(+s.glow) || 0, 0, 100);
    s.enhanced = !!s.enhanced; s.coverColor = !!s.coverColor;
    s.favorites = (Array.isArray(s.favorites) ? s.favorites : []).filter((f) => f && Array.isArray(f.urls) && f.urls.length);
    return s;
  }
  let S = loadSettings();
  let saveTimer = null;
  const saveNow = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } };
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); };

  let corsBad = new Set();
  try { corsBad = new Set(JSON.parse(localStorage.getItem(LS_CORS) || '[]')); } catch (e) { /* ignore */ }
  const markCorsBad = (url) => {
    corsBad.add(originOf(url));
    try { localStorage.setItem(LS_CORS, JSON.stringify([...corsBad].slice(-300))); } catch (e) { /* ignore */ }
  };
  function originOf(url) { try { return new URL(url).origin; } catch (e) { return url; } }

  // ---------------------------------------------------------------- Radio Browser API
  let rbServers = null;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  async function fetchT(url, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try { return await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } }); } finally { clearTimeout(t); }
  }
  async function servers() {
    if (rbServers) return rbServers;
    let names = [];
    try {
      const r = await fetchT('https://all.api.radio-browser.info/json/servers', 6000);
      const d = await r.json();
      names = d.map((x) => x && x.name).filter(Boolean).map((n) => `https://${n}`);
    } catch (e) { /* use the fallback list */ }
    shuffle(names);
    const fb = ['https://de1.api.radio-browser.info', 'https://de2.api.radio-browser.info', 'https://fi1.api.radio-browser.info',
      'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info'];
    rbServers = [...new Set([...names, ...fb])];
    return rbServers;
  }
  async function radioSearch(params, limit = 150) {
    const q = new URLSearchParams({ hidebroken: 'true', order: 'clickcount', reverse: 'true', limit: String(limit), is_https: 'true', ...params });
    let last = null;
    for (const base of (await servers()).slice(0, 4)) {
      try {
        const r = await fetchT(`${base}/json/stations/search?${q}`, 10000);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        return Array.isArray(d) ? d.filter((s) => s && typeof s === 'object') : [];
      } catch (e) { last = e; }
    }
    throw new Error(`連不上電台資料庫（${last && last.message || last}）`);
  }
  const num = (v) => Math.max(0, parseInt(v, 10) || 0);
  function stationFromRb(s) {
    const url = String(s.url_resolved || s.url || '').trim();
    if (!/^https:\/\//i.test(url)) return null; // http streams are blocked on an https page (mixed content)
    const fav = String(s.favicon || '').trim();
    return {
      name: String(s.name || '').trim() || '（未命名電台）', urls: [url], cc: String(s.countrycode || '').toUpperCase(),
      tags: String(s.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 6),
      bitrate: num(s.bitrate), codec: String(s.codec || '').toUpperCase(),
      favicon: /^https:\/\//i.test(fav) ? fav : '', clicks: num(s.clickcount), votes: num(s.votes),
    };
  }
  const normName = (n) => n.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  async function searchMany(base, codes, sort) {
    const res = await Promise.allSettled(codes.map((c) => radioSearch({ ...base, countrycode: c }, 60)));
    const ok = res.filter((r) => r.status === 'fulfilled');
    if (!ok.length) throw res[0].reason;
    const field = SORT_API[sort] || 'clickcount';
    return ok.flatMap((r) => r.value).sort((a, b) => num(b[field]) - num(a[field]));
  }
  async function radioQuery(text, cc, tag, sort) {
    const params = { order: SORT_API[sort] || 'clickcount' };
    if (text) params.name = text; else if (tag) params.tag = tag;
    let rows;
    if (cc === LATAM_CODE) rows = await searchMany(params, LATAM, sort);
    else { if (cc) params.countrycode = cc; rows = await radioSearch(params); }
    const seen = new Set(); const out = [];
    for (const raw of rows) {
      const st = stationFromRb(raw);
      if (!st) continue;
      if (!text && st.tags.some((t) => TALK_TAGS.has(t))) continue;
      const key = normName(st.name);
      if (seen.has(key)) continue;
      seen.add(key); out.push(st);
      if (out.length >= 60) break;
    }
    return out;
  }
  function curatedMatches(text, cc, tag) {
    text = text.trim().toLowerCase();
    const inRegion = (s) => !cc || (cc === LATAM_CODE ? LATAM.includes(s.cc) : s.cc === cc);
    return CURATED.filter((s) => (text ? s.name.toLowerCase().includes(text) && inRegion(s) : inRegion(s) && (!tag || s.tags.includes(tag))));
  }
  async function loadStations(text, cc, tag, sort) {
    const curated = curatedMatches(text, cc, tag).map((s) => ({ ...s }));
    let online = []; let err = '';
    try { online = await radioQuery(text, cc, tag, sort); } catch (e) { err = e.message || String(e); }
    const byName = new Map(online.map((s) => [normName(s.name), s]));
    curated.forEach((s) => { const m = byName.get(normName(s.name)); if (m) { s.clicks = m.clicks; s.votes = m.votes; } });
    const seen = new Set(curated.map((s) => normName(s.name)));
    const merged = [...curated, ...online.filter((s) => !seen.has(normName(s.name)))];
    const f = sort === 'clicks' ? 'clicks' : 'votes';
    merged.sort((a, b) => (b[f] ?? -1) - (a[f] ?? -1));
    return { stations: merged, err: merged.length ? '' : err };
  }

  // ---------------------------------------------------------------- list UI
  const listEl = $('list'); const emptyEl = $('empty'); const noteEl = $('note');
  let items = []; let selKey = null; let reorderable = false; let listToken = 0;
  const keyOf = (st) => st.urls[0];
  const favKeys = () => new Set(S.favorites.map((f) => f.urls[0]));
  const isPlayingKey = (k) => !!P.station && keyOf(P.station) === k;
  const stationSub = (st, tagsShown = 2) => {
    const parts = [];
    if (st.cc) parts.push(COUNTRY_NAMES[st.cc] || st.cc);
    (st.tags || []).map((t) => GENRE_NAMES[t] || t).slice(0, tagsShown).forEach((t) => parts.push(t));
    if (st.bitrate) parts.push(`${st.bitrate}k`);
    return parts.join(' · ');
  };
  function heatText(st) {
    if (S.view === 'fav') return '';
    const key = S.sort === 'clicks' ? 'clicks' : 'votes';
    const n = st[key];
    if (n == null) return '—';
    const t = n < 1000 ? String(n) : `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${key === 'clicks' ? '🔥' : '👍'} ${t}`;
  }
  function setNote(text, warn = false) {
    noteEl.textContent = text || NOTE_DEFAULT;
    noteEl.classList.toggle('warn', !!warn);
  }
  function renderList(stations, message, canReorder) {
    items = stations.filter((s) => s.urls && s.urls.length);
    reorderable = !!canReorder;
    const favs = favKeys();
    const frag = document.createDocumentFragment();
    const width = Math.max(2, String(items.length).length);
    items.forEach((st, i) => {
      const k = keyOf(st);
      const li = document.createElement('li');
      li.className = 'row' + (k === selKey ? ' sel' : '') + (isPlayingKey(k) ? ' playing' : '');
      li.dataset.i = String(i);
      const n = document.createElement('div'); n.className = 'num'; n.textContent = isPlayingKey(k) ? '♪' : String(i + 1).padStart(width, '0');
      const star = document.createElement('button'); star.className = 'star' + (favs.has(k) ? ' on' : ''); star.dataset.act = 'fav';
      star.textContent = favs.has(k) ? '★' : '☆'; star.setAttribute('aria-label', '最愛');
      const name = document.createElement('div'); name.className = 'name ell';
      const b = document.createElement('b'); b.className = 'ell'; b.textContent = st.name;
      const sm = document.createElement('small'); sm.className = 'ell'; sm.textContent = stationSub(st, 1);
      name.append(b, sm);
      const tail = document.createElement('div'); tail.className = 'tail';
      const heat = heatText(st);
      if (heat) tail.append(document.createTextNode(heat));
      if (reorderable) {
        const up = document.createElement('button'); up.className = 'mv'; up.dataset.act = 'up'; up.textContent = '▲'; up.setAttribute('aria-label', '上移');
        const dn = document.createElement('button'); dn.className = 'mv'; dn.dataset.act = 'down'; dn.textContent = '▼'; dn.setAttribute('aria-label', '下移');
        tail.append(up, dn);
      }
      li.append(n, star, name, tail);
      frag.append(li);
    });
    listEl.replaceChildren(frag);
    emptyEl.textContent = message || '';
    emptyEl.hidden = items.length > 0;
    if (items.length && !items.some((s) => keyOf(s) === selKey)) selKey = keyOf(items[0]);
    markRows();
    updateSelectionUi();
  }
  function markRows() {
    const favs = favKeys();
    const width = Math.max(2, String(items.length).length);
    listEl.querySelectorAll('.row').forEach((li) => {
      const st = items[+li.dataset.i]; if (!st) return;
      const k = keyOf(st);
      li.classList.toggle('sel', k === selKey);
      li.classList.toggle('playing', isPlayingKey(k));
      li.querySelector('.num').textContent = isPlayingKey(k) ? '♪' : String(+li.dataset.i + 1).padStart(width, '0');
      const star = li.querySelector('.star'); star.classList.toggle('on', favs.has(k)); star.textContent = favs.has(k) ? '★' : '☆';
    });
  }
  const selectedStation = () => items.find((s) => keyOf(s) === selKey) || null;
  function updateSelectionUi() {
    const st = selectedStation();
    const faved = !!st && favKeys().has(keyOf(st));
    $('favBtn').innerHTML = faved ? '★<span class="lbl"> 移出最愛</span>' : '★<span class="lbl"> 加入最愛</span>';
    $('favBtn').disabled = !st; $('playBtn').disabled = !st && !P.station; $('randBtn').disabled = !items.length;
  }
  async function reload() {
    const token = ++listToken;
    const text = $('search').value.trim();
    if (S.view === 'fav') {
      let favs = S.favorites.filter((f) => f.urls && f.urls.length);
      if (text) favs = favs.filter((f) => String(f.name || '').toLowerCase().includes(text.toLowerCase()));
      renderList(favs, text ? '沒有符合的最愛電台。' : '還沒有最愛的電台。\n\n在「電台」清單按一下列表左邊的 ☆，或用右上角「新增電台網址」加入。', !text);
      return;
    }
    items = []; listEl.replaceChildren(); emptyEl.hidden = false; emptyEl.textContent = '搜尋電台中…';
    const { stations, err } = await loadStations(text, S.country, text ? '' : S.genre, S.sort);
    if (token !== listToken || S.view === 'fav') return;
    const msg = err ? `${err}\n\n請檢查網路後，再按一次上方的類型或國家。`
      : '這個國家／類型沒有找到電台。\n\n試試「全球」、換一個類型，或直接輸入電台名稱搜尋。';
    renderList(stations, msg, false);
  }
  function toggleFav(st) {
    if (!st) return;
    const k = keyOf(st);
    if (favKeys().has(k)) S.favorites = S.favorites.filter((f) => f.urls[0] !== k);
    else {
      const f = {}; ['name', 'urls', 'cc', 'tags', 'bitrate', 'custom', 'favicon'].forEach((p) => { if (p in st) f[p] = st[p]; });
      S.favorites.push(f);
    }
    saveNow();
    if (S.view === 'fav') reload(); else { markRows(); updateSelectionUi(); }
  }
  function moveFav(i, d) {
    const j = i + d;
    if (!reorderable || j < 0 || j >= items.length) return;
    const keys = items.map(keyOf);
    [keys[i], keys[j]] = [keys[j], keys[i]];
    const byKey = new Map(S.favorites.map((f) => [f.urls[0], f]));
    const moved = keys.map((k) => byKey.get(k)).filter(Boolean);
    const rest = S.favorites.filter((f) => !keys.includes(f.urls[0]));
    S.favorites = [...moved, ...rest]; saveNow();
    selKey = keys[j];
    renderList(moved, '', true);
  }
  listEl.addEventListener('click', (e) => {
    const li = e.target.closest('.row'); if (!li) return;
    const i = +li.dataset.i; const st = items[i]; if (!st) return;
    const act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      if (act.dataset.act === 'fav') toggleFav(st);
      else if (act.dataset.act === 'up') moveFav(i, -1);
      else if (act.dataset.act === 'down') moveFav(i, 1);
      return;
    }
    selKey = keyOf(st); markRows(); updateSelectionUi();
    playStation(st);
  });

  // ---------------------------------------------------------------- toolbar
  function buildToolbar() {
    const cs = $('country'); const ss = $('sort'); const chips = $('chips');
    COUNTRIES.forEach(([label, code]) => { const o = new Option(code ? `📍 ${label}` : `🌐 ${label}`, code); cs.add(o); });
    cs.value = S.country;
    SORTS.forEach(([label, v]) => ss.add(new Option(label, v)));
    ss.value = S.sort;
    GENRES.forEach(([label, v]) => {
      const b = document.createElement('button'); b.className = 'chip'; b.textContent = label; b.dataset.v = v; chips.append(b);
    });
    syncToolbar();
    cs.addEventListener('change', () => { S.country = cs.value; saveNow(); reload(); });
    ss.addEventListener('change', () => { S.sort = ss.value; saveNow(); reload(); });
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b || b.disabled) return;
      S.genre = b.dataset.v; $('search').value = ''; saveNow(); syncToolbar(); reload();
    });
    $('segAll').addEventListener('click', () => setView('all'));
    $('segFav').addEventListener('click', () => setView('fav'));
    $('rankBtn').addEventListener('click', () => {
      S.view = 'all'; S.sort = 'clicks'; S.genre = ''; $('search').value = ''; saveNow(); syncToolbar(); reload();
    });
    $('search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('search').blur(); reload(); } });
    let t = null;
    $('search').addEventListener('input', () => { if (S.view === 'fav') { clearTimeout(t); t = setTimeout(reload, 150); } });
  }
  function setView(v) { S.view = v; saveNow(); syncToolbar(); reload(); }
  function syncToolbar() {
    const fav = S.view === 'fav';
    $('segAll').classList.toggle('on', !fav); $('segFav').classList.toggle('on', fav);
    $('sort').value = S.sort; $('country').value = S.country;
    document.querySelectorAll('.chip').forEach((c) => { c.classList.toggle('on', c.dataset.v === S.genre); c.disabled = fav; });
    $('country').disabled = fav; $('sort').disabled = fav;
    $('search').placeholder = fav ? '🔍 在最愛裡篩選…' : '🔍 輸入電台名稱，按 Enter 搜尋…';
  }

  // ---------------------------------------------------------------- playback
  const P = {
    audio: null, hls: null, ctx: null, src: null, eq: [], gain: null, analyser: null,
    station: null, last: null, token: 0, retries: 0, startedAt: 0, timer: null, freq: null,
  };
  const ensureCtx = () => {
    if (!P.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) P.ctx = new C(); }
    return P.ctx;
  };
  function eqGains() { return S.eq === 'custom' ? S.eqCustom : (EQ_PRESETS[S.eq] || EQ_PRESETS.flat)[1]; }
  function applyEq() { const g = eqGains(); P.eq.forEach((n, i) => { n.gain.value = g[i] || 0; }); }
  function applyVolume() {
    const v = S.volume / 100;
    if (P.gain) { P.gain.gain.value = v; if (P.audio) P.audio.volume = 1; } else if (P.audio) P.audio.volume = Math.min(1, v);
  }
  function buildGraph(a) {
    const ctx = ensureCtx(); if (!ctx) return false;
    const src = ctx.createMediaElementSource(a);
    const eq = EQ_BANDS.map((f, i) => {
      const n = ctx.createBiquadFilter();
      n.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
      n.frequency.value = f; n.Q.value = 1.1; return n;
    });
    const an = ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0.5;
    const g = ctx.createGain();
    let node = src; eq.forEach((n) => { node.connect(n); node = n; });
    node.connect(an); an.connect(g); g.connect(ctx.destination);
    P.src = src; P.eq = eq; P.analyser = an; P.gain = g; P.freq = new Float32Array(an.frequencyBinCount);
    applyEq(); applyVolume();
    return true;
  }
  function teardown() {
    if (P.hls) { try { P.hls.destroy(); } catch (e) { /* ignore */ } P.hls = null; }
    if (P.audio) {
      const a = P.audio; P.audio = null;
      a.onplaying = a.onerror = a.onwaiting = a.onstalled = a.onended = null;
      try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) { /* ignore */ }
    }
    [P.src, P.gain, P.analyser].forEach((n) => { try { n && n.disconnect(); } catch (e) { /* ignore */ } });
    P.eq.forEach((n) => { try { n.disconnect(); } catch (e) { /* ignore */ } });
    P.src = P.gain = P.analyser = P.freq = null; P.eq = [];
  }
  let hlsLoading = null;
  function loadHls() {
    if (window.Hls) return Promise.resolve();
    if (!hlsLoading) {
      hlsLoading = new Promise((res, rej) => {
        const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
        s.onload = res; s.onerror = () => { hlsLoading = null; rej(new Error('hls.js load failed')); };
        document.head.append(s);
      });
    }
    return hlsLoading;
  }
  async function resolvePlaylist(url) {
    if (!/\.(pls|m3u|asx)(\?|$)/i.test(url)) return [url];
    try {
      const r = await fetchT(url, 8000);
      const text = (await r.text()).slice(0, 65536);
      const found = (text.match(/https:\/\/[^\s"'<>]+/g) || []).slice(0, 3);
      return found.length ? found : [url];
    } catch (e) { return [url]; }
  }
  function setNow(title, sub) {
    $('cardTitle').textContent = title; $('cardSub').textContent = sub; $('cardSub').title = sub;
    document.title = P.station ? `${title} — RadioDeck` : 'RadioDeck 網路電台';
    $('vfTitle').textContent = title; $('vfSub').textContent = sub;
  }
  const IDLE_SUB = '選一個電台，按「播放」或直接點一下';

  async function playStation(st, opts = {}) {
    const token = ++P.token;
    if (S.enhanced) { const c = ensureCtx(); if (c && c.state === 'suspended') c.resume().catch(() => {}); } // inside the user gesture
    teardown();
    P.station = st; P.last = st; P.retries = opts.retries || 0;
    markRows(); updateSelectionUi();
    setNow(st.name, opts.retries ? `連線中斷，重新連線中…（${opts.retries}）` : '連線中…');
    setNote(opts.retries ? '' : '連線中…（網路串流第一次可能需要幾秒）');
    let urls = [];
    for (const u of st.urls) urls.push(...await resolvePlaylist(u));
    if (token !== P.token) return;
    urls = urls.filter((u) => /^https:\/\//i.test(u));
    if (!urls.length) return fail(token, '這個電台沒有 https 網址，網頁版無法播放');
    openUrl(urls, 0, token, st, false);
  }
  function fail(token, msg) {
    if (token !== P.token) return;
    teardown(); P.station = null; stopTimer(); markRows(); updateSelectionUi();
    setNow('尚未播放', IDLE_SUB); setNote(`⚠ ${msg}`, true);
    document.documentElement.style.setProperty('--amb', '0');
  }
  function openUrl(urls, i, token, st, plain) {
    if (token !== P.token) return;
    if (i >= urls.length) return fail(token, '無法連線這個電台，請換一台試試');
    const url = urls[i];
    const isHls = /\.m3u8(\?|$)/i.test(url);
    const a = new Audio(); a.preload = 'auto';
    const native = isHls && !!a.canPlayType('application/vnd.apple.mpegurl');
    const wantEnh = S.enhanced && !plain && !native && !corsBad.has(originOf(url)) && !!(window.AudioContext || window.webkitAudioContext);
    let started = false;
    P.audio = a;
    a.onplaying = () => {
      if (token !== P.token) return;
      if (!started) { started = true; P.retries = 0; onPlaying(st, !!P.analyser); }
      setStatus('');
    };
    a.onwaiting = () => { if (token === P.token && started) setStatus('緩衝中…'); };
    a.onstalled = a.onwaiting;
    a.onerror = () => {
      if (token !== P.token) return;
      if (!started) {
        if (wantEnh && !isHls) { markCorsBad(url); teardown(); openUrl(urls, i, token, st, true); return; } // this station has no CORS: play without EQ/visualiser
        teardown(); openUrl(urls, i + 1, token, st, false); return;
      }
      reconnect(st, token);
    };
    a.onended = a.onerror;
    const kick = () => a.play().catch((err) => {
      if (token !== P.token) return;
      if (err && err.name === 'NotAllowedError') fail(token, '瀏覽器擋住自動播放，請再按一次播放');
    });
    if (isHls && !native) {
      loadHls().then(() => {
        if (token !== P.token) return;
        if (!window.Hls || !window.Hls.isSupported()) { a.onerror(); return; }
        const h = new window.Hls({ lowLatencyMode: false }); P.hls = h;
        h.on(window.Hls.Events.ERROR, (_e, d) => { if (d && d.fatal) a.onerror(); });
        if (wantEnh) buildGraph(a);
        h.loadSource(url); h.attachMedia(a); kick();
      }).catch(() => a.onerror());
      applyVolume(); return;
    }
    if (wantEnh) { a.crossOrigin = 'anonymous'; buildGraph(a); }
    a.src = url; applyVolume(); kick();
  }
  function reconnect(st, token) {
    if (token !== P.token) return;
    if (P.retries >= 8) { fail(token, '電台連線中斷，請再按一次播放或換一台'); return; }
    const n = ++P.retries;
    teardown(); setStatus(`連線中斷，重新連線中…（${n}）`);
    setTimeout(() => { if (token === P.token) playStation(st, { retries: n }); }, Math.min(500 * 2 ** n, 8000));
  }
  function onPlaying(st, enhanced) {
    P.startedAt = Date.now();
    setNow(st.name, stationSub(st));
    setNote(enhanced ? '' : (S.enhanced ? '這個電台不開放頻譜／EQ 功能，已改用一般播放。' : ''));
    $('vizHint').textContent = enhanced ? '' : '此電台不支援頻譜與 EQ';
    markRows(); updateSelectionUi(); startTimer(); setMediaSession(st); fetchCover(st.favicon);
  }
  function setStatus(text) { if (P.station) $('cardSub').textContent = text || stationSub(P.station); }
  function stopStation(keep) {
    P.token++; teardown(); stopTimer();
    if (!keep) P.last = null;
    P.station = null; markRows(); updateSelectionUi();
    setNow('尚未播放', IDLE_SUB); setNote(''); $('vizHint').textContent = ''; $('timeLabel').textContent = '';
    applyCover(null);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
  }
  function startTimer() {
    stopTimer();
    P.timer = setInterval(() => {
      const s = Math.floor((Date.now() - P.startedAt) / 1000);
      const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
      const clock = h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      $('timeLabel').textContent = `● LIVE  ${clock}`; $('vfTime').textContent = `● LIVE  ${clock}`;
    }, 1000);
  }
  function stopTimer() { clearInterval(P.timer); P.timer = null; $('vfTime').textContent = ''; }
  function setMediaSession(st) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: st.name, artist: stationSub(st) || 'RadioDeck', album: 'RadioDeck',
        artwork: st.favicon ? [{ src: st.favicon, sizes: '256x256' }] : [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('pause', () => stopStation(true));
      navigator.mediaSession.setActionHandler('stop', () => stopStation(false));
      navigator.mediaSession.setActionHandler('play', () => { if (P.last) playStation(P.last); });
      navigator.mediaSession.setActionHandler('nexttrack', () => randomStation());
    } catch (e) { /* unsupported action */ }
  }
  function randomStation() {
    if (!items.length) return;
    const st = items[Math.floor(Math.random() * items.length)];
    selKey = keyOf(st); markRows(); updateSelectionUi(); playStation(st);
  }

  // logo colour -> visualiser tint (only works when the logo host allows CORS; otherwise stays on the theme colour)
  let coverToken = 0; let tintHue = null;
  function fetchCover(url) {
    const token = ++coverToken;
    if (!url || !S.coverColor) { applyCover(null); return; }
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { if (token === coverToken) applyCover(dominantHue(img)); };
    img.onerror = () => { if (token === coverToken) applyCover(null); };
    img.src = url;
  }
  function applyCover(h) { tintHue = h; }
  function dominantHue(img) {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 32;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, 32, 32);
      const d = x.getImageData(0, 0, 32, 32).data; const px = [];
      for (let k = 0; k < d.length; k += 4) px.push(rgbToHsl(d[k], d[k + 1], d[k + 2]));
      for (const [sMin, lMin, lMax] of [[0.22, 0.12, 0.92], [0.10, 0.06, 0.96]]) {
        const bins = new Array(24).fill(0); let any = false;
        for (const [h, s, l] of px) {
          if (l < lMin || l > lMax || s < sMin) continue;
          bins[Math.floor(h * 24) % 24] += s * (1 - Math.abs(l - 0.5) * 1.2); any = true;
        }
        if (any) return (bins.indexOf(Math.max(...bins)) + 0.5) / 24;
      }
    } catch (e) { /* tainted canvas */ }
    return null;
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn; const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
  }
  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    return rgbToHsl((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }

  // ---------------------------------------------------------------- visualiser
  class Viz {
    constructor(canvas, bars, big) {
      this.c = canvas; this.x = canvas.getContext('2d'); this.n = bars; this.big = big;
      this.vals = new Float32Array(bars); this.peaks = new Float32Array(bars);
      this.bass = 0; this.pulse = 0; this.avg = 0; this.bands = null; this.bandKey = '';
      this.tilt = Array.from({ length: bars }, (_, i) => 15 * i / Math.max(1, bars - 1));
      this.w = 0; this.h = 0; this.dpr = 1; this.live = false;
    }
    setBands(sr, bins) {
      const key = `${sr}/${bins}`; if (key === this.bandKey) return;
      this.bandKey = key; const nyq = sr / 2; const edges = [];
      for (let i = 0; i <= this.n; i++) edges.push(45 * Math.pow(15000 / 45, i / this.n));
      this.bands = [];
      for (let i = 0; i < this.n; i++) {
        const lo = Math.min(bins - 1, Math.floor(edges[i] / nyq * bins));
        this.bands.push([lo, Math.max(Math.min(bins, Math.floor(edges[i + 1] / nyq * bins)), lo + 1)]);
      }
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = this.c.clientWidth; const h = this.c.clientHeight;
      if (!w || !h) return false;
      if (w !== this.w || h !== this.h || dpr !== this.dpr) {
        this.w = w; this.h = h; this.dpr = dpr; this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
        this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return true;
    }
    feed(freq, sr) {
      const n = this.n; let norm = null;
      if (freq) {
        this.setBands(sr, freq.length);
        norm = new Float32Array(n); let loud = 0;
        for (let i = 0; i < n; i++) {
          const [lo, hi] = this.bands[i]; let m = -140;
          for (let k = lo; k < hi; k++) if (freq[k] > m) m = freq[k];
          const v = clamp((m + this.tilt[i] + 72) / 62, 0, 1); norm[i] = v; if (v > 0) loud = 1;
        }
        if (!loud) norm = null;
        else { // light smoothing like the desktop version
          const sm = new Float32Array(n);
          for (let i = 0; i < n; i++) sm[i] = 0.2 * norm[Math.max(0, i - 1)] + 0.6 * norm[i] + 0.2 * norm[Math.min(n - 1, i + 1)];
          norm = sm;
        }
      }
      this.live = !!norm;
      const v = this.vals;
      for (let i = 0; i < n; i++) {
        const t = norm ? norm[i] : 0;
        v[i] = t > v[i] ? v[i] + (t - v[i]) * 0.6 : v[i] + (t - v[i]) * 0.14;
        if (v[i] < 0.004) v[i] = 0;
        this.peaks[i] = Math.max(this.peaks[i] - 0.014, v[i]);
      }
      const k = Math.max(3, Math.floor(n / 8)); let bass = 0;
      if (norm) { for (let i = 0; i < k; i++) bass += norm[i]; bass /= k; }
      this.avg = this.avg * 0.96 + bass * 0.04;
      const kick = Math.max(0, bass - this.avg * 1.08);
      this.pulse = Math.max(this.pulse * 0.86, Math.min(1, kick * 3.4));
      this.bass += (bass - this.bass) * 0.35; if (this.bass < 0.004) this.bass = 0;
    }
    get idle() { return !this.live && this.bass === 0 && this.pulse < 0.01 && !this.vals.some((x) => x > 0); }
    col(which, frac, a, phase) {
      const pal = window.RDTheme.pal;
      let [h, s, l] = hexToHsl(which === 2 ? pal.ACC_LO : pal.FOCUS_HI);
      if (tintHue != null && S.coverColor) { h = tintHue; s = Math.max(s * 0.8, 0.6); }
      h = (h + 0.10 * Math.sin(phase * 2 * Math.PI) + (frac - 0.5) * 0.09 + 1) % 1;
      return `hsla(${Math.round(h * 360)},${Math.round(s * 100)}%,${Math.round(l * 100)}%,${a})`;
    }
    draw(phase) {
      if (!this.resize()) return;
      const x = this.x; const w = this.w; const h = this.h; x.clearRect(0, 0, w, h);
      const style = S.viz === 'off' ? 'bars' : S.viz;
      const pad = this.big ? 24 : 12;
      const area = { l: pad, t: pad * 0.7, w: w - pad * 2, h: h - pad * 1.4 };
      const glow = (S.glow / 100) * (this.bass * 0.5 + this.pulse * 0.75);
      const glowAt = (cx, cy, r) => {
        if (glow < 0.02 || r <= 1) return;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, this.col(1, 0.5, Math.min(0.85, glow), phase)); g.addColorStop(1, this.col(1, 0.5, 0, phase));
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fill();
      };
      if (style === 'circle') this.circle(x, w, h, phase, glowAt);
      else {
        glowAt(w / 2, h, Math.max(w, h) * 0.62);
        if (style === 'wave') this.wave(x, area, phase); else this.bars(x, area, style === 'mirror', phase);
      }
    }
    bars(x, a, mirror, phase) {
      const n = this.n; const gap = this.big ? 4 : 3; const bw = Math.max(2, (a.w - gap * (n - 1)) / n);
      for (let i = 0; i < n; i++) {
        const f = i / Math.max(1, n - 1); const px = a.l + i * (bw + gap); const v = this.vals[i];
        const rr = Math.min(bw / 2, 3);
        if (mirror) {
          const bh = Math.max(2, v * a.h / 2); const top = a.t + a.h / 2 - bh;
          const g = x.createLinearGradient(0, top, 0, top + bh * 2);
          g.addColorStop(0, this.col(1, f, v > 0 ? 0.9 : 0.27, phase)); g.addColorStop(0.5, this.col(2, f, v > 0 ? 0.47 : 0.15, phase)); g.addColorStop(1, this.col(1, f, v > 0 ? 0.9 : 0.27, phase));
          x.fillStyle = g; rect(x, px, top, bw, bh * 2, bw / 2);
        } else {
          const bh = Math.max(3, v * a.h); const top = a.t + a.h - bh;
          const g = x.createLinearGradient(0, top, 0, a.t + a.h);
          g.addColorStop(0, this.col(1, f, v > 0 ? 1 : 0.3, phase)); g.addColorStop(1, this.col(2, f, v > 0 ? 1 : 0.3, phase));
          x.fillStyle = g; rect(x, px, top, bw, bh, rr);
          if (this.peaks[i] > 0.06) { x.fillStyle = this.col(1, f, 0.65, phase); rect(x, px, a.t + a.h - this.peaks[i] * a.h - 4, bw, 2.2, 1); }
        }
      }
    }
    wave(x, a, phase) {
      const n = this.n; const pts = [];
      for (let i = 0; i < n; i++) pts.push([a.l + a.w * i / (n - 1), a.t + a.h - Math.max(0.03, this.vals[i]) * a.h]);
      const curve = (move) => { x.beginPath(); move(); for (let i = 0; i < n - 1; i++) { const p = pts[i]; const q = pts[i + 1]; x.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } x.lineTo(pts[n - 1][0], pts[n - 1][1]); };
      curve(() => { x.moveTo(a.l, a.t + a.h); x.lineTo(pts[0][0], pts[0][1]); });
      x.lineTo(a.l + a.w, a.t + a.h); x.closePath();
      const g = x.createLinearGradient(0, a.t, 0, a.t + a.h);
      g.addColorStop(0, this.col(1, 0.5, 0.75, phase)); g.addColorStop(1, this.col(2, 0.5, 0.1, phase));
      x.fillStyle = g; x.fill();
      curve(() => x.moveTo(pts[0][0], pts[0][1]));
      const lg = x.createLinearGradient(a.l, 0, a.l + a.w, 0);
      [0, 0.25, 0.5, 0.75, 1].forEach((s) => lg.addColorStop(s, this.col(1, s, 1, phase)));
      x.strokeStyle = lg; x.lineWidth = this.big ? 2 : 1.8; x.stroke();
    }
    circle(x, w, h, phase, glowAt) {
      const cx = w / 2; const cy = h / 2; const radius = Math.min(w, h) / 2 - (this.big ? 14 : 8);
      const r0 = radius * (0.40 + 0.035 * this.bass + 0.07 * this.pulse); const span = radius - r0 - 3;
      glowAt(cx, cy, radius * 1.25);
      const n = this.n; const n2 = n * 2; const bw = Math.max(2, 2 * Math.PI * r0 / n2 * 0.55);
      x.lineCap = 'round'; x.lineWidth = bw;
      for (let k = 0; k < n2; k++) {
        const idx = k < n ? k : n2 - 1 - k; const v = this.vals[idx];
        const ang = Math.PI / 2 + (k + 0.5) * 2 * Math.PI / n2; const ca = Math.cos(ang); const sa = Math.sin(ang);
        const ln = 3 + v * span;
        x.strokeStyle = this.col(1, idx / Math.max(1, n - 1), (110 + 145 * Math.min(1, v * 1.4)) / 255, phase);
        x.beginPath(); x.moveTo(cx + r0 * ca, cy + r0 * sa); x.lineTo(cx + (r0 + ln) * ca, cy + (r0 + ln) * sa); x.stroke();
      }
      const disc = x.createRadialGradient(cx, cy, 0, cx, cy, r0);
      disc.addColorStop(0, this.col(1, 0.5, 0.11 + 0.35 * this.pulse, phase)); disc.addColorStop(1, this.col(1, 0.5, 0.03, phase));
      x.fillStyle = disc; x.strokeStyle = this.col(1, 0.5, 0.47 + 0.4 * this.pulse, phase); x.lineWidth = 1.6;
      x.beginPath(); x.arc(cx, cy, r0 * 0.94, 0, 6.2832); x.fill(); x.stroke();
    }
  }
  function rect(x, px, py, w, h, r) {
    x.beginPath();
    if (x.roundRect) x.roundRect(px, py, w, h, r); else x.rect(px, py, w, h);
    x.fill();
  }

  let vizMain = null; let vizBig = null; let phase = 0; let lastFrame = 0; let lastAmb = -1;
  function vizLoop(ts) {
    requestAnimationFrame(vizLoop);
    if (document.hidden || ts - lastFrame < 30) return;
    lastFrame = ts;
    const sr = P.ctx ? P.ctx.sampleRate : 48000;
    let freq = null;
    if (P.analyser && P.freq && P.station) { P.analyser.getFloatFrequencyData(P.freq); freq = P.freq; }
    const bigOn = !$('vizFull').hidden;
    const mainOn = S.viz !== 'off' && !!$('vizWrap').offsetParent;
    const ambOn = AMBIENT[S.ambient] > 0;
    if (mainOn || bigOn || ambOn) vizMain.feed(freq, sr);
    if (bigOn) vizBig.feed(freq, sr);
    phase = (phase + 0.0011 + 0.0012 * vizMain.bass) % 1;
    if (mainOn && !(vizMain.idle && vizMain.w && vizMain.drawnIdle)) { vizMain.draw(phase); vizMain.drawnIdle = vizMain.idle; }
    if (bigOn) vizBig.draw(phase);
    const amb = ambOn ? AMBIENT[S.ambient] * (vizMain.bass * 0.45 + vizMain.pulse * 0.6) : 0;
    if (Math.abs(amb - lastAmb) > 0.02 || (amb === 0 && lastAmb !== 0)) {
      lastAmb = amb; document.documentElement.style.setProperty('--amb', String(Math.min(1, amb).toFixed(2)));
    }
  }
  function initViz() {
    vizMain = new Viz($('viz'), 44, false); vizBig = new Viz($('vizBig'), 72, true);
    $('vizWrap').hidden = S.viz === 'off';
    requestAnimationFrame(vizLoop);
    const open = () => {
      if (S.viz === 'off') return;
      $('vizFull').hidden = false;
      try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* ignore */ }
    };
    const close = () => { $('vizFull').hidden = true; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
    $('vizWrap').addEventListener('click', open);
    $('vizFull').addEventListener('click', close);
    $('vfClose').addEventListener('click', (e) => { e.stopPropagation(); close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('vizFull').hidden) close(); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) $('vizFull').hidden = true; });
  }

  // ---------------------------------------------------------------- theme + dialogs
  function applyTheme() {
    window.RDTheme.apply(S.theme);
    if (vizMain) { vizMain.drawnIdle = false; }
  }
  function openSettings() {
    const dlg = $('setDlg'); const body = $('setBody'); body.replaceChildren();
    const h2 = document.createElement('h2'); h2.textContent = '設定'; body.append(h2);
    const hint = (t) => { const p = document.createElement('p'); p.className = 'hint'; p.textContent = t; body.append(p); };
    const row = (label, el) => { const r = document.createElement('div'); r.className = 'srow'; const s = document.createElement('span'); s.textContent = label; r.append(s, el); body.append(r); };
    const select = (opts, cur, fn) => { const s = document.createElement('select'); opts.forEach(([t, v]) => s.add(new Option(t, v))); s.value = cur; s.addEventListener('change', () => fn(s.value)); return s; };
    const check = (text, cur, fn) => { const l = document.createElement('label'); l.className = 'chk'; const c = document.createElement('input'); c.type = 'checkbox'; c.checked = cur; c.addEventListener('change', () => fn(c.checked)); l.append(c, document.createTextNode(text)); body.append(l); };

    row('外觀主題', select(Object.entries(THEMES).map(([k, v]) => [v, k]), S.theme, (v) => { S.theme = v; applyTheme(); saveNow(); }));
    h2.after(); const h3a = document.createElement('h3'); h3a.textContent = '視覺效果'; body.append(h3a);
    row('頻譜樣式', select(VIZ_STYLES, S.viz, (v) => { S.viz = v; $('vizWrap').hidden = v === 'off'; saveNow(); }));
    row('背景低音光暈', select([['關閉', 'off'], ['柔和', 'soft'], ['強烈', 'strong']], S.ambient, (v) => { S.ambient = v; saveNow(); }));
    const glow = document.createElement('input'); glow.type = 'range'; glow.min = 0; glow.max = 100; glow.value = S.glow;
    glow.addEventListener('input', () => { S.glow = +glow.value; saveSoon(); });
    row('光暈強度', glow);
    check('頻譜顏色跟著電台圖示變色（下一次播放生效）', S.coverColor, (v) => { S.coverColor = v; saveNow(); });
    check('啟用頻譜與 EQ（部分電台不開放，會自動改用一般播放）', S.enhanced, (v) => { S.enhanced = v; saveNow(); hint2.textContent = v ? '下一次播放生效。' : '已關閉：EQ 與頻譜不會作用。下一次播放生效。'; });
    const hint2 = document.createElement('p'); hint2.className = 'hint'; hint2.textContent = '下一次播放生效。'; body.append(hint2);

    const h3b = document.createElement('h3'); h3b.textContent = '等化器（EQ）'; body.append(h3b);
    const presetOpts = Object.entries(EQ_PRESETS).map(([k, [t]]) => [t, k]); presetOpts.push(['自訂', 'custom']);
    const sliders = []; const badges = [];
    const fmt = (v) => (v ? `${v > 0 ? '+' : ''}${v} dB` : '0 dB');
    const syncSliders = () => { const g = eqGains(); sliders.forEach((s, i) => { s.value = g[i]; badges[i].textContent = fmt(+g[i]); }); };
    const presetSel = select(presetOpts, S.eq, (v) => { S.eq = v; applyEq(); syncSliders(); saveNow(); });
    row('預設', presetSel);
    EQ_BANDS.forEach((hz, i) => {
      const r = document.createElement('div'); r.className = 'eqrow';
      const lb = document.createElement('span'); lb.className = 'hz'; lb.textContent = hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`;
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = -12; sl.max = 12; sl.step = 1;
      const bd = document.createElement('span'); bd.className = 'badge';
      sl.addEventListener('input', () => {
        S.eqCustom = sliders.map((s) => +s.value); S.eq = 'custom'; presetSel.value = 'custom';
        badges.forEach((b, j) => { b.textContent = fmt(S.eqCustom[j]); }); applyEq(); saveSoon();
      });
      sliders.push(sl); badges.push(bd); r.append(lb, sl, bd); body.append(r);
    });
    syncSliders();
    hint('EQ 與頻譜只對「允許跨網域讀取」的電台有效。音量超過 100% 同樣只在這類電台有效（iPhone 請用機身音量鍵）。');
    const hi = document.createElement('p'); hi.className = 'hint';
    hi.textContent = '安裝成 App：Android／電腦 Chrome 按右上角「安裝」；iPhone 用 Safari 按分享 →「加入主畫面」。';
    body.append(hi);
    const btns = document.createElement('div'); btns.className = 'dlg-btns';
    const done = document.createElement('button'); done.className = 'btn primary'; done.textContent = '完成'; done.addEventListener('click', () => dlg.close());
    btns.append(done); body.append(btns);
    dlg.addEventListener('close', saveNow, { once: true });
    dlg.showModal();
  }
  function initAddDialog() {
    const dlg = $('addDlg');
    $('addBtn').addEventListener('click', () => { $('addUrl').value = ''; $('addName').value = ''; dlg.showModal(); $('addUrl').focus(); });
    $('addCancel').addEventListener('click', () => dlg.close());
    $('addForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const url = $('addUrl').value.trim();
      if (!/^https:\/\//i.test(url)) { alert('網址要以 https:// 開頭（網頁版無法播放 http 電台）。'); return; }
      let host = ''; try { host = new URL(url).hostname; } catch (err) { alert('網址格式不正確。'); return; }
      const name = $('addName').value.trim() || host;
      if (!favKeys().has(url)) { S.favorites.push({ name, urls: [url], cc: '', tags: [], custom: true }); saveNow(); }
      dlg.close(); setView('fav');
    });
  }

  // ---------------------------------------------------------------- boot
  function init() {
    applyTheme(); buildToolbar(); initViz(); initAddDialog(); setNote('');
    const vol = $('volume'); vol.value = S.volume; $('volBadge').textContent = `${S.volume}%`;
    vol.addEventListener('input', () => { S.volume = +vol.value; $('volBadge').textContent = `${S.volume}%`; applyVolume(); saveSoon(); });
    $('playBtn').addEventListener('click', () => { const st = selectedStation() || P.last; if (st) playStation(st); });
    $('randBtn').addEventListener('click', randomStation);
    $('favBtn').addEventListener('click', () => toggleFav(selectedStation()));
    $('stopBtn').addEventListener('click', () => stopStation(false));
    $('settingsBtn').addEventListener('click', openSettings);
    setNow('尚未播放', IDLE_SUB);
    reload();

    let deferred = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('installBtn').hidden = false; });
    $('installBtn').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; $('installBtn').hidden = true; });
    window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; });
    window.addEventListener('beforeunload', saveNow);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && P.ctx && P.ctx.state === 'suspended' && P.station) P.ctx.resume().catch(() => {}); });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
