/* ── PROTECTED CASE STUDY GATE ── */
(function(){
  const HASH = '100aa5ee77f448f54a90f9d5338cf1fd59649bab93fc14d6e9884a617741ebce';
  const modal = document.getElementById('pw-modal');
  if (!modal) return;
  let targetHref = '';

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  document.querySelectorAll('[data-protected]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      targetHref = el.dataset.href || '';
      document.getElementById('pw-error').textContent = '';
      document.getElementById('pw-input').value = '';
      modal.style.display = 'flex';
      setTimeout(() => document.getElementById('pw-input').focus(), 50);
    });
  });

  async function attempt() {
    const val = document.getElementById('pw-input').value;
    const h = await sha256(val);
    if (h === HASH) {
      modal.style.display = 'none';
      window.location.href = targetHref;
    } else {
      document.getElementById('pw-error').textContent = 'Incorrect password.';
      document.getElementById('pw-input').select();
    }
  }

  document.getElementById('pw-submit').addEventListener('click', attempt);
  document.getElementById('pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  document.getElementById('pw-cancel').addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
})();

/* ── NAV BADGE ANIMATE IN ── */
(function(){
  const badge = document.querySelector('.nav-badge');
  if (badge) badge.classList.add('animate-in');
})();

/* ── FULL PAGE STAR FIELD ── */
(function(){
  const sf = document.getElementById('starField');
  if (!sf) return;
  const ctx = sf.getContext('2d');

  function resize() {
    sf.width  = window.innerWidth;
    sf.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const COUNT = 500;
  const stars = Array.from({ length: COUNT }, () => ({
    x:     Math.random(),
    y:     Math.random(),
    r:     .1 + Math.random() * .9,
    a:     .05 + Math.random() * .55,
    phase: Math.random() * Math.PI * 2,
    speed: .003 + Math.random() * .008
  }));

  let last = 0;
  (function tick(now) {
    requestAnimationFrame(tick);
    if (now - last < 50) return; // ~20fps — very light on CPU
    last = now;

    const W = sf.width, H = sf.height;
    ctx.clearRect(0, 0, W, H);

    stars.forEach(s => {
      s.phase += s.speed;
      const a = s.a * (.3 + Math.sin(s.phase) * .7);
      if (a <= 0) return;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    });
  })(0);
})();

/* ── NAV LOGO: LOCK POSITION AFTER SLIDE-IN ── */
(function(){
  const logo = document.querySelector('.nav-logo');
  if (!logo) return;
  logo.addEventListener('animationend', (e) => {
    if (e.animationName === 'logo-slide-in') {
      logo.style.opacity = '1';
      logo.style.transform = 'translateX(0)';
      logo.classList.add('logo-ready');
    }
  });
})();

/* ── SECTION TITLE SLIDE-IN ── */
(function(){
  const els = document.querySelectorAll('.sec-label, .sec-title');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  els.forEach(el => io.observe(el));
})();

/* ── NAV SCROLL FADE ── */
(function(){
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
})();

/* ── CURSOR ── */
const cur  = document.getElementById('cur');
const ring = document.getElementById('curRing');
let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px'; cur.style.top = my + 'px';
});
(function animateRing() {
  rx += (mx - rx) * .1; ry += (my - ry) * .1;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(animateRing);
})();


/* ══════════════════════════════════════
   BLACK HOLE RENDERER
   Combines: arch rings · lensing warp · plasma · CSS-style rotating rings
   ══════════════════════════════════════ */
