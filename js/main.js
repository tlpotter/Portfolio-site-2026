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

  const nebulae = Array.from({ length: 4 }, () => ({
    x: Math.random() * W, y: Math.random() * H * .8,
    rx: 80 + Math.random() * 180, ry: 40 + Math.random() * 80,
    color: Math.random() > .5 ? '251,146,60' : '56,189,248',
    phase: Math.random() * Math.PI * 2, speed: .003 + Math.random() * .005
  }));

  const constellations = Array.from({ length: 5 }, (_, ci) =>
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

  function frame() {
    t += .010;
    W = canvas.width; H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // BG gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#010305');
    bg.addColorStop(.5, '#030810');
    bg.addColorStop(1, '#040c18');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Nebulae
    nebulae.forEach(n => {
      n.phase += n.speed;
      const pulse = 1 + Math.sin(n.phase) * .1;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.rx * pulse);
      g.addColorStop(0, `rgba(${n.color},${.1 + Math.sin(n.phase) * .03})`);
      g.addColorStop(.5, `rgba(${n.color},.05)`);
      g.addColorStop(1, `rgba(${n.color},0)`);
      ctx.save(); ctx.scale(1, n.ry / (n.rx));
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
            ctx.strokeStyle = `rgba(0,212,255,${(1 - d / 160) * .12})`; ctx.lineWidth = .6; ctx.stroke();
          }
        }
        pts[i].phase += .006;
        const a = .5 + Math.sin(pts[i].phase) * .3;
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${a})`;
        ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(0,212,255,.8)';
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

    // Ground pool
    const pool = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * .55);
    pool.addColorStop(0, `rgba(255,98,0,${.22 + Math.sin(t * .7) * .05})`);
    pool.addColorStop(.25, `rgba(0,180,255,${.14 + Math.sin(t * .5) * .03})`);
    pool.addColorStop(.6, 'rgba(0,120,220,.05)');
    pool.addColorStop(1, 'rgba(0,20,60,0)');
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);

    // Arch rings
    const numRings = 13;
    for (let i = 0; i < numRings; i++) {
      const pct = i / (numRings - 1);
      const r = maxR * (.22 + (1 - pct) * .78);
      const brightness = pct;
      const pulse = 1 + Math.sin(t * 1.1 + i * .3) * .03;
      const rC = Math.round(0 + brightness * 255);
      const gC = Math.round(212 - brightness * 114);
      const bC = Math.round(255 - brightness * 255);
      const alpha = (.02 + brightness * .7) * pulse;
      ctx.save();
      ctx.shadowBlur = (4 + brightness * 28) * pulse;
      ctx.shadowColor = `rgba(${rC},${gC},${bC},${alpha})`;
      ctx.strokeStyle = `rgba(${rC},${gC},${bC},${alpha})`;
      ctx.lineWidth = (.3 + brightness * 2.8) * pulse;
      ctx.beginPath(); ctx.arc(ox, oy, r * pulse, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Horizon line
    const hline = ctx.createLinearGradient(ox - maxR, oy, ox + maxR, oy);
    hline.addColorStop(0, 'rgba(0,212,255,0)');
    hline.addColorStop(.2, `rgba(0,212,255,${.35 + Math.sin(t) * .06})`);
    hline.addColorStop(.5, `rgba(255,160,0,${.75 + Math.sin(t * 1.2) * .1})`);
    hline.addColorStop(.8, `rgba(0,212,255,${.35 + Math.sin(t) * .06})`);
    hline.addColorStop(1, 'rgba(0,212,255,0)');
    ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(255,120,0,.8)';
    ctx.fillStyle = hline; ctx.fillRect(ox - maxR, oy - 2, maxR * 2, 4 * (1 + Math.sin(t * 1.3) * .12));
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
    const pg = ctx.createRadialGradient(ox, oy, sR * .8, ox, oy, sR * 1.5);
    pg.addColorStop(0, `rgba(255,220,80,${.7 + Math.sin(t * 2) * .12})`);
    pg.addColorStop(.25, `rgba(255,98,0,${.5 + Math.sin(t * 1.6) * .08})`);
    pg.addColorStop(.6, `rgba(0,212,255,${.2 + Math.sin(t) * .05})`);
    pg.addColorStop(1, 'rgba(0,120,220,0)');
    ctx.beginPath(); ctx.arc(ox, oy, sR * 1.5, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();

    // Photon ring line
    ctx.save();
    ctx.shadowBlur = 30; ctx.shadowColor = `rgba(255,200,50,${.9 + Math.sin(t * 2) * .1})`;
    ctx.strokeStyle = `rgba(255,230,100,${.8 + Math.sin(t * 2.2) * .15})`;
    ctx.lineWidth = 2.5;
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
    const col = ctx.createLinearGradient(ox, oy, ox, oy - H * .6);
    col.addColorStop(0, `rgba(255,98,0,${.16 + Math.sin(t) * .04})`);
    col.addColorStop(.3, `rgba(0,212,255,${.08 + Math.sin(t * .8) * .02})`);
    col.addColorStop(.7, 'rgba(0,150,220,.02)');
    col.addColorStop(1, 'rgba(0,20,60,0)');
    const cW = W * .04 * (1 + Math.sin(t * .9) * .05);
    ctx.fillStyle = col; ctx.fillRect(ox - cW / 2, oy - H * .6, cW, H * .6);

    // Top fade
    const fade = ctx.createLinearGradient(0, 0, 0, H * .42);
    fade.addColorStop(0, 'rgba(1,3,5,.82)');
    fade.addColorStop(.5, 'rgba(1,3,5,.2)');
    fade.addColorStop(1, 'rgba(1,3,5,0)');
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
