'use strict';

/* ══════════════════════════════════════════════════════════
   GIMSHAN MENAKA PORTFOLIO — MAIN SCRIPT
   Key fix: each icon independently tracks cursor with its
   own current position, lerp speed, and X/Y speed multipliers.
   Icons are ONLY inside #home — they don't appear elsewhere.
══════════════════════════════════════════════════════════ */

/* ── LOADER ────────────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
    revealOnScroll();
    initTrailCanvas();   // start trail after load
  }, 1800);
});

/* ── CUSTOM CURSOR ─────────────────────────────────────── */
const cur    = document.getElementById('cursor');
const curTxt = document.getElementById('cursorText');
let globalMx = window.innerWidth / 2;
let globalMy = window.innerHeight / 2;

if (window.matchMedia('(hover:hover)').matches) {
  document.addEventListener('mousemove', e => {
    globalMx = e.clientX;
    globalMy = e.clientY;
    cur.style.left = globalMx + 'px';
    cur.style.top  = globalMy + 'px';
    if (curTxt.classList.contains('show')) {
      curTxt.style.left = (globalMx + 20) + 'px';
      curTxt.style.top  = (globalMy - 10) + 'px';
    }
  });

  document.querySelectorAll('a, button, .pc, .ac-card, .sk-pill').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('link'));
    el.addEventListener('mouseleave', () => cur.classList.remove('link'));
  });

  document.querySelectorAll('.pc').forEach(card => {
    card.addEventListener('mouseenter', () => {
      cur.classList.add('big');
      curTxt.textContent = card.dataset.cursor || 'View';
      curTxt.classList.add('show');
      curTxt.style.left = (globalMx + 20) + 'px';
      curTxt.style.top  = (globalMy - 10) + 'px';
    });
    card.addEventListener('mouseleave', () => {
      cur.classList.remove('big');
      curTxt.classList.remove('show');
    });
  });
}

/* ── HERO ICONS — TRUE INDEPENDENT PARALLAX ────────────── */
/*
  Each icon in #home has:
    style="--bx:X%;--by:Y%"  → base position (% of viewport)
    data-sx                  → X-axis speed (how far it moves horizontally)
    data-sy                  → Y-axis speed (how far it moves vertically)
    data-dir                 → 1 or -1 (inverts direction for variety)

  Each icon maintains its OWN current smoothed x/y (cx, cy).
  On every animation frame the target is recomputed from cursor offset,
  then cx/cy lerp toward it at a PER-ICON rate.
  This makes each one feel like it's floating at a different depth.

  The icon-orbit div is INSIDE #home, so it scrolls away with the hero.
  JS also stops updating when user has scrolled past the hero.
*/

const heroEl    = document.getElementById('home');
const iconNodes = document.querySelectorAll('#iconOrbit .orb-icon');

// Parse each icon's config once
const icons = Array.from(iconNodes).map(el => {
  // Read base % from CSS custom props --bx and --by
  const style   = el.style;
  const rawBx   = style.getPropertyValue('--bx') || '50%';
  const rawBy   = style.getPropertyValue('--by') || '50%';
  const bxPct   = parseFloat(rawBx);   // e.g. 11
  const byPct   = parseFloat(rawBy);   // e.g. 16

  const sx      = parseFloat(el.dataset.sx)  || 0.04;
  const sy      = parseFloat(el.dataset.sy)  || 0.04;
  const dir     = parseFloat(el.dataset.dir) || 1;
  // Unique lerp factor per icon — gives organic feel
  const lerp    = 0.025 + Math.random() * 0.08;

  const startX  = (bxPct / 100) * window.innerWidth;
  const startY  = (byPct / 100) * window.innerHeight;

  return { el, bxPct, byPct, sx, sy, dir, lerp, cx: startX, cy: startY };
});

let heroMx      = window.innerWidth  / 2;
let heroMy      = window.innerHeight / 2;
let mouseInHero = true;  // assume true until mouse leaves

// Only track mouse inside the hero section
heroEl && heroEl.addEventListener('mousemove', e => {
  heroMx      = e.clientX;
  heroMy      = e.clientY;
  mouseInHero = true;
});
heroEl && heroEl.addEventListener('mouseleave', () => {
  mouseInHero = false;
  // reset to viewport center so they drift back to base
  heroMx = window.innerWidth  / 2;
  heroMy = window.innerHeight / 2;
});

// Recalculate base on resize
window.addEventListener('resize', () => {
  icons.forEach(ic => {
    ic.cx = (ic.bxPct / 100) * window.innerWidth;
    ic.cy = (ic.byPct / 100) * window.innerHeight;
  });
  heroMx = window.innerWidth  / 2;
  heroMy = window.innerHeight / 2;
});

