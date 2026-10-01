/* ── INTERACTION LAB ──
   Vanilla JS only. Every effect checks for a fine pointer and for reduced
   motion before it runs, so phones and reduced-motion users get the plain
   version. */
(function () {
  const html = document.documentElement;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionOK = () => !html.classList.contains('reduce') &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Controls ── */
  const reduce = document.getElementById('ctl-reduce');
  const grain = document.getElementById('ctl-grain');
  const curNow = document.getElementById('ctl-cursor-now');
  const curLab = document.getElementById('ctl-cursor-lab');
  reduce.addEventListener('change', () => html.classList.toggle('reduce', reduce.checked));
  grain.addEventListener('change', () => html.classList.toggle('no-grain', !grain.checked));
  function setCursor(mode) {
    html.classList.toggle('cursor-lab', mode === 'lab');
    html.classList.toggle('cursor-now', mode === 'now');
  }
  curNow.addEventListener('change', () => setCursor('now'));
  curLab.addEventListener('change', () => setCursor('lab'));
  setCursor('lab');

  /* ── "Now" title reveal: same IntersectionObserver as js/main.js ── */
  (function () {
    const els = document.querySelectorAll('.sec-label, .sec-title');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    }), { threshold: 0.2 });
    els.forEach(el => io.observe(el));
  })();

  /* ── Cursor: the site's dot + lerped ring, plus lab states ── */
  (function () {
    const cur = document.getElementById('cur'), ring = document.getElementById('curRing'), label = document.getElementById('curLabel');
    if (!cur || !ring || !finePointer) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + 'px'; cur.style.top = my + 'px';
      label.style.left = mx + 'px'; label.style.top = my + 'px';
    });
    (function loop() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); })();
    // lab states
    const linky = 'a, button, [role=button], label, input';
    document.addEventListener('mouseover', e => {
      const t = e.target.closest(linky);
      const txt = e.target.closest('input, textarea');
      ring.classList.toggle('is-link', !!t && !txt); cur.classList.toggle('is-link', !!t && !txt);
      ring.classList.toggle('is-text', !!txt); cur.classList.toggle('is-text', !!txt);
      const card = e.target.closest('[data-cursor]');
      if (card) { label.textContent = card.dataset.cursor; label.classList.add('on'); } else label.classList.remove('on');
    });
    document.addEventListener('mousedown', () => ring.classList.add('is-down'));
    document.addEventListener('mouseup', () => ring.classList.remove('is-down'));
  })();

  /* ── Magnetic buttons: pull up to 6px toward the pointer, spring back ── */
  (function () {
    if (!finePointer) return;
    document.querySelectorAll('.lab-magnet').forEach(el => {
      const strength = 0.25, max = 6;
      el.addEventListener('mousemove', e => {
        if (!motionOK()) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.setProperty('--mx', Math.max(-max, Math.min(max, dx)) + 'px');
        el.style.setProperty('--my', Math.max(-max, Math.min(max, dy)) + 'px');
      });
      el.addEventListener('mouseleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
    });
  })();

  /* ── Spotlight + tilt on lab cards: one pointermove sets CSS vars ── */
  (function () {
    if (!finePointer) return;
    document.querySelectorAll('.lab-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        if (card.classList.contains('lab-tilt') && motionOK()) {
          const ry = ((x / r.width) - .5) * 6, rx = (.5 - (y / r.height)) * 6;   // max 3deg each way
          card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
          card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        }
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
    const tiltToggle = document.getElementById('ctl-tilt');
    tiltToggle.addEventListener('change', () => document.querySelectorAll('.lab-card').forEach(c => c.classList.toggle('lab-tilt', tiltToggle.checked)));
  })();

  /* ── Nav pill: slides under the hovered link, rests on the active one ── */
  (function () {
    document.querySelectorAll('.lab-navrow.has-pill').forEach(row => {
      const links = row.querySelectorAll('a');
      const move = a => { row.style.setProperty('--x', (a.offsetLeft - 8) + 'px'); row.style.setProperty('--w', (a.offsetWidth + 16) + 'px'); };
      let active = links[0]; move(active);
      links.forEach(a => {
        a.addEventListener('mouseenter', () => move(a));
        a.addEventListener('click', e => { e.preventDefault(); active = a; move(a); });
      });
      row.addEventListener('mouseleave', () => move(active));
    });
  })();

  /* ── Split-text title: wrap words once, reveal on view, replayable ── */
  (function () {
    document.querySelectorAll('.lab-title').forEach(t => {
      t.querySelectorAll('em, .plain').forEach(seg => {
        const words = seg.textContent.trim().split(/\s+/);
        seg.innerHTML = words.map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
      });
      t.querySelectorAll('.w > span').forEach((s, i) => s.style.setProperty('--i', i));
    });
  })();

  /* ── Reveal on view: titles, labels, cards, wipes, counters ── */
  const revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.dataset.count) countUp(e.target);
    revealIO.unobserve(e.target);
  }), { threshold: 0.25 });
  document.querySelectorAll('.lab-title, .lab-label, .lab-reveal, .lab-wipe, [data-count]').forEach(el => revealIO.observe(el));
  document.querySelectorAll('.lab-reveal').forEach((el, i) => { if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i % 6); });

  /* ── Count-up: eases out over 900ms, honors reduced motion ── */
  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    if (!motionOK()) { el.textContent = prefix + end.toLocaleString(undefined, { minimumFractionDigits: dec }) + suffix; return; }
    const t0 = performance.now(), dur = 900;
    el.classList.add('is-counting');   // dim while moving, white when it lands
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (end * e).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      if (p < 1) requestAnimationFrame(tick); else el.classList.remove('is-counting');
    })(t0);
  }

  /* ── Replay buttons: reset with transitions off, reflow, then play ── */
  document.querySelectorAll('.lab-replay').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.lab-col');
    if (!box) return;
    box.classList.add('lab-noanim');
    box.querySelectorAll('.in, .in-view').forEach(el => el.classList.remove('in', 'in-view'));
    box.querySelectorAll('[data-count]').forEach(el => el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || ''));
    void box.offsetHeight;                      // flush the reset as the "before" style
    box.classList.remove('lab-noanim');
    // Same frame is fine: the transition compares the flushed style above
    // with the new one, and no animation frame is needed.
    box.querySelectorAll('.sec-label, .sec-title').forEach(el => el.classList.add('in-view'));
    box.querySelectorAll('.lab-title, .lab-label, .lab-reveal, .lab-wipe').forEach(el => el.classList.add('in'));
    box.querySelectorAll('[data-count]').forEach(countUp);
  }));

  /* Leaving for a page that does not opt in (the main site) skips the
     transition and would log an unhandled AbortError. Swallow it. */
  window.addEventListener('pageswap', e => { const vt = e.viewTransition; if (vt) { vt.ready.catch(() => {}); vt.finished.catch(() => {}); vt.updateCallbackDone.catch(() => {}); } });

  /* ── Page transition support badge ── */
  document.querySelectorAll('.lab-vt').forEach(el => {
    const ok = 'PageRevealEvent' in window;   // cross-document view transitions
    el.textContent = ok ? 'This browser supports page transitions' : 'Not supported here: the page just loads';
    el.classList.add(ok ? 'yes' : 'no');
  });

  /* ── Copy email: tick + toast instead of opening a mail app ── */
  (function () {
    const toast = document.getElementById('labToast');
    document.querySelectorAll('[data-copy]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const tick = a.querySelector('.lab-copied');
      const done = () => {
        tick.classList.add('on'); toast.classList.add('on');
        setTimeout(() => { tick.classList.remove('on'); toast.classList.remove('on'); }, 1600);
      };
      navigator.clipboard ? navigator.clipboard.writeText(a.dataset.copy).then(done, done) : done();
    }));
  })();

  /* ── Index ──  */
  document.querySelectorAll('.lab-sg .sg-item').forEach((el, i) => el.style.setProperty('--i', i));
})();
