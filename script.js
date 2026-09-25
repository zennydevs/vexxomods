// =========================================================
// VexxosMods — Site Scripts
// Vanilla JS, no dependencies, no build step.
// Made by Jimmy G
// =========================================================

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initStars();
  initNav();
  initReveal();
  initSpotlight();
  initCounters();
  initDownloads();
  initActiveLink();
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

/* ---------- Starfield + shooting stars ---------- */
function initStars() {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w, h, stars = [], shooters = [];

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(170, Math.floor((w * h) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.3 + 0.3,
      a: Math.random() * 0.55 + 0.2,
      s: Math.random() * 0.002 + 0.0006,
      p: Math.random() * Math.PI * 2,
      vy: Math.random() * 0.06 + 0.01
    }));
  }

  function spawn() {
    const ang = (Math.PI / 180) * (28 + Math.random() * 22);
    const sp = 10 + Math.random() * 6;
    shooters.push({ x: Math.random() * w * 0.7, y: Math.random() * h * 0.35, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: 50 + Math.random() * 20 });
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = reduceMotion ? s.a : s.a + Math.sin(t * s.s + s.p) * 0.22;
      ctx.beginPath();
      ctx.fillStyle = `rgba(232,224,255,${Math.max(0, a)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (!reduceMotion) { s.y -= s.vy; if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; } }
    }
    if (reduceMotion) return;

    if (Math.random() < 0.005 && shooters.length < 2) spawn();
    shooters = shooters.filter(s => s.life < s.max);
    for (const s of shooters) {
      const p = s.life / s.max;
      const f = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      const tx = s.x - s.vx * 9, ty = s.y - s.vy * 9;
      const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, `rgba(236,220,255,${f * 0.95})`);
      ctx.beginPath(); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y); ctx.stroke();
      s.x += s.vx; s.y += s.vy; s.life++;
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}

/* ---------- Navbar: scroll state + mobile menu ---------- */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 16);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!toggle || !links) return;
  const close = () => { toggle.setAttribute('aria-expanded', 'false'); links.classList.remove('open'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('open', !open);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
}

/* ---------- Cursor spotlight on cards ---------- */
function initSpotlight() {
  if (reduceMotion || window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- Count-up for stat numbers ---------- */
function initCounters() {
  const nums = document.querySelectorAll('.stat-num[data-count]');
  if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;

  const run = el => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const start = performance.now(), dur = 1200;
    const tick = now => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.6 });
  nums.forEach(el => io.observe(el));
}

/* ---------- Download buttons: ripple + toast ---------- */
// The links point at Pixeldrain's direct-download URL, so the browser saves the
// file and the visitor stays on this page. This only adds visual feedback —
// it never blocks or changes the link itself.
function initDownloads() {
  const toast = document.getElementById('toast');
  const toastMod = document.getElementById('toast-mod');
  let hideTimer;

  document.querySelectorAll('.dl').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!reduceMotion) {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const rip = document.createElement('span');
        rip.className = 'ripple';
        rip.style.width = rip.style.height = `${size}px`;
        rip.style.left = `${(e.clientX || r.left + r.width / 2) - r.left - size / 2}px`;
        rip.style.top = `${(e.clientY || r.top + r.height / 2) - r.top - size / 2}px`;
        btn.appendChild(rip);
        setTimeout(() => rip.remove(), 700);
      }

      const label = btn.querySelector('span');
      if (label && !btn.classList.contains('done')) {
        btn.classList.add('done');
        label.textContent = 'Downloading…';
        setTimeout(() => { btn.classList.remove('done'); label.textContent = 'Download'; }, 2600);
      }

      if (toast) {
        toastMod.textContent = `${btn.dataset.mod || 'Your mod'} · 1.21.11`;
        toast.classList.add('show');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => toast.classList.remove('show'), 3200);
      }
    });
  });
}

/* ---------- Highlight the nav link for the section in view ---------- */
function initActiveLink() {
  const links = [...document.querySelectorAll('.nav-links a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const a = map.get(en.target.id);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}