function animIcons() {
  // Only animate when hero is visible (performance)
  const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 0;
  if (heroBottom < -100) {
    requestAnimationFrame(animIcons);
    return;
  }

  const centerX = window.innerWidth  / 2;
  const centerY = window.innerHeight / 2;
  const offX    = heroMx - centerX;   // cursor offset from center
  const offY    = heroMy - centerY;

  icons.forEach(ic => {
    // Each icon's target = base + its own X/Y speed * cursor offset * its direction
    const basePx = (ic.bxPct / 100) * window.innerWidth;
    const basePy = (ic.byPct / 100) * window.innerHeight;
    const targetX = basePx + offX * ic.sx * ic.dir;
    const targetY = basePy + offY * ic.sy * ic.dir;

    // Smooth with THIS icon's own lerp — not global
    ic.cx += (targetX - ic.cx) * ic.lerp;
    ic.cy += (targetY - ic.cy) * ic.lerp;

    ic.el.style.left      = ic.cx + 'px';
    ic.el.style.top       = ic.cy + 'px';
    ic.el.style.transform = 'translate(-50%, -50%)';
  });

  requestAnimationFrame(animIcons);
}
animIcons();

/* ── HERO CURSOR SHELL-LINE TRAIL ──────────────────────────
   Draws faint arc/shell lines that bloom outward from the
   cursor as it moves, fading out smoothly. Hero-only.
   Each trail point spawns a small expanding arc ring.
──────────────────────────────────────────────────────────── */
function initTrailCanvas() {
  const canvas  = document.getElementById('heroTrailCanvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const hero    = document.getElementById('home');

  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Each shell = { x, y, r, maxR, life, maxLife, angle, arcLen }
  const shells = [];
  let lastX = -999, lastY = -999;
  let isInHero = false;

  hero.addEventListener('mouseenter', () => { isInHero = true; });
  hero.addEventListener('mouseleave', () => { isInHero = false; });

  hero.addEventListener('mousemove', e => {
    if (!isInHero) return;
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only spawn if mouse moved enough (avoids clutter on hover)
    const dx = x - lastX, dy = y - lastY;
    if (dx * dx + dy * dy < 120) return;
    lastX = x; lastY = y;

    // Spawn 2–3 overlapping shell arcs at slightly varied angles
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2;          // start angle
      const arcLen = (0.4 + Math.random() * 0.8) * Math.PI; // how much of the arc
      shells.push({
        x, y,
        r:      4 + Math.random() * 6,    // start radius
        maxR:   40 + Math.random() * 80,  // expand to this
        life:   0,
        maxLife: 55 + Math.random() * 35, // frames until gone
        angle,
        arcLen,
        lineW:  0.4 + Math.random() * 0.6,
      });
    }
    // Cap total shells for performance
    if (shells.length > 120) shells.splice(0, shells.length - 120);
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.life++;

      const t       = s.life / s.maxLife;          // 0 → 1
      const eased   = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease in-out
      const radius  = s.r + (s.maxR - s.r) * eased;
      const alpha   = (1 - t) * 0.18;              // fade as it expands

      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, s.angle, s.angle + s.arcLen);
      ctx.strokeStyle = `rgba(255, 100, 20, ${alpha})`;
      ctx.lineWidth   = s.lineW * (1 - t * 0.5);  // thin as it fades
      ctx.lineCap     = 'round';
      ctx.stroke();

      if (s.life >= s.maxLife) shells.splice(i, 1);
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── NAV ────────────────────────────────────────────────── */
const nav = document.getElementById('nav');
const ham = document.getElementById('ham');
const mob = document.getElementById('mobMenu');
const nls = document.querySelectorAll('.nl');

window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 60);
  updateActiveNav();
  toggleBTT();
});

ham.addEventListener('click', () => {
  const open = ham.classList.toggle('open');
  mob.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
mob.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    ham.classList.remove('open');
    mob.classList.remove('open');
    document.body.style.overflow = '';
  });
});

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  let active = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 140) active = s.id;
  });
  nls.forEach(n => n.classList.toggle('active', n.dataset.s === active));
}

/* ── SCROLL REVEAL ──────────────────────────────────────── */
function revealOnScroll() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('on'), i * 70);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── SMOOTH SCROLL ──────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const t = document.querySelector(id);
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ── SWIPER ─────────────────────────────────────────────── */
new Swiper('.proj-swiper', {
  slidesPerView: 'auto',
  spaceBetween: 20,
  grabCursor: true,
  pagination: { el: '.swiper-pagination', clickable: true },
  breakpoints: {
    0:    { slidesPerView: 1,   spaceBetween: 16 },
    600:  { slidesPerView: 1.3, spaceBetween: 20 },
    900:  { slidesPerView: 2.2, spaceBetween: 24 },
    1200: { slidesPerView: 2.8, spaceBetween: 28 },
  },
  navigation: { nextEl: '#projNext', prevEl: '#projPrev' }
});

/* ── ABOUT PROFILE IMAGE UPLOAD ─────────────────────────── */
/*
  Two image slots:
  1. Hero photo card (#heroProfileImg + #profileUpload)
  2. About section dropzone (#profileImgInput + #profileDropzone)
  Both share the same image via sessionStorage.
*/

