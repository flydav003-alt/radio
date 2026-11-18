'use strict';
/* RadioDeck PWA — exact port of the desktop colour system (THEMES / palette_for / _art_mesh + decorations). */
(() => {
  const ART_W = 1600; const ART_H = 1000;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const THEMES = {
    obsidian: { label: '黑曜鎏金', bh: 40, bs: 0.07, ah: 42, lum: 0.08, glass: 204,
      base: ['#0b0a09', '#12100d', '#070605'], decos: [['marble', '#d4af6a']],
      orbs: [[0.50, -0.10, 0.65, '#b98f45', 40], [0.00, 1.00, 0.45, '#8a6a2f', 30], [1.0, 1.0, 0.45, '#6b4f1f', 26]] },
    tokyo: { label: '東京夜雨', bh: 232, bs: 0.30, ah: 255, lum: 0.095, glass: 178,
      base: ['#12131d', '#191a2a', '#0e0f18'], decos: [['waves', '#7aa2f7']],
      orbs: [[0.10, 0.02, 0.60, '#7aa2f7', 95], [0.96, 0.22, 0.52, '#bb9af7', 75], [0.72, 1.02, 0.62, '#f7768e', 48]] },
    rose: { label: '玫瑰松林', bh: 252, bs: 0.24, ah: 348, lum: 0.09, glass: 180,
      base: ['#15121f', '#1d1830', '#0f0c18'], decos: [['bokeh', '#ebbcba']],
      orbs: [[0.08, 0.00, 0.62, '#c4a7e7', 80], [0.96, 0.92, 0.58, '#eb6f92', 58], [0.88, 0.06, 0.42, '#f6c177', 34]] },
    torii: { label: '京都鳥居', bh: 358, bs: 0.26, ah: 14, lum: 0.085, glass: 184,
      base: ['#190c0e', '#27121a', '#0d0608'], decos: [['torii', '#c0392b'], ['petals', '#ff9a5a']],
      orbs: [[0.10, 0.00, 0.62, '#ff6a3d', 66], [0.96, 0.96, 0.62, '#8a2a56', 62], [0.50, 0.30, 0.30, '#ffb36b', 20]] },
    rosewater: { label: '玫瑰（淺色）', light: true, bh: 338, bs: 0.45, ah: 338, lum: 0.9, glass: 232,
      base: ['#fcf5f7', '#fbf3f6', '#fbf3f6'], vignette: 0, grain: 0, decos: [],
      orbs: [[0.0, 0.0, 0.80, '#f8dde7', 190], [1.0, 0.0, 0.72, '#fbe9d8', 190], [0.62, 1.08, 0.66, '#ece0f6', 190]] },
  };

  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    const a = s * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  }
  function rgba(hex, alpha255) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${(alpha255 / 255).toFixed(3)})`;
  }
  const qc = (hex, a) => rgba(hex, clamp(a, 0, 255));

  function darkPalette(bh, bs, ah, lum) {
    const d = {
      BASE: hsl(bh, bs, lum), PANEL: hsl(bh, bs, lum * 1.4), RAISED: hsl(bh, bs, lum * 1.85), RAISED_HI: hsl(bh, bs, lum * 2.3),
      LINE: hsl(bh, bs * 0.9, lum + 0.17), LINE_HI: hsl(bh, bs * 0.8, lum + 0.25),
      SEL: hsl(bh, Math.max(0.30, bs * 0.75), 0.32), SEL_LINE: hsl(bh, Math.max(0.30, bs * 0.75), 0.47),
      FOCUS: hsl(ah, 0.55, 0.64), FOCUS_HI: hsl(ah, 0.72, 0.78),
      TEXT: hsl(bh, 0.35, 0.95), TEXT2: hsl(bh, 0.28, 0.87), MUTED: hsl(bh, 0.20, 0.74),
      FAINT: hsl(bh, 0.18, 0.66), DISABLED: hsl(bh, 0.12, 0.48),
      SCROLL: hsl(bh, 0.30, 0.32), SCROLL_HI: hsl(bh, 0.35, 0.44),
      ACC_HI: hsl(ah, 0.62, 0.58), ACC_LO: hsl(ah, 0.60, 0.44),
      ACC_HOVER_HI: hsl(ah, 0.68, 0.64), ACC_HOVER_LO: hsl(ah, 0.64, 0.50),
      ACC_LINE: hsl(ah, 0.70, 0.70), ACC_BAR: hsl(ah, 0.88, 0.70),
      ACC_TEXT: hsl(ah, 0.95, 0.85), ACC_SOFT: hsl(ah, 0.50, 0.25), ACC_BORDER: hsl(ah, 0.42, 0.36),
    };
    Object.assign(d, {
      HEAD: '#f3f1ff', STRONG: '#ffffff', BTN_TEXT: '#dfe2f5',
      DANGER_FG: '#ff9fb4', DANGER_BG: '#3a1f2e', DANGER_LINE: '#6d3449', DANGER_HOVER: '#4a2538', DANGER_HOVER_LINE: '#a04a66',
      STAR: '#f5c26b', STAR_MISSING: '#6b5a30',
    });
    return d;
  }
  function lightPalette(bh, bs, ah) {
    const dl = (ah >= 65 && ah <= 205) ? -0.10 : 0;
    const d = {
      BASE: hsl(bh, bs, 0.955), PANEL: hsl(bh, bs * 0.4, 0.997), RAISED: hsl(bh, bs * 0.9, 0.945), RAISED_HI: hsl(bh, bs * 0.95, 0.905),
      LINE: hsl(bh, bs * 0.6, 0.895), LINE_HI: hsl(bh, bs * 0.55, 0.815),
      SEL: hsl(bh, Math.max(0.55, bs), 0.885), SEL_LINE: hsl(bh, Math.max(0.45, bs * 0.8), 0.72),
      FOCUS: hsl(ah, 0.62, 0.56), FOCUS_HI: hsl(ah, 0.66, 0.46),
      TEXT: hsl(bh, 0.32, 0.15), TEXT2: hsl(bh, 0.26, 0.23), MUTED: hsl(bh, 0.16, 0.38),
      FAINT: hsl(bh, 0.13, 0.46), DISABLED: hsl(bh, 0.10, 0.64),
      SCROLL: hsl(bh, 0.25, 0.78), SCROLL_HI: hsl(bh, 0.30, 0.65),
      ACC_HI: hsl(ah, 0.68, 0.58 + dl), ACC_LO: hsl(ah, 0.64, 0.47 + dl),
      ACC_HOVER_HI: hsl(ah, 0.72, 0.63 + dl), ACC_HOVER_LO: hsl(ah, 0.68, 0.52 + dl),
      ACC_LINE: hsl(ah, 0.60, 0.42), ACC_BAR: hsl(ah, 0.72, 0.55),
      ACC_TEXT: hsl(ah, 0.70, 0.36), ACC_SOFT: hsl(ah, 0.75, 0.925), ACC_BORDER: hsl(ah, 0.55, 0.80),
    };
    Object.assign(d, {
      HEAD: hsl(bh, 0.38, 0.12), STRONG: hsl(bh, 0.40, 0.11), BTN_TEXT: hsl(bh, 0.30, 0.20),
      DANGER_FG: '#c0274e', DANGER_BG: '#ffe4ea', DANGER_LINE: '#f0b3c3', DANGER_HOVER: '#ffd6e0', DANGER_HOVER_LINE: '#e58aa3',
      STAR: '#e0a01c', STAR_MISSING: '#e6d6aa',
    });
    return d;
  }
  function paletteFor(key) {
    const t = THEMES[key] || THEMES.tokyo;
    const d = t.light ? lightPalette(t.bh, t.bs, t.ah) : darkPalette(t.bh, t.bs, t.ah, t.lum);
    const g = t.glass;
    d.PANEL_S = d.PANEL; d.RAISED_S = d.RAISED;
    d.PANEL_A = rgba(d.PANEL, g); d.BASE_A = rgba(d.BASE, Math.min(255, g + 30));
    d.RAISED_A = rgba(d.RAISED, Math.min(255, g + 25)); d.RAISED_HI_A = rgba(d.RAISED_HI, Math.min(255, g + 40));
    return d;
  }

  // ---------------------------------------------------------------- backdrop artwork
  function mulberry(seed) {
    let a = seed >>> 0;
    const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.uniform = (lo, hi) => lo + (hi - lo) * r();
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  }
  function orb(x, W, H, ox, oy, or_, color, alpha) {
    alpha = Math.min(255, alpha * 1.4);
    const g = x.createRadialGradient(W * ox, H * oy, 0, W * ox, H * oy, W * or_);
    g.addColorStop(0, qc(color, alpha)); g.addColorStop(0.5, qc(color, alpha * 0.38)); g.addColorStop(1, qc(color, 0));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  function decoWaves(x, W, H, col) {
    x.fillStyle = 'rgba(0,0,0,0)';
    for (let i = 0; i < 8; i++) {
      x.strokeStyle = qc(col, 62 - i * 6); x.lineWidth = 1.3; x.beginPath();
      for (let k = 0, px = 0; px <= W + 8; px += 8, k++) {
        const y = H * (0.80 + i * 0.02) + 26 * Math.sin(px / 175 + i * 0.5) + 11 * Math.sin(px / 58 + i * 1.3);
        if (k === 0) x.moveTo(px, y); else x.lineTo(px, y);
      }
      x.stroke();
    }
  }
  function decoBokeh(x, W, H, col) {
    const rng = mulberry(7);
    for (let i = 0; i < 26; i++) {
      const r = rng.uniform(10, 44); const px = rng.uniform(0, W); const py = rng.uniform(0, H);
      x.fillStyle = qc(col, rng.uniform(8, 26)); x.strokeStyle = qc(col, rng.uniform(14, 40)); x.lineWidth = 1;
      x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.fill(); x.stroke();
    }
  }
  function decoPetals(x, W, H, col) {
    const rng = mulberry(11);
    for (let i = 0; i < 46; i++) {
      const px = W * (1 - Math.pow(rng(), 1.8)); const py = rng.uniform(0, H * 0.9); const s = rng.uniform(5, 13);
      x.save(); x.translate(px, py); x.rotate(rng.uniform(0, 360) * Math.PI / 180);
      x.fillStyle = qc(col, rng.uniform(25, 95)); x.beginPath(); x.ellipse(0, 0, s, s * 0.55, 0, 0, 6.2832); x.fill(); x.restore();
    }
  }
  function decoTorii(x, W, H, col) {
    for (const x0 of [W * 0.74, W * 0.88]) {
      const g = x.createLinearGradient(0, H * 0.60, 0, H); g.addColorStop(0, qc(col, 190)); g.addColorStop(1, qc(col, 30));
      x.fillStyle = g; x.fillRect(x0 - 13, H * 0.60, 26, H * 0.40);
    }
    let g = x.createLinearGradient(0, H * 0.56, 0, H * 0.62); g.addColorStop(0, qc(col, 215)); g.addColorStop(1, qc(col, 150));
    x.fillStyle = g; x.beginPath();
    [[0.70, 0.585], [0.715, 0.555], [0.905, 0.555], [0.92, 0.585], [0.905, 0.60], [0.715, 0.60]].forEach(([a, b], i) => { if (i === 0) x.moveTo(W * a, H * b); else x.lineTo(W * a, H * b); });
    x.closePath(); x.fill();
    x.fillStyle = qc(col, 170); x.fillRect(W * 0.715, H * 0.655, W * 0.19, 20);
    x.fillStyle = qc(col, 140); x.fillRect(W * 0.805, H * 0.60, 18, H * 0.055);
    g = x.createRadialGradient(W * 0.81, H * 0.72, 0, W * 0.81, H * 0.72, 330); g.addColorStop(0, qc(col, 60)); g.addColorStop(1, qc(col, 0));
    x.fillStyle = g; x.beginPath(); x.arc(W * 0.81, H * 0.72, 330, 0, 6.2832); x.fill();
  }
  function decoMarble(x, W, H, col) {
    const rng = mulberry(21);
    for (let i = 0; i < 26; i++) {
      const px = rng.uniform(0, W); const py = rng.uniform(0, H); const r = rng.uniform(200, 520);
      const c = i % 3 ? '#ffffff' : '#d4af6a';
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, qc(c, rng.uniform(10, 24))); g.addColorStop(1, qc(c, 0));
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    const veins = [];
    const grow = (sx, sy, ang, n, w, depth) => {
      let px = sx; let py = sy; const pts = [[px, py]]; let off = 0; let vel = 0;
      for (let i = 0; i < n; i++) {
        vel = vel * 0.90 - off * 0.028 + rng.uniform(-0.05, 0.05); off += vel;
        const a = ang + off; const st = rng.uniform(7, 11);
        px += Math.cos(a) * st; py += Math.sin(a) * st; pts.push([px, py]);
        if (depth < 2 && rng() < 0.022) grow(px, py, a + rng.pick([-1, 1]) * rng.uniform(0.35, 0.7), Math.floor(n * rng.uniform(0.25, 0.45)), w * 0.6, depth + 1);
      }
      veins.push([pts, w, depth]);
    };
    [[-20, H * 0.86, -0.55, 230, 3.0], [W + 20, H * 0.16, 2.65, 210, 2.6], [W * 0.62, H + 20, -1.75, 120, 2.0], [W * 0.10, -20, 1.2, 90, 1.6]]
      .forEach(([sx, sy, a, n, w]) => grow(sx, sy, a, n, w, 0));
    x.lineCap = 'round'; x.lineJoin = 'round';
    const stroke = (chunk, pw, al, c) => {
      x.strokeStyle = qc(c, al); x.lineWidth = pw; x.beginPath(); x.moveTo(chunk[0][0], chunk[0][1]);
      for (let i = 1; i < chunk.length; i++) x.lineTo(chunk[i][0], chunk[i][1]);
      x.stroke();
    };
    for (const [pts, w, depth] of veins) {
      const n = pts.length;
      for (let i = 0; i < n - 1; i += 5) {
        const chunk = pts.slice(i, i + 6); const t = (i + 3) / Math.max(1, n);
        const ww = w * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * Math.min(1, t)), 0.7)) * 0.55;
        stroke(chunk, ww * 9, 7, col); stroke(chunk, ww * 4, 16, col); stroke(chunk, ww, 105, '#e3c98a'); stroke(chunk, ww * 0.35, 80, '#fff0c8');
      }
      if (depth === 0) {
        for (const off of [-10, 15]) {
          const shifted = [];
          for (let k = 1; k < n - 1; k++) {
            const dx = pts[k + 1][0] - pts[k - 1][0]; const dy = pts[k + 1][1] - pts[k - 1][1]; const ln = Math.hypot(dx, dy) || 1;
            const o = off + 4 * Math.sin(k / 6);
            shifted.push([pts[k][0] - dy / ln * o, pts[k][1] + dx / ln * o]);
          }
          for (let i = 0; i < shifted.length - 1; i += 5) stroke(shifted.slice(i, i + 6), 0.7, 34, '#e8cc88');
        }
      }
    }
    for (const [pts] of veins) {
      for (let i = 0; i < pts.length; i += 10) {
        const q = pts[i]; const r = rng.uniform(0.6, 1.7);
        x.fillStyle = qc('#ffe6a8', rng.uniform(30, 100));
        x.beginPath(); x.arc(q[0] + rng.uniform(-16, 16), q[1] + rng.uniform(-16, 16), r, 0, 6.2832); x.fill();
      }
    }
  }
  const DECOS = { waves: decoWaves, bokeh: decoBokeh, petals: decoPetals, marble: decoMarble, torii: decoTorii };

  function grain(x, W, H, strength) {
    const tile = document.createElement('canvas'); tile.width = tile.height = 256;
    const tx = tile.getContext('2d'); const id = tx.createImageData(256, 256); const rng = mulberry(1);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.floor(rng() * 256); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.floor(rng() * (strength + 1)); }
    tx.putImageData(id, 0, 0);
    x.fillStyle = x.createPattern(tile, 'repeat'); x.fillRect(0, 0, W, H);
  }
  function paintArt(canvas, spec) {
    const W = ART_W; const H = ART_H; canvas.width = W; canvas.height = H;
    const x = canvas.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, spec.base[0]); g.addColorStop(0.5, spec.base[1]); g.addColorStop(1, spec.base[2]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (const [ox, oy, or_, col, a] of spec.orbs) orb(x, W, H, ox, oy, or_, col, a);
    for (const [name, col] of spec.decos || []) { x.save(); try { DECOS[name](x, W, H, col); } catch (e) { /* decoration is optional */ } x.restore(); }
    const rim = x.createLinearGradient(0, 0, W, 0);
    rim.addColorStop(0, qc('#ffffff', 0)); rim.addColorStop(0.5, qc('#ffffff', 16)); rim.addColorStop(1, qc('#ffffff', 0));
    x.fillStyle = rim; x.fillRect(0, 0, W, 2);
    const gr = spec.grain === undefined ? 11 : spec.grain;
    if (gr) grain(x, W, H, gr);
    const vg = spec.vignette === undefined ? 120 : spec.vignette;
    const v = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.72);
    v.addColorStop(0.5, qc('#000000', 0)); v.addColorStop(1, qc('#000000', vg));
    x.fillStyle = v; x.fillRect(0, 0, W, H);
  }

  const api = {
    THEMES, pal: paletteFor('tokyo'), key: 'tokyo',
    apply(key) {
      if (!THEMES[key]) key = 'tokyo';
      const pal = paletteFor(key); api.pal = pal; api.key = key;
      const root = document.documentElement.style;
      Object.entries(pal).forEach(([k, v]) => root.setProperty('--' + k.toLowerCase().replace(/_/g, '-'), v));
      document.documentElement.dataset.theme = key;
      document.documentElement.style.colorScheme = THEMES[key].light ? 'light' : 'dark';
      const meta = document.getElementById('themeColor'); if (meta) meta.setAttribute('content', pal.BASE);
      const cv = document.getElementById('bg');
      if (cv) {
        // paint after first layout so a slow marble render never delays the controls
        const draw = () => { try { paintArt(cv, THEMES[key]); } catch (e) { /* plain background fallback */ } };
        if (cv.dataset.done) draw(); else { cv.dataset.done = '1'; requestAnimationFrame(() => setTimeout(draw, 0)); }
      }
      return pal;
    },
  };
  window.RDTheme = api;
})();
