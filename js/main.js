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
      speed: (.00196 + Math.random() * .0014) * (layer % 2 === 0 ? 1 : -1) * (1 - layer * .15),
      r: (opts.discRBase || .048) + layer * .022 + (Math.random() - .5) * .014,
      size: (1.2 + Math.random() * 3.6) * (opts.discSizeScale || 1),
      brightness: .3 + Math.random() * .7,
      layer, phase: Math.random() * Math.PI * 2
    };
  });

  // ── CSS-style full rotating rings with orbiting hot spots ──
  const fullRings = Array.from({ length: 5 }, (_, i) => ({
    radiusFrac:  (i === 0 ? .025 : .05 + i * .08),
    hotAngle:    Math.random() * Math.PI * 2,
    hotSpeed:    (.003 + Math.random() * .004) * (Math.random() > .5 ? 1 : -1),
    isOrange:    i % 2 === 0
  }));

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
  const useLensing = opts.lensing === true;
  let osc, octx, lensed, lensedCtx, lut;
  let lastW = W, lastH = H;

  if (useLensing) {
    osc    = document.createElement('canvas');
    octx   = osc.getContext('2d');
    lensed = document.createElement('canvas');
    lensedCtx = lensed.getContext('2d');
  }

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

  // ────────────────────────────────────
  // FRAME LOOP
  // ────────────────────────────────────
  function frame() {
    t += .009 * (opts.speedMult || 1); fc++;
    W = canvas.width; H = canvas.height;

    // Rebuild LUT if canvas was resized
    if (useLensing && (W !== lastW || H !== lastH)) {
      lastW = W; lastH = H;
      buildLUT();
    }

    ctx.clearRect(0, 0, W, H);

    const ox   = W * .5;
    const oy   = H * (opts.originY || .88);
    const sR   = W * (opts.sphereR || .072);
    const maxR = W * (opts.maxR || .65);
    const minR = sR * 2.4;

    // Clip all background effects above the horizon line
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, oy + 4);
    ctx.clip();

    // ── Background gradient ──
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#010205'); bg.addColorStop(.45, '#020610'); bg.addColorStop(1, '#030b1a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // ── Star field: lensed (01) or plain ──
    if (useLensing) {
      if (fc % 3 === 0) { renderStarsToOsc(); applyLensing(); }
      if (lut) ctx.drawImage(lensed, 0, 0, W, H);
    } else {
      // Plain stars for mini canvas
      nebulae.forEach(n => {
        n.phase += n.speed;
        const pulse = 1 + Math.sin(n.phase) * .08;
        const g = ctx.createRadialGradient(n.nx*W, n.ny*H, 0, n.nx*W, n.ny*H, n.rnx*W*pulse);
        g.addColorStop(0, `rgba(${n.color},${.08 + Math.sin(n.phase)*.02})`);
        g.addColorStop(1, `rgba(${n.color},0)`);
        ctx.save(); ctx.scale(1, n.rny / n.rnx);
        ctx.beginPath(); ctx.arc(n.nx*W, n.ny*H*(n.rnx/n.rny), n.rnx*W*pulse, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill(); ctx.restore();
      });
      stars.forEach(s => {
        s.phase += s.speed;
        const a = s.a * (.4 + Math.sin(s.phase) * .6);
        ctx.beginPath(); ctx.arc(s.nx * W, s.ny * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      });
    }

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

    // ── Ground energy pool ──
    const pool = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * .6);
    pool.addColorStop(0,   `rgba(0,80,160,${.32 + Math.sin(t * .7) * .06})`);
    pool.addColorStop(.18, `rgba(0,50,120,${.20 + Math.sin(t * .5) * .04})`);
    pool.addColorStop(.4,  `rgba(0,150,255,${.13 + Math.sin(t * .4) * .03})`);
    pool.addColorStop(.7,  'rgba(0,60,180,.04)');
    pool.addColorStop(1,   'rgba(0,10,40,0)');
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);

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

    // ── Rings back half (behind sphere) — top arc only ──
    fullRings.forEach((fr, i) => {
      fr.hotAngle += fr.hotSpeed;
      const r      = minR + (maxR - minR) * fr.radiusFrac;
      const bright = .12 + (5 - i) * .022;
      const rC     = fr.isOrange ? 255 : 30;
      const gC     = fr.isOrange ? 110 : 180;
      const bC     = fr.isOrange ? 20  : 255;
      const rOval  = r * (1 + Math.sin(t * .6 + i * .5) * .01);
      ctx.save();
      ctx.shadowBlur  = 28 * bright;
      ctx.shadowColor = `rgba(${rC},${gC},${bC},${bright * .7})`;
      ctx.strokeStyle = `rgba(${rC},${gC},${bC},${bright * .3})`;
      ctx.lineWidth   = 1.5 + bright * 3;
      ctx.beginPath(); ctx.ellipse(ox, oy, rOval, rOval * 0.34, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    const numRings = 11;
    for (let i = 0; i < numRings; i++) {
      const pct        = i / (numRings - 1);
      const r          = minR + (maxR - minR) * (pct * pct * .8 + pct * .2);
      const brightness = Math.pow(1 - pct * .87, 1.3);
      const pulse      = 1 + Math.sin(t * .85 + i * .42) * .016;
      const rC         = Math.round(255 * (1 - pct * .95));
      const gC         = Math.round(200 - pct * 30);
      const bC         = Math.round(90 + pct * 165);
      drawArchRing(ox, oy, r, brightness, rC, gC, bC, pulse);
    }

    // ── Disc back half ──
    ctx.save(); ctx.globalAlpha = .75;
    disc.forEach(p => {
      p.angle += p.speed; p.phase += .04;
      const px = ox + Math.cos(p.angle) * W * p.r;
      const py = oy + Math.sin(p.angle) * W * p.r * .26;
      if (Math.sin(p.angle) < 0) {
        const heat = p.brightness * (.7 + Math.sin(p.phase) * .3);
        const frac = Math.max(0, Math.min(1, (p.r - (opts.discRBase || .048) + .007) / .08));
        const rC = frac < .7 ? Math.round(255 - 255 * (frac / .7)) : 0;
        const gC = frac < .7 ? Math.round(100 + 112 * (frac / .7)) : Math.round(212 - 172 * ((frac - .7) / .3));
        const bC = frac < .7 ? Math.round(255 * (frac / .7)) : Math.round(255 - 105 * ((frac - .7) / .3));
        ctx.beginPath(); ctx.arc(px, py, p.size * .7 * (1 + Math.sin(p.phase) * .3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rC},${gC},${bC},${heat * .8})`;
        ctx.shadowBlur = p.size * 9; ctx.shadowColor = `rgba(${rC},${gC},${bC},.7)`; ctx.fill();
      }
    });
    ctx.restore();

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

    // ── Disc front half ──
    ctx.save();
    disc.forEach(p => {
      const px = ox + Math.cos(p.angle) * W * p.r;
      const py = oy + Math.sin(p.angle) * W * p.r * .26;
      if (Math.sin(p.angle) >= 0) {
        const heat = p.brightness * (.7 + Math.sin(p.phase) * .3);
        const frac = Math.max(0, Math.min(1, (p.r - (opts.discRBase || .048) + .007) / .08));
        const rC = frac < .7 ? Math.round(255 - 255 * (frac / .7)) : 0;
        const gC = frac < .7 ? Math.round(100 + 112 * (frac / .7)) : Math.round(212 - 172 * ((frac - .7) / .3));
        const bC = frac < .7 ? Math.round(255 * (frac / .7)) : Math.round(255 - 105 * ((frac - .7) / .3));
        ctx.beginPath(); ctx.arc(px, py, p.size * .7 * (1 + Math.sin(p.phase) * .3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rC},${gC},${bC},${heat})`;
        ctx.shadowBlur = p.size * 10; ctx.shadowColor = `rgba(${rC},${gC},${bC},.8)`; ctx.fill();
      }
    });
    ctx.restore();


    // ── Rings front half (in front of sphere) — bottom arc only ──
    fullRings.forEach((fr, i) => {
      const r      = minR + (maxR - minR) * fr.radiusFrac;
      const bright = .12 + (5 - i) * .022;
      const rC     = fr.isOrange ? 255 : 30;
      const gC     = fr.isOrange ? 110 : 180;
      const bC     = fr.isOrange ? 20  : 255;
      const rOval  = r * (1 + Math.sin(t * .6 + i * .5) * .01);
      ctx.save();
      ctx.shadowBlur  = 28 * bright;
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
      const r          = minR + (maxR - minR) * (pct * pct * .8 + pct * .2);
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

    // ── Top fade ──
    const fade = ctx.createLinearGradient(0, 0, 0, H * .4);
    fade.addColorStop(0, 'rgba(1,2,5,.85)'); fade.addColorStop(.55, 'rgba(1,2,5,.18)'); fade.addColorStop(1, 'rgba(1,2,5,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }
  frame();
}


/* ── BLACK HOLE TIME WARP ── */
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

    // Pulse rings
    if (!bhOpts._pulseRings) bhOpts._pulseRings = [];
    for (let i = 0; i < 4; i++) {
      bhOpts._pulseRings.push({ startT: performance.now() + i * 180, duration: 1400 });
    }

    bhOpts._warping = true;
    const start = performance.now();
    const rampUp = 5000;
    const rampDown = 5000;

    (function tick(now) {
      const elapsed = now - start;
      if (elapsed < rampUp) {
        // ease in to 30x over 5s
        const p = elapsed / rampUp;
        bhOpts.speedMult = 1 + (p * p) * 29;
      } else {
        // ease back to 1x over 5s
        const p = Math.min((elapsed - rampUp) / rampDown, 1);
        bhOpts.speedMult = 30 - (p * p) * 29;
        if (p >= 1) { bhOpts.speedMult = 1; bhOpts._warping = false; return; }
      }
      requestAnimationFrame(tick);
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
  const ext    = window.innerWidth * (mobile ? 0.28 : 0.12);
  bh.width  = window.innerWidth;
  bh.height = Math.round(heroH + ext);
  bh.style.width  = bh.width  + 'px';
  bh.style.height = bh.height + 'px';
  bhOpts.originY  = (heroH * 0.88) / bh.height;
  bhOpts.sphereR     = mobile ? 0.12  : 0.048;
  bhOpts.maxR        = mobile ? 0.70  : 0.43;
  bhOpts.glowScale   = mobile ? 0.85  : 1.0;
  bhOpts.discRBase   = mobile ? 0.15  : 0.048;
  bhOpts.discSizeScale = mobile ? 1.8  : 1.0;
}
resizeBH();
window.addEventListener('resize', resizeBH);
drawPortal(bh, bhOpts);

