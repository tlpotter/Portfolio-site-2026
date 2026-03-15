/* ── CURSOR ── */
const cur = document.getElementById('cur');
const ring = document.getElementById('curRing');
let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top = my + 'px';
});

(function animateRing() {
  rx += (mx - rx) * .1;
  ry += (my - ry) * .1;
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(animateRing);
})();


/* ══════════════════════════════════════
   SPACE / BLACK HOLE RENDERER
   ══════════════════════════════════════ */
function drawPortal(canvas, opts) {
  const ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  let t = 0;

  const stars = Array.from({ length: opts.starCount || 180 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: .15 + Math.random() * 1.2, a: .1 + Math.random() * .85,
    phase: Math.random() * Math.PI * 2, speed: .004 + Math.random() * .022
  }));

  const nebulae = Array.from({ length: 3 }, () => ({
    x: Math.random() * W, y: Math.random() * H * .75,
    rx: 100 + Math.random() * 200, ry: 50 + Math.random() * 90,
    color: Math.random() > .5 ? '251,146,60' : '56,189,248',
    phase: Math.random() * Math.PI * 2, speed: .002 + Math.random() * .004
  }));

  const constellations = Array.from({ length: 5 }, () =>
    Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => ({
      x: Math.random() * W, y: Math.random() * H * .65,
      r: .6 + Math.random() * .6, phase: Math.random() * Math.PI * 2
    }))
  );

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

  // 3-pass bloom ring: outer glow → mid glow → sharp core line
  function drawRing(ox, oy, r, brightness, rC, gC, bC, pulse) {
    const rr = r * pulse;

    // Pass 1 — wide soft halo
    ctx.save();
    ctx.shadowBlur = 80 * brightness;
    ctx.shadowColor = `rgba(${rC},${gC},${bC},${brightness * .55})`;
    ctx.strokeStyle = `rgba(${rC},${gC},${bC},${brightness * .1})`;
    ctx.lineWidth = 22 * brightness + 5;
    ctx.beginPath(); ctx.arc(ox, oy, rr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Pass 2 — mid bloom
    ctx.save();
    ctx.shadowBlur = 28 * brightness;
    ctx.shadowColor = `rgba(${rC},${gC},${bC},${brightness * .9})`;
    ctx.strokeStyle = `rgba(${rC},${gC},${bC},${brightness * .5})`;
    ctx.lineWidth = 6 * brightness + 1.5;
    ctx.beginPath(); ctx.arc(ox, oy, rr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Pass 3 — sharp bright filament
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(255,248,235,${brightness})`;
    ctx.strokeStyle = `rgba(255,252,245,${brightness * .92})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(ox, oy, rr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function frame() {
    t += .009;
    W = canvas.width; H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // BG gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#010205');
    bg.addColorStop(.45, '#020610');
    bg.addColorStop(1, '#030b1a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Nebulae
    nebulae.forEach(n => {
      n.phase += n.speed;
      const pulse = 1 + Math.sin(n.phase) * .08;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.rx * pulse);
      g.addColorStop(0, `rgba(${n.color},${.08 + Math.sin(n.phase) * .02})`);
      g.addColorStop(.5, `rgba(${n.color},.04)`);
      g.addColorStop(1, `rgba(${n.color},0)`);
      ctx.save(); ctx.scale(1, n.ry / n.rx);
      ctx.beginPath(); ctx.arc(n.x, n.y * (n.rx / n.ry), n.rx * pulse, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
    });

    // Stars
    stars.forEach(s => {
      s.phase += s.speed;
      const a = s.a * (.4 + Math.sin(s.phase) * .6);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      if (s.r > 0.9 && a > .35) {
        ctx.strokeStyle = `rgba(255,255,255,${a * .35})`; ctx.lineWidth = .5;
        ctx.beginPath(); ctx.moveTo(s.x - s.r * 4, s.y); ctx.lineTo(s.x + s.r * 4, s.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x, s.y - s.r * 4); ctx.lineTo(s.x, s.y + s.r * 4); ctx.stroke();
      }
    });

    // Constellations
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

    // Shooting stars
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

    const ox = W * .5;
    const oy = H * (opts.originY || .88);
    const sR = W * (opts.sphereR || .072);
    const maxR = W * (opts.maxR || .65);
    const minR = sR * 2.4; // rings begin just outside photon ring

    // Ground energy pool — vivid focal glow
    const pool = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * .6);
    pool.addColorStop(0,   `rgba(255,140,20,${.32 + Math.sin(t * .7) * .06})`);
    pool.addColorStop(.18, `rgba(255,70,0,${.2 + Math.sin(t * .5) * .04})`);
    pool.addColorStop(.4,  `rgba(0,150,255,${.13 + Math.sin(t * .4) * .03})`);
    pool.addColorStop(.7,  'rgba(0,60,180,.04)');
    pool.addColorStop(1,   'rgba(0,10,40,0)');
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);

    // ═══ ARCH RINGS — hero visual, 3-pass bloom ═══
    const numRings = 11;
    for (let i = 0; i < numRings; i++) {
      const pct = i / (numRings - 1); // 0 = innermost, 1 = outermost

      // Rings spaced with slight ease-in so they cluster toward centre
      const r = minR + (maxR - minR) * (pct * pct * .8 + pct * .2);

      // Inner rings blaze bright, outer rings fade
      const brightness = Math.pow(1 - pct * .87, 1.3);

      // Each ring pulses slightly with a phase offset
      const pulse = 1 + Math.sin(t * .85 + i * .42) * .016;

      // Color: orange-white (inner) → cyan-blue (outer)
      const rC = Math.round(255 * (1 - pct * .95));
      const gC = Math.round(200 - pct * 30);
      const bC = Math.round(90 + pct * 165);

      drawRing(ox, oy, r, brightness, rC, gC, bC, pulse);
    }

    // Horizon glow line
    const hline = ctx.createLinearGradient(ox - maxR, oy, ox + maxR, oy);
    hline.addColorStop(0,   'rgba(0,212,255,0)');
    hline.addColorStop(.22, `rgba(0,212,255,${.32 + Math.sin(t) * .05})`);
    hline.addColorStop(.5,  `rgba(255,175,0,${.88 + Math.sin(t * 1.2) * .1})`);
    hline.addColorStop(.78, `rgba(0,212,255,${.32 + Math.sin(t) * .05})`);
    hline.addColorStop(1,   'rgba(0,212,255,0)');
    ctx.save(); ctx.shadowBlur = 26; ctx.shadowColor = 'rgba(255,120,0,.9)';
    ctx.fillStyle = hline; ctx.fillRect(ox - maxR, oy - 2.5, maxR * 2, 5 * (1 + Math.sin(t * 1.3) * .1));
    ctx.restore();

    // Disc back half
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

    // Photon ring glow
    const pg = ctx.createRadialGradient(ox, oy, sR * .75, ox, oy, sR * 1.6);
    pg.addColorStop(0,   `rgba(255,230,100,${.78 + Math.sin(t * 2) * .12})`);
    pg.addColorStop(.28, `rgba(255,100,0,${.55 + Math.sin(t * 1.6) * .08})`);
    pg.addColorStop(.65, `rgba(0,210,255,${.22 + Math.sin(t) * .05})`);
    pg.addColorStop(1,   'rgba(0,100,200,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR * 1.6, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();

    // Photon ring line
    ctx.save();
    ctx.shadowBlur = 36; ctx.shadowColor = `rgba(255,210,60,${.95 + Math.sin(t * 2) * .05})`;
    ctx.strokeStyle = `rgba(255,240,140,${.88 + Math.sin(t * 2.2) * .12})`;
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.arc(ox, oy, sR * 1.02, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Black sphere
    const sG = ctx.createRadialGradient(ox - sR * .25, oy - sR * .25, sR * .05, ox, oy, sR);
    sG.addColorStop(0, 'rgba(6,3,1,1)');
    sG.addColorStop(.7, 'rgba(2,1,1,1)');
    sG.addColorStop(1, 'rgba(1,1,1,1)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2); ctx.fillStyle = sG; ctx.fill();

    // Sphere shine
    const shine = ctx.createRadialGradient(ox - sR * .35, oy - sR * .35, 0, ox, oy, sR);
    shine.addColorStop(0, 'rgba(0,212,255,.1)');
    shine.addColorStop(.5, 'rgba(0,170,255,.04)');
    shine.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR, 0, Math.PI * 2); ctx.fillStyle = shine; ctx.fill();

    // Disc front half
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

    // Light pillar
    const col = ctx.createLinearGradient(ox, oy, ox, oy - H * .62);
    col.addColorStop(0,   `rgba(255,100,0,${.18 + Math.sin(t) * .05})`);
    col.addColorStop(.28, `rgba(0,200,255,${.1 + Math.sin(t * .8) * .025})`);
    col.addColorStop(.65, 'rgba(0,130,220,.025)');
    col.addColorStop(1,   'rgba(0,20,60,0)');
    const cW = W * .042 * (1 + Math.sin(t * .9) * .05);
    ctx.fillStyle = col; ctx.fillRect(ox - cW / 2, oy - H * .62, cW, H * .62);

    // Top fade
    const fade = ctx.createLinearGradient(0, 0, 0, H * .4);
    fade.addColorStop(0, 'rgba(1,2,5,.85)');
    fade.addColorStop(.55, 'rgba(1,2,5,.18)');
    fade.addColorStop(1, 'rgba(1,2,5,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }
  frame();
}


/* ── INIT ── */
const bh = document.getElementById('bhCanvas');
function resizeBH() { bh.width = bh.offsetWidth; bh.height = bh.offsetHeight; }
resizeBH();
window.addEventListener('resize', resizeBH);
drawPortal(bh, { originY: .88, maxR: .62, sphereR: .068, starCount: 220, discCount: 280, shooters: true });

const mini = document.getElementById('miniHole');
function resizeMini() { mini.width = mini.offsetWidth; mini.height = mini.offsetHeight; }
resizeMini();
drawPortal(mini, { originY: .85, maxR: .82, sphereR: .1, starCount: 40, discCount: 120, shooters: false });
