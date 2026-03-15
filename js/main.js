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

  // ── Stars (normalized 0–1 so resize doesn't misplace them) ──
  const stars = Array.from({ length: opts.starCount || 180 }, () => ({
    nx: Math.random(), ny: Math.random(),
    r: .15 + Math.random() * 1.2, a: .1 + Math.random() * .85,
    phase: Math.random() * Math.PI * 2, speed: .004 + Math.random() * .022
  }));

  // ── Nebulae (normalized) ──
  const nebulae = Array.from({ length: 3 }, () => ({
    nx: Math.random(), ny: Math.random() * .75,
    rnx: .06 + Math.random() * .14, rny: .03 + Math.random() * .07,
    color: Math.random() > .5 ? '251,146,60' : '56,189,248',
    phase: Math.random() * Math.PI * 2, speed: .002 + Math.random() * .004
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
      speed: (.007 + Math.random() * .005) * (layer % 2 === 0 ? 1 : -1) * (1 - layer * .15),
      r: .048 + layer * .022 + (Math.random() - .5) * .014,
      size: .4 + Math.random() * 1.6,
      brightness: .3 + Math.random() * .7,
      layer, phase: Math.random() * Math.PI * 2
    };
  });

  // ── CSS-style full rotating rings with orbiting hot spots ──
  const fullRings = Array.from({ length: 5 }, (_, i) => ({
    radiusFrac:  .10 + i * .16,
    hotAngle:    Math.random() * Math.PI * 2,
    hotSpeed:    (.003 + Math.random() * .004) * (Math.random() > .5 ? 1 : -1),
    isOrange:    i % 2 === 0
  }));

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
      if (s.r > 0.9 && a > .35) {
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
    ctx.save();
    ctx.shadowBlur = 80 * brightness;
    ctx.shadowColor = `rgba(${rC},${gC},${bC},${brightness * .55})`;
    ctx.strokeStyle = `rgba(${rC},${gC},${bC},${brightness * .1})`;
    ctx.lineWidth = 22 * brightness + 5;
    ctx.beginPath(); ctx.arc(ox, oy, rr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 28 * brightness;
    ctx.shadowColor = `rgba(${rC},${gC},${bC},${brightness * .9})`;
    ctx.strokeStyle = `rgba(${rC},${gC},${bC},${brightness * .5})`;
    ctx.lineWidth = 6 * brightness + 1.5;
    ctx.beginPath(); ctx.arc(ox, oy, rr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(255,248,235,${brightness})`;
    ctx.strokeStyle = `rgba(255,252,245,${brightness * .92})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(ox, oy, rr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // ────────────────────────────────────
  // FRAME LOOP
  // ────────────────────────────────────
  function frame() {
    t += .009; fc++;
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
    pool.addColorStop(0,   `rgba(255,140,20,${.32 + Math.sin(t * .7) * .06})`);
    pool.addColorStop(.18, `rgba(255,70,0,${.20 + Math.sin(t * .5) * .04})`);
    pool.addColorStop(.4,  `rgba(0,150,255,${.13 + Math.sin(t * .4) * .03})`);
    pool.addColorStop(.7,  'rgba(0,60,180,.04)');
    pool.addColorStop(1,   'rgba(0,10,40,0)');
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);

    // ── Plasma energy blobs — (04) screen compositing ──
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 8; i++) {
      const angle = i * .785 + t * (.2 + i * .011) * (i % 2 === 0 ? 1 : -1);
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

    // ── Full rotating rings with orbiting hot spots — (06) CSS style ──
    fullRings.forEach((fr, i) => {
      fr.hotAngle += fr.hotSpeed;
      const r      = minR + (maxR - minR) * fr.radiusFrac;
      const bright = .12 + (5 - i) * .022;
      const rC     = fr.isOrange ? 255 : 30;
      const gC     = fr.isOrange ? 110 : 180;
      const bC     = fr.isOrange ? 20  : 255;

      // Full 360° ring
      ctx.save();
      ctx.shadowBlur  = 28 * bright;
      ctx.shadowColor = `rgba(${rC},${gC},${bC},${bright * .7})`;
      ctx.strokeStyle = `rgba(${rC},${gC},${bC},${bright * .3})`;
      ctx.lineWidth   = 1.5 + bright * 3;
      ctx.beginPath(); ctx.arc(ox, oy, r * (1 + Math.sin(t * .6 + i * .5) * .01), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // Orbiting hot spot
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
    });

    // ── Arch rings — 3-pass bloom (current signature visual) ──
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

    // ── Horizon glow line ──
    const hline = ctx.createLinearGradient(ox - maxR, oy, ox + maxR, oy);
    hline.addColorStop(0,   'rgba(0,212,255,0)');
    hline.addColorStop(.22, `rgba(0,212,255,${.32 + Math.sin(t) * .05})`);
    hline.addColorStop(.5,  `rgba(255,175,0,${.88 + Math.sin(t * 1.2) * .1})`);
    hline.addColorStop(.78, `rgba(0,212,255,${.32 + Math.sin(t) * .05})`);
    hline.addColorStop(1,   'rgba(0,212,255,0)');
    ctx.save(); ctx.shadowBlur = 26; ctx.shadowColor = 'rgba(255,120,0,.9)';
    ctx.fillStyle = hline; ctx.fillRect(ox - maxR, oy - 2.5, maxR * 2, 5 * (1 + Math.sin(t * 1.3) * .1));
    ctx.restore();

    // ── Disc back half ──
    ctx.save(); ctx.globalAlpha = .75;
    disc.forEach(p => {
      p.angle += p.speed; p.phase += .04;
      const px = ox + Math.cos(p.angle) * W * p.r;
      const py = oy + Math.sin(p.angle) * W * p.r * .26;
      if (Math.sin(p.angle) < 0) {
        const heat = p.brightness * (.7 + Math.sin(p.phase) * .3);
        const isBlue = p.layer % 2 === 0;
        const rC = isBlue ? 0 : 255, gC = isBlue ? 212 : 98, bC = isBlue ? 255 : 0;
        ctx.beginPath(); ctx.arc(px, py, p.size * (1 + Math.sin(p.phase) * .3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rC},${gC},${bC},${heat * .8})`;
        ctx.shadowBlur = p.size * 9; ctx.shadowColor = `rgba(${rC},${gC},${bC},.7)`; ctx.fill();
      }
    });
    ctx.restore();

    // ── Photon ring glow ──
    const pg = ctx.createRadialGradient(ox, oy, sR * .75, ox, oy, sR * 1.6);
    pg.addColorStop(0,   `rgba(255,230,100,${.78 + Math.sin(t * 2) * .12})`);
    pg.addColorStop(.28, `rgba(255,100,0,${.55 + Math.sin(t * 1.6) * .08})`);
    pg.addColorStop(.65, `rgba(0,210,255,${.22 + Math.sin(t) * .05})`);
    pg.addColorStop(1,   'rgba(0,100,200,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR * 1.6, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();

    ctx.save();
    ctx.shadowBlur = 36; ctx.shadowColor = `rgba(255,210,60,${.95 + Math.sin(t * 2) * .05})`;
    ctx.strokeStyle = `rgba(255,240,140,${.88 + Math.sin(t * 2.2) * .12})`;
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.arc(ox, oy, sR * 1.02, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // ── Black sphere ──
    const sG = ctx.createRadialGradient(ox - sR * .25, oy - sR * .25, sR * .05, ox, oy, sR);
    sG.addColorStop(0, 'rgba(6,3,1,1)'); sG.addColorStop(.7, 'rgba(2,1,1,1)'); sG.addColorStop(1, 'rgba(1,1,1,1)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2); ctx.fillStyle = sG; ctx.fill();

    const shine = ctx.createRadialGradient(ox - sR * .35, oy - sR * .35, 0, ox, oy, sR);
    shine.addColorStop(0, 'rgba(0,212,255,.1)'); shine.addColorStop(.5, 'rgba(0,170,255,.04)'); shine.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2); ctx.fillStyle = shine; ctx.fill();

    // ── Disc front half ──
    ctx.save();
    disc.forEach(p => {
      const px = ox + Math.cos(p.angle) * W * p.r;
      const py = oy + Math.sin(p.angle) * W * p.r * .26;
      if (Math.sin(p.angle) >= 0) {
        const heat = p.brightness * (.7 + Math.sin(p.phase) * .3);
        const isBlue = p.layer % 2 === 0;
        const rC = isBlue ? 0 : 255, gC = isBlue ? 212 : 98, bC = isBlue ? 255 : 0;
        ctx.beginPath(); ctx.arc(px, py, p.size * (1 + Math.sin(p.phase) * .3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rC},${gC},${bC},${heat})`;
        ctx.shadowBlur = p.size * 10; ctx.shadowColor = `rgba(${rC},${gC},${bC},.8)`; ctx.fill();
      }
    });
    ctx.restore();

    // ── Light pillar ──
    const col = ctx.createLinearGradient(ox, oy, ox, oy - H * .62);
    col.addColorStop(0,   `rgba(255,100,0,${.18 + Math.sin(t) * .05})`);
    col.addColorStop(.28, `rgba(0,200,255,${.1 + Math.sin(t * .8) * .025})`);
    col.addColorStop(.65, 'rgba(0,130,220,.025)');
    col.addColorStop(1,   'rgba(0,20,60,0)');
    const cW = W * .042 * (1 + Math.sin(t * .9) * .05);
    ctx.fillStyle = col; ctx.fillRect(ox - cW / 2, oy - H * .62, cW, H * .62);

    // ── Top fade ──
    const fade = ctx.createLinearGradient(0, 0, 0, H * .4);
    fade.addColorStop(0, 'rgba(1,2,5,.85)'); fade.addColorStop(.55, 'rgba(1,2,5,.18)'); fade.addColorStop(1, 'rgba(1,2,5,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }
  frame();
}


/* ── INIT ── */
const bh = document.getElementById('bhCanvas');

// Mutable opts object — originY is recomputed on resize so sphere center
// always sits exactly on the hero/about section boundary
const bhOpts = { originY: .88, maxR: .62, sphereR: .068, starCount: 220, discCount: 280, shooters: true, lensing: true };

function resizeBH() {
  // Size directly from window — bypasses CSS layout timing issues entirely.
  // Canvas height = hero height + 9vw extension so the sphere straddles the fold.
  const heroH = document.getElementById('hero').offsetHeight || window.innerHeight;
  const ext   = window.innerWidth * 0.09;
  bh.width  = window.innerWidth;
  bh.height = Math.round(heroH + ext);
  bh.style.width  = bh.width  + 'px';
  bh.style.height = bh.height + 'px';
  bhOpts.originY  = heroH / bh.height;
}
resizeBH();
window.addEventListener('resize', resizeBH);
drawPortal(bh, bhOpts);

const mini = document.getElementById('miniHole');
function resizeMini() { mini.width = mini.offsetWidth; mini.height = mini.offsetHeight; }
resizeMini();
drawPortal(mini, { originY: .85, maxR: .82, sphereR: .1, starCount: 40, discCount: 120, shooters: false, lensing: false });