function applyProfileImage(dataUrl) {
  // Hero card
  const heroImg = document.getElementById('heroProfileImg');
  if (heroImg) {
    heroImg.src = dataUrl;
    heroImg.closest('.hpc-inner')?.classList.remove('no-photo');
  }
  // About dropzone
  const dropImg     = document.getElementById('profileImgPreview');
  const dropHolder  = document.getElementById('profileImgPlaceholder');
  const dropRemove  = document.getElementById('profileRemoveBtn');
  const dropzone    = document.getElementById('profileDropzone');
  if (dropImg)    { dropImg.src = dataUrl; dropImg.style.display = 'block'; }
  if (dropHolder)  dropHolder.style.display = 'none';
  if (dropRemove)  dropRemove.style.display = 'flex';
  if (dropzone)    dropzone.classList.add('has-img');
  // Save
  try { sessionStorage.setItem('profileImg', dataUrl); } catch(_) {}
}

function loadFileAsDataURL(file, cb) {
  if (!file || !file.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = e => cb(e.target.result);
  r.readAsDataURL(file);
}

// Restore saved image on page load
try {
  const saved = sessionStorage.getItem('profileImg');
  if (saved) applyProfileImage(saved);
} catch(_) {}

// ① Hero card upload (label for="profileUpload")
const heroUpload = document.getElementById('profileUpload');
heroUpload && heroUpload.addEventListener('change', e => {
  if (e.target.files[0]) loadFileAsDataURL(e.target.files[0], applyProfileImage);
});
// ② About section dropzone
const dropzoneEl   = document.getElementById('profileDropzone');
const dropInput    = document.getElementById('profileImgInput');
const dropRemoveEl = document.getElementById('profileRemoveBtn');

dropInput && dropInput.addEventListener('change', e => {
  if (e.target.files[0]) loadFileAsDataURL(e.target.files[0], applyProfileImage);
});

if (dropzoneEl) {
  dropzoneEl.addEventListener('click', () => dropInput && dropInput.click());
  dropzoneEl.addEventListener('dragover',  e => { e.preventDefault(); dropzoneEl.classList.add('drag-over'); });
  dropzoneEl.addEventListener('dragleave', () => dropzoneEl.classList.remove('drag-over'));
  dropzoneEl.addEventListener('drop', e => {
    e.preventDefault();
    dropzoneEl.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) loadFileAsDataURL(f, applyProfileImage);
  });
}

dropRemoveEl && dropRemoveEl.addEventListener('click', e => {
  e.stopPropagation();
  // Clear hero
  const heroImg = document.getElementById('heroProfileImg');
  if (heroImg) { heroImg.src = ''; heroImg.closest('.hpc-inner')?.classList.add('no-photo'); }
  // Clear dropzone
  const dropImg = document.getElementById('profileImgPreview');
  if (dropImg) { dropImg.src = ''; dropImg.style.display = 'none'; }
  const ph = document.getElementById('profileImgPlaceholder');
  if (ph) ph.style.display = 'flex';
  dropRemoveEl.style.display = 'none';
  if (dropzoneEl) dropzoneEl.classList.remove('has-img');
  if (dropInput)  dropInput.value = '';
  try { sessionStorage.removeItem('profileImg'); } catch(_) {}
});

/* ── CONTACT FORM ───────────────────────────────────────── */
const cForm  = document.getElementById('contactForm');
const fOk    = document.getElementById('formOk');
const subBtn = document.getElementById('submitBtn');

if (cForm) {
  cForm.addEventListener('submit', async e => {
    e.preventDefault();
    const bt = subBtn.querySelector('.bt');
    const bl = subBtn.querySelector('.bl');
    bt.style.display = 'none'; bl.style.display = 'inline';
    subBtn.disabled = true;
    try {
      const res  = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cForm.name.value, email: cForm.email.value,
          subject: cForm.subject?.value, message: cForm.message.value,
        }),
      });
      const json = await res.json();
      if (json.success) { fOk.style.display = 'block'; cForm.reset(); }
    } catch { fOk.style.display = 'block'; cForm.reset(); }
    finally { bt.style.display = 'inline'; bl.style.display = 'none'; subBtn.disabled = false; }
  });
}

/* ── HIRE MODAL ─────────────────────────────────────────── */
const modal    = document.getElementById('hireModal');
const modalX   = document.getElementById('modalX');
const hireForm = document.getElementById('hireForm');

function openModal()  { modal?.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeModal() { modal?.classList.remove('open'); document.body.style.overflow = ''; }

modalX?.addEventListener('click', closeModal);
modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.querySelectorAll('[data-open-hire]').forEach(b => b.addEventListener('click', openModal));
hireForm?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = hireForm.querySelector('button');
  btn.textContent = 'Sent ✓'; btn.disabled = true;
  setTimeout(() => { closeModal(); btn.textContent = 'Send →'; btn.disabled = false; hireForm.reset(); }, 1500);
});

/* ── BACK TO TOP ────────────────────────────────────────── */
const btt = document.getElementById('btt');
function toggleBTT() { btt?.classList.toggle('show', window.scrollY > 600); }
btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── ESC ────────────────────────────────────────────────── */
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

console.log('%c Gimshan Menaka Portfolio V2\n%c Made in Sri Lanka 🇱🇰',
  'color:#ff4d00;font-family:monospace;font-size:14px;font-weight:bold',
  'color:#7a7570;font-family:monospace;font-size:11px'
);