function drawPortal(canvas, opts) {
  const ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  let t = 0, fc = 0;

  // ── Stars — stratified jitter grid so stars spread evenly with no clumping ──
  const starCount = opts.starCount || 180;
  const cols = Math.ceil(Math.sqrt(starCount));
  const rows = Math.ceil(starCount / cols);
  const starIndices = Array.from({ length: cols * rows }, (_, i) => i)
    .sort(() => Math.random() - .5)
    .slice(0, starCount);
  const stars = starIndices.map(idx => ({
    nx: (idx % cols + Math.random()) / cols,
    ny: (Math.floor(idx / cols) + Math.random()) / rows,
    r: .15 + Math.random() * .8, a: .08 + Math.random() * .65,
    phase: Math.random() * Math.PI * 2, speed: .00224 + Math.random() * .01232
  }));

  // ── Nebulae (normalized) ──
  const nebulae = Array.from({ length: 3 }, () => ({
    nx: Math.random(), ny: Math.random() * .75,
    rnx: .06 + Math.random() * .14, rny: .03 + Math.random() * .07,
    color: Math.random() > .5 ? '251,146,60' : '56,189,248',
    phase: Math.random() * Math.PI * 2, speed: .00112 + Math.random() * .00224
  }));

  // ── Constellations ──
  const constellations = Array.from({ length: 5 }, () =>
    Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => ({
      x: Math.random() * W, y: Math.random() * H * .65,
      r: .6 + Math.random() * .6, phase: Math.random() * Math.PI * 2
    }))
  );

  // ── Accretion disc particles ──
  const disc = Array.from({ length: opts.discCount || 280 }, (_, i) => {
    const layer = Math.floor(i / 70);
    return {
      angle: (i / 280) * Math.PI * 2,
      speed: (.004586 + Math.random() * .003276) * (layer % 2 === 0 ? 1 : -1) * (1 - layer * .15),
      r: (opts.discRBase || .048) + layer * (opts.discLayerStep || .045) + (Math.random() - .5) * .072,
      size: (2.7 + Math.random() * 8.1) * (opts.discSizeScale || 1),
      brightness: .3 + Math.random() * .7,
      layer, phase: Math.random() * Math.PI * 2
    };
  });

  // ── Outer light blue stream — farther orbit ring ──
  const outerStreamBlue = Array.from({ length: 300 }, (_, i) => ({
    angle: (i / 300) * Math.PI * 2 + Math.PI * 0.7,
    speed: (.003 + Math.random() * .003) * (Math.random() > .4 ? -1 : 1),
    r: 0.038 + Math.random() * 0.045,
    size: (0.4 + Math.pow(Math.random(), 0.5) * 4.2),
    brightness: .4 + Math.random() * .6,
    phase: Math.random() * Math.PI * 2
  }));

  // ── Dense blue inner stream ──
  const innerStreamBlue = Array.from({ length: 228 }, (_, i) => ({
    angle: (i / 228) * Math.PI * 2 + Math.PI * 0.3,
    speed: (.005 + Math.random() * .004) * (Math.random() > .35 ? -1 : 1),
    r: 0.008 + Math.random() * 0.028,
    size: (0.3 + Math.pow(Math.random(), 0.5) * 4.8),
    brightness: .45 + Math.random() * .55,
    phase: Math.random() * Math.PI * 2
  }));

  // ── Dense orange inner stream — continuous ring of particles hugging the event horizon ──
  const innerStream = Array.from({ length: 132 }, (_, i) => ({
    angle: (i / 132) * Math.PI * 2,
    speed: (.006 + Math.random() * .004) * (Math.random() > .3 ? 1 : -1),
    r: 0.004 + Math.random() * 0.022,   // very close to sphere surface
    size: (0.3 + Math.pow(Math.random(), 0.5) * 5.5),
    brightness: .5 + Math.random() * .5,
    phase: Math.random() * Math.PI * 2
  }));

  // ── CSS-style full rotating rings with orbiting hot spots ──
  const fullRings = Array.from({ length: 5 }, (_, i) => ({
    radiusFrac:  (i === 0 ? .025 : .05 + i * .08),
    hotAngle:    Math.random() * Math.PI * 2,
    hotSpeed:    (.003 + Math.random() * .004) * (Math.random() > .5 ? 1 : -1),
    isOrange:    i % 2 === 0
  }));

  // ── Orbiting planets ──
  const planets = [
    // Innermost: hot orange, fastest, motion trail — being consumed
    { radiusFrac: 0.20, angle: 0.8,  speed:  0.0012,   sizeF: 0.256, rC: 255, gC: 110, bC: 35,  trail: true,  trailHistory: [], glow: false, ring: false,
      absorbState: 'normal', absorbTimer: 420, absorbProgress: 0, absorbBaseAngle: 0.8, absorbFlash: 0, absorbRipples: [] },
    // Second: teal, medium-fast, glow halo, small rings
    { radiusFrac: 0.40, angle: 2.1,  speed: -0.0006,   sizeF: 0.184, rC: 40,  gC: 200, bC: 255, trail: false, glow: true,  ring: true, ringScale: 0.6 },
    // Third: sandy/golden, medium-slow
    { radiusFrac: 0.63, angle: 4.5,  speed:  0.000375, sizeF: 0.216, rC: 210, gC: 160, bC: 65,  trail: false, glow: false, ring: false },
    // Outermost: ice blue, slowest, subtle glow, full rings
    { radiusFrac: 0.82, angle: 1.3,  speed: -0.000225, sizeF: 0.228, rC: 185, gC: 215, bC: 255, trail: false, glow: true,  ring: true, ringScale: 1.0 },
  ];

  // ── Solar flares ──
  const flares = [];
  setInterval(() => {
    flares.push({
      angle:      Math.random() * Math.PI * 2,
      startT:     t,
      duration:   1.0 + Math.random() * 0.9,
      lengthMult: 1.6 + Math.random() * 1.6,
      spread:     0.13 + Math.random() * 0.10,
      // organic curve offsets: lateral bend on each side of the flare
      curl1:      (Math.random() - 0.5) * 2.2,
      curl2:      (Math.random() - 0.5) * 2.2,
      // where along the flare the control point sits (0.3–0.6)
      cpPos:      0.3 + Math.random() * 0.3,
    });
    if (flares.length > 4) flares.shift();
  }, 3800);

  // ── Shooting stars ──
  const shooters = [];
  setInterval(() => {
    if (!opts.shooters) return;
    shooters.push({
      x: Math.random() * W, y: Math.random() * H * .5,
      vx: 2 + Math.random() * 5, vy: .3 + Math.random() * 1.2,
      life: 1, decay: .01 + Math.random() * .012,
      color: Math.random() > .5 ? '251,146,60' : '56,189,248'
    });
  }, 900);

  // ────────────────────────────────────
  // LENSING — gravitational warp of the star field
  // Uses a half-res offscreen canvas + pre-computed displacement LUT
  // ────────────────────────────────────
  // useLensing is re-evaluated every frame from opts so resize switches code paths correctly
  let useLensing = opts.lensing === true;
  let osc, octx, lensed, lensedCtx, lut;
  let lastW = W, lastH = H;

  // Always create both canvas paths — either may be needed after a resize
  osc       = document.createElement('canvas');
  octx      = osc.getContext('2d');
  lensed    = document.createElement('canvas');
  lensedCtx = lensed.getContext('2d');

  const plainStars = document.createElement('canvas');
  const plainCtx   = plainStars.getContext('2d');

  function buildLUT() {
    if (!useLensing) return;
    // Cap at 600px wide for performance — drawImage scales it up
    const ow = Math.min(W, 600);
    const oh = Math.round(H * ow / W);
    osc.width    = ow;  osc.height    = oh;
    lensed.width = ow;  lensed.height = oh;

    const ocx = ow * .5;
    const ocy = oh * (opts.originY || .88);
    const ors = ow * (opts.sphereR || .072);
    const STR = ow * ow * .034;

    lut = new Uint16Array(ow * oh * 2);
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        const dx = x - ocx, dy = y - ocy;
        const r2 = dx * dx + dy * dy;
        let sx = x, sy = y;
        if (r2 > ors * ors) {
          const def = Math.min(STR / r2, 2.8);
          sx = Math.max(0, Math.min(ow - 1, Math.round(x - dx * def)));
          sy = Math.max(0, Math.min(oh - 1, Math.round(y - dy * def)));
        }
        lut[(y * ow + x) * 2]     = sx;
        lut[(y * ow + x) * 2 + 1] = sy;
      }
    }
  }

  function renderStarsToOsc() {
    const ow = osc.width, oh = osc.height;
    octx.fillStyle = '#010205';
    octx.fillRect(0, 0, ow, oh);

    nebulae.forEach(n => {
      n.phase += n.speed;
      const pulse = 1 + Math.sin(n.phase) * .08;
      const nx = n.nx * ow, ny = n.ny * oh;
      const rx = n.rnx * ow, ry = n.rny * oh;
      const g = octx.createRadialGradient(nx, ny, 0, nx, ny, rx * pulse);
      g.addColorStop(0, `rgba(${n.color},${.08 + Math.sin(n.phase) * .02})`);
      g.addColorStop(.5, `rgba(${n.color},.04)`);
      g.addColorStop(1, `rgba(${n.color},0)`);
      octx.save(); octx.scale(1, ry / rx);
      octx.beginPath(); octx.arc(nx, ny * (rx / ry), rx * pulse, 0, Math.PI * 2);
      octx.fillStyle = g; octx.fill(); octx.restore();
    });

    stars.forEach(s => {
      s.phase += s.speed;
      const a = s.a * (.4 + Math.sin(s.phase) * .6);
      octx.beginPath(); octx.arc(s.nx * ow, s.ny * oh, s.r, 0, Math.PI * 2);
      octx.fillStyle = `rgba(255,255,255,${a})`; octx.fill();
      if (s.r > 0.75 && a > .55) {
        octx.strokeStyle = `rgba(255,255,255,${a * .3})`; octx.lineWidth = .5;
        octx.beginPath(); octx.moveTo(s.nx*ow - s.r*4, s.ny*oh); octx.lineTo(s.nx*ow + s.r*4, s.ny*oh); octx.stroke();
        octx.beginPath(); octx.moveTo(s.nx*ow, s.ny*oh - s.r*4); octx.lineTo(s.nx*ow, s.ny*oh + s.r*4); octx.stroke();
      }
    });
  }

  function applyLensing() {
    if (!lut) return;
    const ow = osc.width, oh = osc.height;
    const src = octx.getImageData(0, 0, ow, oh).data;
    const dst = lensedCtx.createImageData(ow, oh);
    const dd = dst.data, n = ow * oh;
    for (let i = 0; i < n; i++) {
      const sx = lut[i * 2], sy = lut[i * 2 + 1];
      const di = i * 4, si = (sy * ow + sx) * 4;
      dd[di] = src[si]; dd[di+1] = src[si+1]; dd[di+2] = src[si+2]; dd[di+3] = 255;
    }
    lensedCtx.putImageData(dst, 0, 0);
  }

  buildLUT();

  // ── 3-pass bloom for arch rings ──
  function drawArchRing(ox, oy, r, brightness, rC, gC, bC, pulse) {
    const rr = r * pulse;
    const ry = rr * 0.34;
    ctx.save();
    ctx.shadowBlur = 80 * brightness;
    ctx.shadowColor = `rgba(${rC},${gC},${bC},${brightness * .55})`;
    ctx.strokeStyle = `rgba(${rC},${gC},${bC},${brightness * .1})`;
    ctx.lineWidth = 22 * brightness + 5;
    ctx.beginPath(); ctx.ellipse(ox, oy, rr, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 28 * brightness;
    ctx.shadowColor = `rgba(${rC},${gC},${bC},${brightness * .9})`;
    ctx.strokeStyle = `rgba(${rC},${gC},${bC},${brightness * .5})`;
    ctx.lineWidth = 6 * brightness + 1.5;
    ctx.beginPath(); ctx.ellipse(ox, oy, rr, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(255,248,235,${brightness})`;
    ctx.strokeStyle = `rgba(255,252,245,${brightness * .92})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(ox, oy, rr, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawPlanetGlow(ctx, px, py, radius, rC, gC, bC, alpha) {
    alpha = alpha || 1;
    // Outer diffuse glow
    const g = ctx.createRadialGradient(px, py, radius * 0.8, px, py, radius * 3.2);
    g.addColorStop(0,   `rgba(${rC},${gC},${bC},${0.22 * alpha})`);
    g.addColorStop(0.4, `rgba(${rC},${gC},${bC},${0.07 * alpha})`);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(px, py, radius * 3.2, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
  }

  function drawPlanetRing(ctx, px, py, radius, rC, gC, bC, alpha, frontHalf, scale) {
    // Saturn-style ring — tilted ellipse, drawn in two halves for depth
    scale = scale || 1;
    const rx = radius * 2.6 * scale, ry = radius * 0.55 * scale;
    const startA = frontHalf ? 0 : Math.PI;
    const endA   = frontHalf ? Math.PI : Math.PI * 2;
    // Three concentric ring bands
    const bands = [
      { r: 1.0, w: 0.22, a: 0.55 },
      { r: 1.28, w: 0.18, a: 0.35 },
      { r: 1.52, w: 0.12, a: 0.20 },
    ];
    bands.forEach(b => {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(px, py, rx * b.r, ry * b.r, 0, startA, endA);
      ctx.ellipse(px, py, rx * b.r * (1 - b.w), ry * b.r * (1 - b.w), 0, endA, startA, true);
      ctx.closePath();
      const rg = ctx.createLinearGradient(px - rx * b.r, py, px + rx * b.r, py);
      rg.addColorStop(0,    `rgba(${rC},${gC},${bC},${b.a * alpha * 0.4})`);
      rg.addColorStop(0.3,  `rgba(${Math.min(255,rC+60)},${Math.min(255,gC+60)},${Math.min(255,bC+60)},${b.a * alpha})`);
      rg.addColorStop(0.5,  `rgba(${rC},${gC},${bC},${b.a * alpha * 0.7})`);
      rg.addColorStop(0.7,  `rgba(${Math.min(255,rC+60)},${Math.min(255,gC+60)},${Math.min(255,bC+60)},${b.a * alpha})`);
      rg.addColorStop(1,    `rgba(${rC},${gC},${bC},${b.a * alpha * 0.4})`);
      ctx.fillStyle = rg; ctx.fill();
      ctx.restore();
    });
  }

  function drawPlanet(ctx, px, py, radius, rC, gC, bC, alpha, time) {
    ctx.save();
    ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.clip();

    // D — Base sphere with directional lighting (light from upper-left)
    const sG = ctx.createRadialGradient(
      px - radius * 0.38, py - radius * 0.38, 0,
      px + radius * 0.28, py + radius * 0.28, radius * 1.45
    );
    sG.addColorStop(0,    `rgba(${Math.min(255,rC+90)},${Math.min(255,gC+90)},${Math.min(255,bC+90)},${alpha})`);
    sG.addColorStop(0.3,  `rgba(${Math.min(255,rC+30)},${Math.min(255,gC+30)},${Math.min(255,bC+30)},${alpha})`);
    sG.addColorStop(0.6,  `rgba(${rC},${gC},${bC},${alpha})`);
    sG.addColorStop(1,    `rgba(${Math.max(0,rC-80)},${Math.max(0,gC-80)},${Math.max(0,bC-80)},${alpha * 0.8})`);
    ctx.fillStyle = sG; ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);

    // A+B — Banded texture with procedural noise variation
    const bandCount = 7;
    for (let i = 0; i < bandCount; i++) {
      const bandY = py - radius + (radius * 2 * i / bandCount);
      const bandH = (radius * 2) / bandCount;
      const noise = Math.sin(time * 0.6 + i * 1.9) * 0.04 + Math.sin(time * 0.25 + i * 3.1) * 0.025;
      const even = i % 2 === 0;
      const bA = Math.max(0, (even ? 0.10 : 0.06) + noise) * alpha;
      const bR = even ? Math.min(255, rC + 25) : Math.max(0, rC - 18);
      const bG = even ? Math.max(0, gC - 8)    : Math.min(255, gC + 12);
      const bB = even ? Math.max(0, bC - 12)   : Math.min(255, bC + 18);
      ctx.fillStyle = `rgba(${bR},${bG},${bB},${bA})`;
      ctx.fillRect(px - radius, bandY, radius * 2, bandH);
    }

    // D — Terminator: sharp shadow on shadow side (lower-right hemisphere)
    const shadow = ctx.createRadialGradient(
      px + radius * 0.52, py + radius * 0.52, 0,
      px + radius * 0.52, py + radius * 0.52, radius * 1.65
    );
    shadow.addColorStop(0,    `rgba(0,0,0,${0.62 * alpha})`);
    shadow.addColorStop(0.38, `rgba(0,0,0,${0.42 * alpha})`);
    shadow.addColorStop(0.65, `rgba(0,0,0,${0.12 * alpha})`);
    shadow.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = shadow; ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);

    // E — Shadow-side color shift (warm for hot planets, cool for icy ones)
    const isWarm = rC > gC;
    const shiftR = isWarm ? Math.max(0, rC - 60)  : Math.max(0, rC - 80);
    const shiftG = isWarm ? Math.max(0, gC - 100) : Math.max(0, gC - 60);
    const shiftB = isWarm ? Math.min(255, bC + 30) : Math.min(255, bC + 50);
    const cs = ctx.createRadialGradient(
      px + radius * 0.55, py + radius * 0.45, 0,
      px + radius * 0.2,  py + radius * 0.2,  radius * 1.55
    );
    cs.addColorStop(0,   `rgba(${shiftR},${shiftG},${shiftB},${0.45 * alpha})`);
    cs.addColorStop(0.45,`rgba(${shiftR},${shiftG},${shiftB},${0.18 * alpha})`);
    cs.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = cs; ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);

    // Specular highlight
    const hlG = ctx.createRadialGradient(px - radius*0.34, py - radius*0.34, 0, px - radius*0.34, py - radius*0.34, radius * 0.52);
    hlG.addColorStop(0, `rgba(255,255,255,${0.62 * alpha})`);
    hlG.addColorStop(0.45, `rgba(255,255,255,${0.18 * alpha})`);
    hlG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlG; ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);

    ctx.restore();

    // C — Atmospheric rim glow (rendered outside clip so it halos the edge)
    const rim = ctx.createRadialGradient(px, py, radius * 0.84, px, py, radius * 1.22);
    rim.addColorStop(0,    'rgba(0,0,0,0)');
    rim.addColorStop(0.65, `rgba(${rC},${gC},${bC},${0.10 * alpha})`);
    rim.addColorStop(1,    `rgba(${rC},${gC},${bC},${0.42 * alpha})`);
    ctx.beginPath(); ctx.arc(px, py, radius * 1.22, 0, Math.PI * 2);
    ctx.fillStyle = rim; ctx.fill();
  }

// ────────────────────────────────────
  // FRAME LOOP
  // ────────────────────────────────────
  let cachedBg = null, cachedBgW = 0, cachedBgH = 0;
  let bhVisible = true;
  const bhIO = new IntersectionObserver(entries => {
    bhVisible = entries[0].isIntersecting;
    if (bhVisible) requestAnimationFrame(frame);
  }, { threshold: 0 });
  bhIO.observe(canvas);

  let lastFrameTime = 0;
  function frame(now) {
    if (!bhVisible) return;
    const minGap = opts.lensing ? 16 : 33; // desktop ~60fps, mobile ~30fps
    if (now - lastFrameTime < minGap) { requestAnimationFrame(frame); return; }
    lastFrameTime = now;
    t += .009 * (opts.speedMult || 1); fc++;
    W = canvas.width; H = canvas.height;
    useLensing = opts.lensing === true; // re-check each frame so resize switches paths
    const sb = useLensing ? 1 : 0;     // shadowBlur multiplier: 0 on mobile = big perf win
    const pad = W * 0.05;              // bounds margin for offscreen culling

    // Rebuild LUT if canvas was resized or lensing just turned on
    if (useLensing && (W !== lastW || H !== lastH || !lut)) {
      lastW = W; lastH = H;
      buildLUT();
    }

    ctx.clearRect(0, 0, W, H);

    const ox   = W * .5;
    const oy   = H * (opts.originY || .88);
    const sR   = W * (opts.sphereR || .072);
    const maxR = W * (opts.maxR || .65);
    const minR = sR * 2.4;
    const colS  = opts.collapseOrbitScale !== undefined ? opts.collapseOrbitScale : 1;
    const discA = opts.discAlpha          !== undefined ? opts.discAlpha          : 1;
    const sphA  = opts.sphereAlpha        !== undefined ? opts.sphereAlpha        : 1;

    // ── Background gradient — cached, only rebuild on resize ──
    if (!cachedBg || W !== cachedBgW || H !== cachedBgH) {
      cachedBg = ctx.createLinearGradient(0, 0, 0, H);
      cachedBg.addColorStop(0,    'rgba(1,2,5,1)');
      cachedBg.addColorStop(0.30, 'rgba(2,6,16,1)');
      cachedBg.addColorStop(0.58, 'rgba(3,11,26,1)');
      cachedBg.addColorStop(0.72, 'rgba(2,9,20,0.92)');
      cachedBg.addColorStop(0.84, 'rgba(2,7,14,0.65)');
      cachedBg.addColorStop(0.93, 'rgba(2,6,10,0.28)');
      cachedBg.addColorStop(1,    'rgba(2,6,8,0)');
      cachedBgW = W; cachedBgH = H;
    }
    ctx.fillStyle = cachedBg; ctx.fillRect(0, 0, W, H);

    // ── Star field — gradient-masked, no hard clip edge ──
    if (useLensing) {
      if (fc % 3 === 0) {
        renderStarsToOsc(); applyLensing();
        // Soft gradient mask: fade stars to transparent approaching horizon
        const lw = lensed.width, lh = lensed.height;
        const oyS = lh * (oy / H);
        lensedCtx.globalCompositeOperation = 'destination-in';
        const starMask = lensedCtx.createLinearGradient(0, oyS * 0.48, 0, oyS);
        starMask.addColorStop(0, 'rgba(0,0,0,1)');
        starMask.addColorStop(1, 'rgba(0,0,0,0)');
        lensedCtx.fillStyle = starMask;
        lensedCtx.fillRect(0, 0, lw, lh);
        lensedCtx.globalCompositeOperation = 'source-over';
      }
      if (lut) ctx.drawImage(lensed, 0, 0, W, H);
    } else {
      // Plain stars — reuse persistent canvas, avoids GC thrash every frame
      if (plainStars.width !== W || plainStars.height !== H) {
        plainStars.width = W; plainStars.height = H;
      }
      plainCtx.clearRect(0, 0, W, H);
      nebulae.forEach(n => {
        n.phase += n.speed;
        const pulse = 1 + Math.sin(n.phase) * .08;
        const g = plainCtx.createRadialGradient(n.nx*W, n.ny*H, 0, n.nx*W, n.ny*H, n.rnx*W*pulse);
        g.addColorStop(0, `rgba(${n.color},${.08 + Math.sin(n.phase)*.02})`);
        g.addColorStop(1, `rgba(${n.color},0)`);
        plainCtx.save(); plainCtx.scale(1, n.rny / n.rnx);
        plainCtx.beginPath(); plainCtx.arc(n.nx*W, n.ny*H*(n.rnx/n.rny), n.rnx*W*pulse, 0, Math.PI*2);
        plainCtx.fillStyle = g; plainCtx.fill(); plainCtx.restore();
      });
      stars.forEach(s => {
        s.phase += s.speed;
        const a = s.a * (.4 + Math.sin(s.phase) * .6);
        plainCtx.beginPath(); plainCtx.arc(s.nx * W, s.ny * H, s.r, 0, Math.PI * 2);
        plainCtx.fillStyle = `rgba(255,255,255,${a})`; plainCtx.fill();
      });
      plainCtx.globalCompositeOperation = 'destination-in';
      const sm = plainCtx.createLinearGradient(0, oy * 0.48, 0, oy);
      sm.addColorStop(0, 'rgba(0,0,0,1)'); sm.addColorStop(1, 'rgba(0,0,0,0)');
      plainCtx.fillStyle = sm; plainCtx.fillRect(0, 0, W, H);
      plainCtx.globalCompositeOperation = 'source-over';
      ctx.drawImage(plainStars, 0, 0);
    }

    // Clip remaining effects (constellations, shooters, plasma) above horizon
    ctx.save();
    ctx.globalAlpha = Math.max(discA, sphA);
    ctx.beginPath();
    ctx.rect(0, 0, W, oy + 4);
    ctx.clip();

    // ── Constellations ──
    constellations.forEach(pts => {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 160) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${(1 - d / 160) * .1})`; ctx.lineWidth = .5; ctx.stroke();
          }
        }
        pts[i].phase += .006;
        const a = .5 + Math.sin(pts[i].phase) * .3;
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${a})`;
        ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(0,212,255,.7)';
        ctx.fill(); ctx.shadowBlur = 0;
      }
    });

    // ── Shooting stars ──
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i]; s.x += s.vx; s.y += s.vy; s.life -= s.decay;
      if (s.life <= 0 || s.x > W + 50) { shooters.splice(i, 1); continue; }
      const g = ctx.createLinearGradient(s.x - s.vx * 16, s.y - s.vy * 16, s.x, s.y);
      g.addColorStop(0, `rgba(${s.color},0)`);
      g.addColorStop(1, `rgba(255,255,255,${s.life})`);
      ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = `rgba(${s.color},.9)`;
      ctx.strokeStyle = g; ctx.lineWidth = 1.5 * s.life;
      ctx.beginPath(); ctx.moveTo(s.x - s.vx * 16, s.y - s.vy * 16); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(s.x, s.y, 2 * s.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.life})`; ctx.fill();
      ctx.restore();
    }


    // ── Plasma energy blobs — (04) screen compositing ──
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 8; i++) {
      const angle = i * .785 + t * (.112 + i * .00616) * (i % 2 === 0 ? 1 : -1);
      const dist  = minR + (maxR - minR) * (.22 + Math.sin(t * .6 + i * .8) * .16);
      const bx    = ox + Math.cos(angle) * dist;
      const by    = oy + Math.sin(angle) * dist * .38;
      const sz    = sR * (.85 + Math.sin(t * .8 + i) * .3);
      const col   = i % 2 === 0 ? '255,80,0' : '0,160,255';
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, sz);
      g.addColorStop(0, `rgba(${col},${.16 + Math.sin(t + i) * .05})`);
      g.addColorStop(.5, `rgba(${col},.07)`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.beginPath(); ctx.arc(bx, by, sz, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();



    // Remove clip — sphere, glow, and particles render freely below the horizon
    ctx.restore();

    // ── Ground energy pool + halo — fade with everything during collapse ──
    const glowA = Math.max(discA, sphA);
    ctx.save(); ctx.globalAlpha = glowA;

    const pool = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * .6);
    pool.addColorStop(0,   `rgba(0,80,160,${.15 + Math.sin(t * .7) * .03})`);
    pool.addColorStop(.18, `rgba(0,50,120,${.10 + Math.sin(t * .5) * .02})`);
    pool.addColorStop(.4,  `rgba(0,150,255,${.06 + Math.sin(t * .4) * .01})`);
    pool.addColorStop(.7,  'rgba(0,60,180,.02)');
    pool.addColorStop(1,   'rgba(0,10,40,0)');
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);

    // ── Extended blue halo — behind entire graphic, outside clip ──
    const halo = ctx.createRadialGradient(ox, oy, sR * 1.2, ox, oy, W * 0.82);
    halo.addColorStop(0,    `rgba(0,100,220,${0.10 + Math.sin(t * 0.4) * 0.02})`);
    halo.addColorStop(0.18, `rgba(0,80,200,${0.08 + Math.sin(t * 0.3) * 0.01})`);
    halo.addColorStop(0.38, `rgba(10,60,180,${0.05 + Math.sin(t * 0.5) * 0.01})`);
    halo.addColorStop(0.62, `rgba(5,30,120,0.02)`);
    halo.addColorStop(1,    'rgba(0,10,40,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

    ctx.restore();

    // ── Disc / rings alpha (collapsed or fading) ──
    ctx.save(); ctx.globalAlpha = discA;

    // ── Rings back half (behind sphere) — top arc only ──
    fullRings.forEach((fr, i) => {
      fr.hotAngle += fr.hotSpeed;
      const r      = (minR + (maxR - minR) * fr.radiusFrac) * colS;
      const bright = .12 + (5 - i) * .022;
      const rC     = fr.isOrange ? 255 : 30;
      const gC     = fr.isOrange ? 110 : 180;
      const bC     = fr.isOrange ? 20  : 255;
      const rOval  = r * (1 + Math.sin(t * .6 + i * .5) * .01);
      ctx.save();
      ctx.shadowBlur  = 14 * bright * sb;
      ctx.shadowColor = `rgba(${rC},${gC},${bC},${bright * .7})`;
      ctx.strokeStyle = `rgba(${rC},${gC},${bC},${bright * .3})`;
      ctx.lineWidth   = 1.5 + bright * 3;
      ctx.beginPath(); ctx.ellipse(ox, oy, rOval, rOval * 0.34, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    const numRings = 11;
    for (let i = 0; i < numRings; i++) {
      const pct        = i / (numRings - 1);
      const r          = (minR + (maxR - minR) * (pct * pct * .8 + pct * .2)) * colS;
      const brightness = Math.pow(1 - pct * .87, 1.3);
      const pulse      = 1 + Math.sin(t * .85 + i * .42) * .016;
      const rC         = Math.round(255 * (1 - pct * .95));
      const gC         = Math.round(200 - pct * 30);
      const bC         = Math.round(90 + pct * 165);
      drawArchRing(ox, oy, r, brightness, rC, gC, bC, pulse);
    }

    // ── Disc back half ──
    const suckB = opts.suckBoost || 1;
    ctx.save(); ctx.globalAlpha = discA * .75;
    disc.forEach(p => {
      p.angle += p.speed * (opts.speedMult || 1); p.phase += .04;
      const px = ox + Math.cos(p.angle) * W * p.r * colS;
      const py = oy + Math.sin(p.angle) * W * p.r * colS * .26;
      if (Math.sin(p.angle) < 0) {
        const heat = p.brightness * (.7 + Math.sin(p.phase) * .3);
        const frac = Math.max(0, Math.min(1, (p.r - (opts.discRBase || .048) + .007) / .08));
        // inner+mid=bright orange, outer=dark blue
        const rC = frac < .65 ? 255 : Math.round(255 * Math.max(0, 1 - (frac - .65) / .35));
        const gC = frac < .65 ? Math.round(130 + 40 * Math.sin(p.phase)) : Math.round((130 + 40 * Math.sin(p.phase)) * Math.max(0, 1 - (frac - .65) / .35));
        const bC = frac < .65 ? Math.round(10 + 10 * Math.sin(p.phase * .7)) : Math.round(10 + (frac - .65) / .35 * 140);
        if (px < -pad || px > W + pad || py < -pad || py > H + pad) return;
        ctx.beginPath(); ctx.arc(px, py, p.size * .7 * (opts.particleMult || 1) * (1 + Math.sin(p.phase) * .3 * (opts.particleVar || 1)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rC},${gC},${bC},${heat * .8})`;
        ctx.shadowBlur = p.size * 5 * sb; ctx.shadowColor = `rgba(${rC},${gC},${bC},.7)`; ctx.fill();
      }
    });
    // ── Inner stream back half ──
    innerStream.forEach(p => {
      p.angle += p.speed * (opts.speedMult || 1); p.phase += .05;
      const px = ox + Math.cos(p.angle) * (sR + W * p.r * colS);
      const py = oy + Math.sin(p.angle) * (sR + W * p.r * colS) * .28;
      if (Math.sin(p.angle) < 0 && px >= -pad && px <= W + pad && py >= -pad && py <= H + pad) {
        const heat = p.brightness * (.6 + Math.sin(p.phase) * .4);
        const sz = p.size * (opts.particleMult || 1) * (.6 + Math.sin(p.phase) * .3 * (opts.particleVar || 1));
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(140 + Math.sin(p.phase) * 20)},20,${heat * .85})`;
        ctx.shadowBlur = sz * 4 * sb; ctx.shadowColor = `rgba(255,120,0,.8)`; ctx.fill();
      }
    });
    innerStreamBlue.forEach(p => {
      p.angle += p.speed * (opts.speedMult || 1); p.phase += .045;
      const px = ox + Math.cos(p.angle) * (sR + W * p.r * colS);
      const py = oy + Math.sin(p.angle) * (sR + W * p.r * colS) * .28;
      if (Math.sin(p.angle) < 0 && px >= -pad && px <= W + pad && py >= -pad && py <= H + pad) {
        const heat = p.brightness * (.6 + Math.sin(p.phase) * .4);
        const sz = p.size * (opts.particleMult || 1) * (.6 + Math.sin(p.phase) * .3 * (opts.particleVar || 1));
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(130 + Math.sin(p.phase) * 25)},10,${heat * .85})`;
        ctx.shadowBlur = sz * 4 * sb; ctx.shadowColor = `rgba(255,110,0,.8)`; ctx.fill();
      }
    });
    outerStreamBlue.forEach(p => {
      p.angle += p.speed * (opts.speedMult || 1) * suckB; p.phase += .035;
      const px = ox + Math.cos(p.angle) * (sR + W * p.r * colS);
      const py = oy + Math.sin(p.angle) * (sR + W * p.r * colS) * .28;
      if (Math.sin(p.angle) < 0 && px >= -pad && px <= W + pad && py >= -pad && py <= H + pad) {
        const heat = p.brightness * (.5 + Math.sin(p.phase) * .4);
        const sz = p.size * (opts.particleMult || 1) * (.6 + Math.sin(p.phase) * .3 * (opts.particleVar || 1));
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(56 + Math.sin(p.phase)*15)},${Math.round(189 + Math.sin(p.phase)*20)},248,${heat * .8})`;
        ctx.shadowBlur = sz * 4 * sb; ctx.shadowColor = `rgba(40,160,255,.75)`; ctx.fill();
      }
    });
    ctx.restore();

    // ── Planets — update positions (drawn after sphere below) ──
    planets.forEach(p => {
      const baseOrbitR = (minR + (maxR - minR) * p.radiusFrac) * colS;

      // ── Absorption state machine (orange planet only) ──
      if (p.absorbState !== undefined) {
        if (p.absorbState === 'normal') {
          p.absorbTimer--;
          p.angle += p.speed * (opts.speedMult || 1) * suckB;
          if (p.absorbTimer <= 0) {
            p.absorbState = 'falling';
            p.absorbProgress = 0;
            p.absorbBaseAngle = p.angle;
          }
        } else if (p.absorbState === 'falling') {
          p.absorbProgress += 0.00133;
          const speedBoost = 1 + p.absorbProgress * 12;
          p.angle += p.speed * speedBoost * (opts.speedMult || 1);
          if (p.absorbProgress >= 1) {
            p.absorbState = 'absorbed';
            p.absorbTimer = 55;
            p.absorbFlash = 1.0;
            p.absorbRipples = [{ r: sR, a: 1.0 }];
            p.trailHistory = [];
          }
        } else if (p.absorbState === 'absorbed') {
          p.absorbTimer--;
          p.absorbFlash = Math.max(0, p.absorbFlash - 0.045);
          p.absorbRipples.forEach(rp => { rp.r += sR * 0.12; rp.a -= 0.035; });
          p.absorbRipples = p.absorbRipples.filter(rp => rp.a > 0);
          if (p.absorbTimer <= 0) {
            p.absorbState = 'reforming';
            p.absorbProgress = 0;
            p.angle = p.absorbBaseAngle;
          }
        } else if (p.absorbState === 'reforming') {
          p.absorbProgress += 0.003;
          p.angle += p.speed * (opts.speedMult || 1);
          if (p.absorbProgress >= 1) {
            p.absorbState = 'normal';
            p.absorbTimer = 480 + Math.random() * 360;
            p.absorbProgress = 0;
          }
        }

        const prog = p.absorbProgress;
        let orbitR = baseOrbitR;
        if (p.absorbState === 'falling')  orbitR = baseOrbitR * (1 - Math.pow(prog, 1.6));
        if (p.absorbState === 'absorbed') orbitR = 0;

        p._x = ox + Math.cos(p.angle) * orbitR;
        p._y = oy + Math.sin(p.angle) * orbitR * 0.34;
        p._radius = sR * p.sizeF * (p.absorbState === 'falling' ? (0.3 + 0.7 * (1 - prog)) : 1);
        p._hidden = p.absorbState === 'absorbed';
        p._reformAlpha = p.absorbState === 'reforming' ? Math.pow(prog, 0.5) : 1;

        if (p.trail && !p._hidden) {
          p.trailHistory.push({ x: p._x, y: p._y });
          if (p.trailHistory.length > (p.absorbState === 'falling' ? 52 : 32)) p.trailHistory.shift();
        }
      } else {
        p.angle += p.speed * (opts.speedMult || 1) * suckB;
        p._x = ox + Math.cos(p.angle) * baseOrbitR;
        p._y = oy + Math.sin(p.angle) * baseOrbitR * 0.34;
        p._radius = sR * p.sizeF;
        if (p.trail) {
          p.trailHistory.push({ x: p._x, y: p._y });
          if (p.trailHistory.length > 32) p.trailHistory.shift();
        }
      }
      p._inFront = Math.sin(p.angle) >= 0;
    });

    ctx.restore(); // end discA

    // ── Sphere alpha ──
    ctx.save(); ctx.globalAlpha = sphA;

    // ── Photon ring glow — enlarged and brighter ──
    const gs = opts.glowScale || 1;
    const pg = ctx.createRadialGradient(ox, oy, sR * .6 * gs, ox, oy, sR * 2.8 * gs);
    pg.addColorStop(0,   `rgba(255,160,40,${.95 + Math.sin(t * 2) * .05})`);
    pg.addColorStop(.18, `rgba(255,120,10,${.8 + Math.sin(t * 1.6) * .1})`);
    pg.addColorStop(.45, `rgba(220,80,0,${.45 + Math.sin(t) * .06})`);
    pg.addColorStop(.72, `rgba(140,40,0,${.18})`);
    pg.addColorStop(1,   'rgba(80,20,0,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR * 2.8 * gs, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();

    // ── Pulse rings ──
    if (opts._pulseRings && opts._pulseRings.length) {
      const now = performance.now();
      for (let i = opts._pulseRings.length - 1; i >= 0; i--) {
        const ring = opts._pulseRings[i];
        const elapsed = now - ring.startT;
        if (elapsed < 0) continue;
        const p = elapsed / ring.duration;
        if (p >= 1) { opts._pulseRings.splice(i, 1); continue; }
        const radius = sR * 1.1 + p * W * 0.38;
        const opacity = (1 - p) * (1 - p) * 0.7;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.ellipse(ox, oy, radius, radius * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,160,50,${opacity})`;
        ctx.lineWidth = 2.5 * (1 - p);
        ctx.shadowBlur = 18 * (1 - p);
        ctx.shadowColor = `rgba(255,130,20,${opacity})`;
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Solar flares ──
    for (let i = flares.length - 1; i >= 0; i--) {
      const fl = flares[i];
      const elapsed = t - fl.startT;
      if (elapsed > fl.duration) { flares.splice(i, 1); continue; }
      const progress  = elapsed / fl.duration;
      const opacity   = Math.sin(progress * Math.PI) * (1 - progress * .25);
      const flareLen  = sR * fl.lengthMult * Math.sin(progress * Math.PI);
      const ax = Math.cos(fl.angle), ay = Math.sin(fl.angle);
      const px = -ay, py = ax;
      const baseW  = sR * fl.spread * (1 - progress * .5);
      const tipX   = ox + ax * (sR + flareLen), tipY = oy + ay * (sR + flareLen);
      const b1x    = ox + ax * sR * .95 + px * baseW, b1y = oy + ay * sR * .95 + py * baseW;
      const b2x    = ox + ax * sR * .95 - px * baseW, b2y = oy + ay * sR * .95 - py * baseW;
      // Organic control points: each side curves independently
      const cpDist = sR + flareLen * fl.cpPos;
      const cp1x   = ox + ax * cpDist + px * baseW * fl.curl1;
      const cp1y   = oy + ay * cpDist + py * baseW * fl.curl1;
      const cp2x   = ox + ax * cpDist - px * baseW * fl.curl2;
      const cp2y   = oy + ay * cpDist - py * baseW * fl.curl2;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const fg = ctx.createLinearGradient(ox + ax * sR, oy + ay * sR, tipX, tipY);
      fg.addColorStop(0,   `rgba(255,210,90,${opacity * .95})`);
      fg.addColorStop(.25, `rgba(255,150,30,${opacity * .75})`);
      fg.addColorStop(.65, `rgba(255,80,0,${opacity * .4})`);
      fg.addColorStop(1,   'rgba(255,40,0,0)');
      ctx.shadowBlur  = sR * .9;
      ctx.shadowColor = `rgba(255,130,20,${opacity * .65})`;
      // Draw organic curved flare shape using quadratic bezier sides
      ctx.beginPath();
      ctx.moveTo(b1x, b1y);
      ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
      ctx.quadraticCurveTo(cp2x, cp2y, b2x, b2y);
      ctx.closePath();
      ctx.fillStyle = fg;
      ctx.fill();
      // Secondary wispy strand — thinner, slightly offset
      const wisp = 0.35 + Math.random() * 0.15;
      const wTipX = ox + ax * (sR + flareLen * (0.7 + fl.cpPos * 0.4)) + px * baseW * fl.curl1 * 0.5;
      const wTipY = oy + ay * (sR + flareLen * (0.7 + fl.cpPos * 0.4)) + py * baseW * fl.curl1 * 0.5;
      const wg = ctx.createLinearGradient(ox + ax * sR, oy + ay * sR, wTipX, wTipY);
      wg.addColorStop(0,   `rgba(255,200,80,${opacity * .4})`);
      wg.addColorStop(1,   'rgba(255,60,0,0)');
      ctx.beginPath();
      ctx.moveTo(ox + ax * sR * .95 + px * baseW * .3, oy + ay * sR * .95 + py * baseW * .3);
      ctx.quadraticCurveTo(cp1x + px * baseW * .4, cp1y + py * baseW * .4, wTipX, wTipY);
      ctx.lineWidth = baseW * wisp;
      ctx.strokeStyle = wg;
      ctx.stroke();
      ctx.restore();
    }

    // Inner orange haze — tight warm band right at the event horizon
    const ih = ctx.createRadialGradient(ox, oy, sR * .92 * gs, ox, oy, sR * 1.45 * gs);
    ih.addColorStop(0,   `rgba(255,200,100,${.6 + Math.sin(t * 2.5) * .12})`);
    ih.addColorStop(.4,  `rgba(255,150,30,${.4 + Math.sin(t * 1.8) * .08})`);
    ih.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR * 1.45 * gs, 0, Math.PI * 2); ctx.fillStyle = ih; ctx.fill();

    ctx.save();
    ctx.shadowBlur = 52; ctx.shadowColor = `rgba(255,140,20,${.98 + Math.sin(t * 2) * .02})`;
    ctx.strokeStyle = `rgba(255,160,50,${.9 + Math.sin(t * 2.2) * .1})`;
    ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.arc(ox, oy, sR * 1.02, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // ── Black sphere ──
    // Base: deep shadow on lower-right, slightly lighter upper-left for depth
    const sG = ctx.createRadialGradient(ox - sR * .38, oy - sR * .38, sR * .02, ox + sR * .2, oy + sR * .2, sR * 1.05);
    sG.addColorStop(0,   'rgba(22,14,8,1)');
    sG.addColorStop(.35, 'rgba(8,5,3,1)');
    sG.addColorStop(.75, 'rgba(2,1,1,1)');
    sG.addColorStop(1,   'rgba(0,0,0,1)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2); ctx.fillStyle = sG; ctx.fill();

    // Rim light — orange from disc on lower edge, blue on upper-left
    ctx.save();
    ctx.clip();
    const rimO = ctx.createRadialGradient(ox, oy + sR * .72, sR * .3, ox, oy + sR * .72, sR * 1.1);
    rimO.addColorStop(0, 'rgba(255,110,20,.55)');
    rimO.addColorStop(.5, 'rgba(255,60,0,.18)');
    rimO.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2);
    ctx.fillStyle = rimO; ctx.fill();

    const rimB = ctx.createRadialGradient(ox - sR * .7, oy - sR * .55, 0, ox - sR * .7, oy - sR * .55, sR * 1.1);
    rimB.addColorStop(0, 'rgba(0,200,255,.22)');
    rimB.addColorStop(.5, 'rgba(0,150,220,.08)');
    rimB.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2);
    ctx.fillStyle = rimB; ctx.fill();

    // Specular highlight — orbits slowly to simulate spin
    const spinAngle = t * 0.25;
    const specX = ox + Math.cos(spinAngle) * sR * 0.42;
    const specY = oy + Math.sin(spinAngle) * sR * 0.28; // elliptical (perspective foreshortening)
    const spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, sR * .38);
    spec.addColorStop(0,   'rgba(180,230,255,.2)');
    spec.addColorStop(.45, 'rgba(100,180,255,.07)');
    spec.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2);
    ctx.fillStyle = spec; ctx.fill();

    ctx.restore();

    ctx.restore(); // end sphA
    ctx.save(); ctx.globalAlpha = discA;

    // ── Disc front half ──
    ctx.save();
    disc.forEach(p => {
      const px = ox + Math.cos(p.angle) * W * p.r * colS;
      const py = oy + Math.sin(p.angle) * W * p.r * colS * .26;
      if (Math.sin(p.angle) >= 0) {
        const heat = p.brightness * (.7 + Math.sin(p.phase) * .3);
        const frac = Math.max(0, Math.min(1, (p.r - (opts.discRBase || .048) + .007) / .08));
        // inner+mid=bright orange, outer=dark blue
        const rC = frac < .65 ? 255 : Math.round(255 * Math.max(0, 1 - (frac - .65) / .35));
        const gC = frac < .65 ? Math.round(130 + 40 * Math.sin(p.phase)) : Math.round((130 + 40 * Math.sin(p.phase)) * Math.max(0, 1 - (frac - .65) / .35));
        const bC = frac < .65 ? Math.round(10 + 10 * Math.sin(p.phase * .7)) : Math.round(10 + (frac - .65) / .35 * 140);
        if (px < -pad || px > W + pad || py < -pad || py > H + pad) return;
        ctx.beginPath(); ctx.arc(px, py, p.size * .7 * (opts.particleMult || 1) * (1 + Math.sin(p.phase) * .3 * (opts.particleVar || 1)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rC},${gC},${bC},${heat})`;
        ctx.shadowBlur = p.size * 5 * sb; ctx.shadowColor = `rgba(${rC},${gC},${bC},.8)`; ctx.fill();
      }
    });
    // ── Inner stream front half ──
    innerStream.forEach(p => {
      const px = ox + Math.cos(p.angle) * (sR + W * p.r * colS);
      const py = oy + Math.sin(p.angle) * (sR + W * p.r * colS) * .28;
      if (Math.sin(p.angle) >= 0 && px >= -pad && px <= W + pad && py >= -pad && py <= H + pad) {
        const heat = p.brightness * (.6 + Math.sin(p.phase) * .4);
        const sz = p.size * (opts.particleMult || 1) * (.6 + Math.sin(p.phase) * .3 * (opts.particleVar || 1));
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(140 + Math.sin(p.phase) * 20)},20,${heat})`;
        ctx.shadowBlur = sz * 4 * sb; ctx.shadowColor = `rgba(255,120,0,.9)`; ctx.fill();
      }
    });
    innerStreamBlue.forEach(p => {
      const px = ox + Math.cos(p.angle) * (sR + W * p.r * colS);
      const py = oy + Math.sin(p.angle) * (sR + W * p.r * colS) * .28;
      if (Math.sin(p.angle) >= 0 && px >= -pad && px <= W + pad && py >= -pad && py <= H + pad) {
        const heat = p.brightness * (.6 + Math.sin(p.phase) * .4);
        const sz = p.size * (opts.particleMult || 1) * (.6 + Math.sin(p.phase) * .3 * (opts.particleVar || 1));
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(130 + Math.sin(p.phase) * 25)},10,${heat})`;
        ctx.shadowBlur = sz * 4 * sb; ctx.shadowColor = `rgba(255,110,0,.9)`; ctx.fill();
      }
    });
    outerStreamBlue.forEach(p => {
      const px = ox + Math.cos(p.angle) * (sR + W * p.r * colS);
      const py = oy + Math.sin(p.angle) * (sR + W * p.r * colS) * .28;
      if (Math.sin(p.angle) >= 0 && px >= -pad && px <= W + pad && py >= -pad && py <= H + pad) {
        const heat = p.brightness * (.5 + Math.sin(p.phase) * .4);
        const sz = p.size * (opts.particleMult || 1) * (.6 + Math.sin(p.phase) * .3 * (opts.particleVar || 1));
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(56 + Math.sin(p.phase)*15)},${Math.round(189 + Math.sin(p.phase)*20)},248,${heat})`;
        ctx.shadowBlur = sz * 4 * sb; ctx.shadowColor = `rgba(40,160,255,.8)`; ctx.fill();
      }
    });
    ctx.restore();


    // ── Rings front half (in front of sphere) — bottom arc only ──
    fullRings.forEach((fr, i) => {
      const r      = (minR + (maxR - minR) * fr.radiusFrac) * colS;
      const bright = .12 + (5 - i) * .022;
      const rC     = fr.isOrange ? 255 : 30;
      const gC     = fr.isOrange ? 110 : 180;
      const bC     = fr.isOrange ? 20  : 255;
      const rOval  = r * (1 + Math.sin(t * .6 + i * .5) * .01);
      ctx.save();
      ctx.shadowBlur  = 14 * bright * sb;
      ctx.shadowColor = `rgba(${rC},${gC},${bC},${bright * .7})`;
      ctx.strokeStyle = `rgba(${rC},${gC},${bC},${bright * .3})`;
      ctx.lineWidth   = 1.5 + bright * 3;
      ctx.beginPath(); ctx.ellipse(ox, oy, rOval, rOval * 0.34, 0, 0, Math.PI); ctx.stroke();
      ctx.restore();
      // Hot spot front half only
      if (Math.sin(fr.hotAngle) > 0) {
        const hx = ox + Math.cos(fr.hotAngle) * r;
        const hy = oy + Math.sin(fr.hotAngle) * r * .44;
        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * .25);
        hg.addColorStop(0, `rgba(255,255,255,${bright * 1.1})`);
        hg.addColorStop(.4, `rgba(${rC},${gC},${bC},${bright * .55})`);
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath(); ctx.arc(hx, hy, r * .25, 0, Math.PI * 2);
        ctx.fillStyle = hg; ctx.fill();
        ctx.restore();
      }
    });
    for (let i = 0; i < numRings; i++) {
      const pct        = i / (numRings - 1);
      const r          = (minR + (maxR - minR) * (pct * pct * .8 + pct * .2)) * colS;
      const brightness = Math.pow(1 - pct * .87, 1.3) * 0.6;
      const pulse      = 1 + Math.sin(t * .85 + i * .42) * .016;
      const rC         = Math.round(255 * (1 - pct * .95));
      const gC         = Math.round(200 - pct * 30);
      const bC         = Math.round(90 + pct * 165);
      const rr = r * pulse; const ry = rr * 0.34;
      ctx.save();
      ctx.strokeStyle = `rgba(${rC},${gC},${bC},${brightness * .4})`;
      ctx.lineWidth = 6 * brightness + 1.5;
      ctx.shadowBlur = 20 * brightness;
      ctx.shadowColor = `rgba(${rC},${gC},${bC},${brightness * .8})`;
      ctx.beginPath(); ctx.ellipse(ox, oy, rr, ry, 0, 0, Math.PI); ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end discA

    // ── Planets — render all with perspective size + opacity scaling ──
    ctx.save(); ctx.globalAlpha = discA;
    planets.forEach((p) => {
      const sinA = Math.sin(p.angle);
      const depthScale = 1.0 + sinA * 0.4;
      const alpha = (0.72 + (sinA + 1) * 0.14) * (p._reformAlpha !== undefined ? p._reformAlpha : 1);
      const r = p._radius * depthScale;
      // Absorption flash + ripples
      if (p.absorbFlash > 0) {
        const fg = ctx.createRadialGradient(ox, oy, 0, ox, oy, sR * 4);
        fg.addColorStop(0,   `rgba(255,200,80,${p.absorbFlash})`);
        fg.addColorStop(0.3, `rgba(255,120,20,${p.absorbFlash * 0.6})`);
        fg.addColorStop(1,   'rgba(255,80,0,0)');
        ctx.beginPath(); ctx.arc(ox, oy, sR * 4, 0, Math.PI * 2);
        ctx.fillStyle = fg; ctx.fill();
      }
      if (p.absorbRipples) {
        p.absorbRipples.forEach(rp => {
          ctx.save();
          ctx.beginPath(); ctx.ellipse(ox, oy, rp.r, rp.r * 0.34, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,160,40,${rp.a})`;
          ctx.lineWidth = 2; ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(255,120,20,0.8)';
          ctx.stroke(); ctx.restore();
        });
      }

      if (p._hidden) return;

      if (p.trail) {
        const isFalling = p.absorbState === 'falling';
        p.trailHistory.forEach((pt, i) => {
          const ageFrac = i / p.trailHistory.length;
          const a = ageFrac * (isFalling ? 0.9 : 0.7) * alpha;
          const tr = r * (0.15 + 0.85 * ageFrac);
          ctx.save();
          ctx.beginPath(); ctx.arc(pt.x, pt.y, tr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.rC},${p.gC},${p.bC},${a})`;
          ctx.shadowBlur = tr * (isFalling ? 10 : 5);
          ctx.shadowColor = `rgba(${p.rC},${p.gC},${p.bC},${a * 0.6})`;
          ctx.fill(); ctx.restore();
        });
      }
      // H — Ring back half (behind planet)
      if (p.ring) drawPlanetRing(ctx, p._x, p._y, r, p.rC, p.gC, p.bC, alpha, false, p.ringScale);
      if (p.glow) drawPlanetGlow(ctx, p._x, p._y, r, p.rC, p.gC, p.bC, alpha);

      // Spaghettification stretch toward black hole during fall
      const isSpaghetti = p.absorbState === 'falling' && p.absorbProgress > 0.08;
      if (isSpaghetti) {
        const prog = p.absorbProgress;
        const stretchAmt = 1 + prog * prog * 4.5;
        const squishAmt  = 1 / Math.sqrt(stretchAmt);
        const ang = Math.atan2(oy - p._y, ox - p._x);
        ctx.save();
        ctx.translate(p._x, p._y);
        ctx.rotate(ang);
        ctx.scale(stretchAmt, squishAmt);
        ctx.translate(-p._x, -p._y);
      }
      drawPlanet(ctx, p._x, p._y, r, p.rC, p.gC, p.bC, alpha, t);
      if (isSpaghetti) ctx.restore();

      // H — Ring front half (in front of planet)
      if (p.ring) drawPlanetRing(ctx, p._x, p._y, r, p.rC, p.gC, p.bC, alpha, true, p.ringScale);
    });

    ctx.restore(); // end planets discA

    // ── Collapse blip flash ──
    if (opts._blipFlash > 0) {
      const bf = opts._blipFlash;
      const fg = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * 0.6);
      fg.addColorStop(0,   `rgba(255,240,200,${bf})`);
      fg.addColorStop(0.2, `rgba(255,180,80,${bf * 0.8})`);
      fg.addColorStop(0.5, `rgba(255,100,20,${bf * 0.4})`);
      fg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
    }

    // ── "poof" text — orbits inside sphere with ease-out ──
    if (opts._poofAlpha > 0) {
      const pa = opts._poofAngle || -Math.PI * 0.5;
      const pr = sR * 0.48;
      const px = ox + Math.cos(pa) * pr;
      const py = oy + Math.sin(pa) * pr * 0.55;
      ctx.save();
      ctx.globalAlpha = opts._poofAlpha;
      ctx.font = `italic 400 11px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,160,40,1)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255,120,0,0.7)';
      ctx.fillText('poof', px, py);
      ctx.restore();
    }

    // ── Top fade ──
    const fade = ctx.createLinearGradient(0, 0, 0, H * .4);
    fade.addColorStop(0, 'rgba(1,2,5,.85)'); fade.addColorStop(.55, 'rgba(1,2,5,.18)'); fade.addColorStop(1, 'rgba(1,2,5,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);

requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}


/* ── BLACK HOLE COLLAPSE EVENT ── */
(function(){
  const canvas = document.getElementById('bhCanvas');
  if (!canvas) return;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * bhOpts.originY;
    const sr = rect.width * bhOpts.sphereR;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    canvas.style.cursor = Math.hypot(dx, dy) <= sr * 1.4 ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', (e) => {
    if (bhOpts._warping) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * bhOpts.originY;
    const sr = rect.width * bhOpts.sphereR;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    if (Math.hypot(dx, dy) > sr * 1.4) return;

    if (!bhOpts._pulseRings) bhOpts._pulseRings = [];
    for (let i = 0; i < 4; i++)
      bhOpts._pulseRings.push({ startT: performance.now() + i * 180, duration: 1400 });

    bhOpts._warping = true;
    bhOpts._blipFlash = 0;

    // Phase durations (ms)
    const RAMP_UP    = 5000;
    const SUCK_IN    = 3000;
    const BLIP       = 400;
    const DARK       = 6000;
    const SPHERE_IN  = 5000;
    const FULL_IN    = 7000;

    const start = performance.now();

    (function tick(now) {
      const e = now - start;

      if (e < RAMP_UP) {
        // Speed ramps to 30x; outer elements get extra boost
        const p = e / RAMP_UP;
        bhOpts.speedMult  = 1 + p * p * 29;
        bhOpts.suckBoost  = 1 + p * p * 7;   // 1→8x extra for planets + outer blue
        requestAnimationFrame(tick);

      } else if (e < RAMP_UP + SUCK_IN) {
        // Everything spirals inward, fades out
        const p = (e - RAMP_UP) / SUCK_IN;
        bhOpts.speedMult          = 30;
        bhOpts.suckBoost          = 8 + p * 4; // 8→12x extra during suck-in
        bhOpts.collapseOrbitScale = 1 - Math.pow(p, 1.4);
        bhOpts.discAlpha          = 1 - p;
        bhOpts.sphereAlpha        = 1;
        requestAnimationFrame(tick);

      } else if (e < RAMP_UP + SUCK_IN + BLIP) {
        // Bright flash then blink out
        const p = (e - RAMP_UP - SUCK_IN) / BLIP;
        bhOpts.suckBoost          = 1;
        bhOpts.collapseOrbitScale = 0;
        bhOpts.discAlpha          = 0;
        bhOpts.sphereAlpha        = p < 0.35 ? 1 + (p / 0.35) * 2 : Math.max(0, 1 - (p - 0.35) / 0.65 * 3);
        bhOpts._blipFlash         = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.65);
        requestAnimationFrame(tick);

      } else if (e < RAMP_UP + SUCK_IN + BLIP + DARK) {
        // Everything dark, silence — "poof" fades in then holds
        bhOpts.sphereAlpha = 0; bhOpts._blipFlash = 0;
        bhOpts.speedMult   = 1;
        const dp = (e - RAMP_UP - SUCK_IN - BLIP) / DARK;
        bhOpts._poofAlpha  = dp < 0.25 ? Math.pow(dp / 0.25, 2) : dp > 0.75 ? Math.max(0, 1 - (dp - 0.75) / 0.25) : 1;
        // circular orbit inside sphere, easing out (fast start → slow stop)
        bhOpts._poofAngle  = -Math.PI * 0.5 + Math.PI * 1.5 * (1 - Math.pow(1 - dp, 3));
        requestAnimationFrame(tick);

      } else if (e < RAMP_UP + SUCK_IN + BLIP + DARK + SPHERE_IN) {
        // Sphere fades back in at full size
        const p = (e - RAMP_UP - SUCK_IN - BLIP - DARK) / SPHERE_IN;
        bhOpts.sphereAlpha        = Math.pow(p, 0.6);
        bhOpts.collapseOrbitScale = 1; // keep discs at full orbit so they don't expand on return
        bhOpts._poofAlpha         = 0;
        requestAnimationFrame(tick);

      } else if (e < RAMP_UP + SUCK_IN + BLIP + DARK + SPHERE_IN + FULL_IN) {
        // Everything else fades back in at full size — no expansion, just opacity
        const p = (e - RAMP_UP - SUCK_IN - BLIP - DARK - SPHERE_IN) / FULL_IN;
        bhOpts.sphereAlpha        = 1;
        bhOpts.discAlpha          = Math.pow(p, 0.5);
        bhOpts.collapseOrbitScale = 1; // already at full size, just fading in
        bhOpts._poofAlpha         = 0;
        requestAnimationFrame(tick);

      } else {
        // Done — reset all
        bhOpts.speedMult          = 1;
        bhOpts.suckBoost          = 1;
        bhOpts.collapseOrbitScale = 1;
        bhOpts.discAlpha          = 1;
        bhOpts.sphereAlpha        = 1;
        bhOpts._blipFlash         = 0;
        bhOpts._poofAlpha         = 0;
        bhOpts._warping           = false;
      }
    })(start);
  });
})();

/* ── INIT ── */
const bh = document.getElementById('bhCanvas');

// Mutable opts object — originY is recomputed on resize so sphere center
// always sits exactly on the hero/about section boundary
const bhOpts = { originY: .88, maxR: .43, sphereR: .048, starCount: 200, discCount: 480, shooters: true, lensing: true };

function resizeBH() {
  const heroH  = document.getElementById('hero').offsetHeight || window.innerHeight;
  const mobile = window.innerWidth < 800;
  const ext    = heroH * (mobile ? 0.4 : 0.35);
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
  const cssW = window.innerWidth;
  const cssH = Math.round(heroH + ext);
  bh.width  = Math.round(cssW * dpr);
  bh.height = Math.round(cssH * dpr);
  bh.style.width  = cssW + 'px';
  bh.style.height = cssH + 'px';
  const ctx2d = bh.getContext('2d');
  if (ctx2d) { ctx2d.setTransform(1,0,0,1,0,0); ctx2d.scale(dpr, dpr); }
  bhOpts.originY  = (heroH * (mobile ? 0.86 : 0.80)) / bh.height;
  bhOpts.sphereR       = mobile ? 0.085 : 0.048;
  bhOpts.maxR          = mobile ? 0.72  : 0.43;
  bhOpts.glowScale     = mobile ? 0.80  : 1.0;
  bhOpts.discRBase     = mobile ? 0.14  : 0.048;
  bhOpts.discLayerStep = mobile ? 0.16  : 0.045;
  bhOpts.discSizeScale = mobile ? 0.85  : 1.0;
  bhOpts.discCount     = mobile ? 160   : 300;
  bhOpts.starCount     = mobile ? 80    : 200;
  bhOpts.particleMult  = mobile ? 0.75  : 1.0;
  bhOpts.particleVar   = mobile ? 1.0   : 1.0;
  bhOpts.shooters      = !mobile;
  bhOpts.lensing       = !mobile; // pixel-by-pixel GPU readback is too slow on mobile
}
resizeBH();
window.addEventListener('resize', resizeBH);
drawPortal(bh, bhOpts);

