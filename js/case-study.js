/* ── SHARED CASE STUDY BEHAVIOUR ──
   Lifted verbatim out of the five case study pages, where it had been copy
   pasted per page. The interos / invoca-ai / invoca-callreview copies were
   byte identical; vasa and job-crawler differed only in comments and
   formatting, so this file is the single source for all five.

   Everything here no-ops on a page that lacks the markup it looks for, so it
   is safe to load from any page. */

(function() {
  // ── Auto-add captions under images using their glightbox data-title ──
  document.querySelectorAll('a.glightbox[data-title]').forEach(link => {
    const title = link.getAttribute('data-title');
    if (!title) return;
    // Prefer the closest .cs-img-frame as the wrap target; fall back to the link itself
    const target = link.closest('.cs-img-frame') || link;
    if (target.dataset.captioned === 'true') return;
    const fig = document.createElement('figure');
    fig.className = 'cs-figure';
    target.parentNode.insertBefore(fig, target);
    fig.appendChild(target);
    const cap = document.createElement('div');
    cap.className = 'cs-img-caption';
    cap.textContent = title;
    fig.appendChild(cap);
    target.dataset.captioned = 'true';
  });
})();

(function() {
  // ── Build bottom nav ──
  const sections = Array.from(document.querySelectorAll('.cs-article-section'));
  if (!sections.length) return;

  const bnav = document.createElement('div');
  bnav.id = 'cs-bottom-nav';
  bnav.innerHTML =
    '<div id="cs-bnav-row"><div id="cs-bnav-sections"></div></div>' +
    '<div id="cs-bnav-track"><div id="cs-bnav-fill"></div></div>';
  document.body.appendChild(bnav);

  const fill   = document.getElementById('cs-bnav-fill');
  const secBox = document.getElementById('cs-bnav-sections');
  const items = [];

  sections.forEach((sec, i) => {
    const lbl = sec.querySelector('.cs-article-label');
    if (!lbl) return;
    const id = 'sec-' + i;
    sec.id = id;
    const a = document.createElement('a');
    a.href = '#' + id;
    a.className = 'cs-bnav-sec';
    // strip the leading "— " added by CSS ::before
    a.textContent = lbl.textContent.replace(/^—\s*/, '').trim();
    a.addEventListener('click', e => {
      e.preventDefault();
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    secBox.appendChild(a);
    items.push({ sec, a });
  });

  // ── Show/hide after hero ──
  const hero = document.getElementById('cs-hero');
  let heroBottom = 0;
  function calcHero() { heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 400; }
  calcHero();
  window.addEventListener('resize', calcHero);

  // ── Scroll progress + active section ──
  function onScroll() {
    const sy = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    fill.style.width = (docH > 0 ? Math.min(100, (sy / docH) * 100) : 0) + '%';
    bnav.classList.toggle('visible', sy > heroBottom);
    let active = null;
    const threshold = sy + window.innerHeight * 0.4;
    items.forEach(({ sec, a }) => { if (sec.offsetTop <= threshold) active = a; });
    items.forEach(({ a }) => a.classList.toggle('active', a === active));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
