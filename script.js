// ===== Mobile nav toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function closeMenu() {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close the mobile menu after a link is tapped
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Close the mobile menu with Escape and return focus to the toggle
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) {
    closeMenu();
    navToggle.focus();
  }
});

// ===== Highlight the current section in the nav while scrolling =====
const sections = document.querySelectorAll('main section, header.hero, footer.shoreline');
const navAnchors = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

sections.forEach(section => observer.observe(section));

// ===== Draggable, throwable, bounceable beach ball =====
(function () {
  const ball = document.getElementById('beachBall');
  const hero = document.getElementById('hero');
  if (!ball || !hero) return;

  const GRAVITY = 0.6;
  const RESTITUTION = 0.62;
  const FLOOR_FRICTION = 0.85;
  const AIR_DRAG = 0.995;
  const REST_SPEED = 0.15;
  const MAX_LAUNCH_SPEED = 40;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let moveSamples = [];
  let physicsFrame = null;

  // Moving a focused element in the DOM drops its focus, so restore it afterwards
  function moveTo(parent) {
    if (ball.parentElement === parent) return;
    const hadFocus = document.activeElement === ball;
    parent.appendChild(ball);
    if (hadFocus) ball.focus({ preventScroll: true });
  }

  function moveToBody() { moveTo(document.body); }

  function moveToHero() { moveTo(hero); }

  function isOverWave(x, y) {
    const rect = hero.getBoundingClientRect();
    const waveTop = rect.top + rect.height * 0.62;
    return x >= rect.left && x <= rect.right && y >= waveTop && y <= rect.bottom;
  }

  function recordSample(x, y) {
    const t = performance.now();
    moveSamples.push({ x, y, t });
    const cutoff = t - 120;
    while (moveSamples.length && moveSamples[0].t < cutoff) moveSamples.shift();
  }

  function getLaunchVelocity() {
    if (moveSamples.length < 2) return { vx: 0, vy: 0 };
    const first = moveSamples[0];
    const last = moveSamples[moveSamples.length - 1];
    const dt = Math.max(last.t - first.t, 1);
    let vx = ((last.x - first.x) / dt) * 16;
    let vy = ((last.y - first.y) / dt) * 16;
    vx = Math.max(-MAX_LAUNCH_SPEED, Math.min(MAX_LAUNCH_SPEED, vx));
    vy = Math.max(-MAX_LAUNCH_SPEED, Math.min(MAX_LAUNCH_SPEED, vy));
    return { vx, vy };
  }


  function dockAt(centerX, centerY) {
    moveToHero();
    ball.classList.remove('is-freed', 'is-flying');
    ball.style.position = 'absolute';
    const heroRect = hero.getBoundingClientRect();
    const size = ball.offsetWidth;
    ball.style.left = `${centerX - heroRect.left - size / 2}px`;
    ball.style.top = `${centerY - heroRect.top - size / 2}px`;
    ball.style.right = 'auto';
    ball.style.bottom = 'auto';
    ball.classList.remove('is-dragging');
  }

  function settleFreeAt(x, y) {
    ball.classList.remove('is-flying');
    ball.classList.add('is-freed');
    ball.style.position = 'fixed';
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;
    ball.style.right = 'auto';
    ball.style.bottom = 'auto';
    ball.classList.remove('is-dragging');
  }

  function runPhysics(x, y, vx, vy) {
    if (physicsFrame) cancelAnimationFrame(physicsFrame);
    const size = ball.offsetWidth;

    function step() {
      vy += GRAVITY;
      vx *= AIR_DRAG;
      x += vx;
      y += vy;

      const maxX = window.innerWidth - size;
      const maxY = window.innerHeight - size;

      if (x < 0) { x = 0; vx = -vx * RESTITUTION; }
      if (x > maxX) { x = maxX; vx = -vx * RESTITUTION; }
      if (y < 0) { y = 0; vy = -vy * RESTITUTION; }
      if (y > maxY) {
        y = maxY;
        vy = -vy * RESTITUTION;
        vx *= FLOOR_FRICTION;
      }

      ball.style.left = `${x}px`;
      ball.style.top = `${y}px`;

      const onFloor = y >= maxY - 0.5;
      const resting = onFloor && Math.abs(vx) < REST_SPEED && Math.abs(vy) < REST_SPEED;

      if (resting) {
        physicsFrame = null;
        const cx = x + size / 2;
        const cy = y + size / 2;
        if (isOverWave(cx, cy)) {
          dockAt(cx, cy);
        } else {
          settleFreeAt(x, y);
        }
      } else {
        physicsFrame = requestAnimationFrame(step);
      }
    }

    physicsFrame = requestAnimationFrame(step);
  }

  function startDrag(clientX, clientY, pointerId) {
    if (physicsFrame) { cancelAnimationFrame(physicsFrame); physicsFrame = null; }
    dragging = true;
    ball.classList.remove('is-freed', 'is-flying');
    ball.classList.add('is-dragging');
    const rect = ball.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    moveToBody();
    ball.style.position = 'fixed';
    ball.style.left = `${rect.left}px`;
    ball.style.top = `${rect.top}px`;
    ball.style.right = 'auto';
    ball.style.bottom = 'auto';
    moveSamples = [{ x: clientX, y: clientY, t: performance.now() }];
    if (pointerId !== undefined) {
      try { ball.setPointerCapture(pointerId); } catch (err) { /* ignore */ }
    }
  }

  function endDrag(clientX, clientY) {
    if (!dragging) return;
    dragging = false;
    ball.classList.remove('is-dragging');

    if (isOverWave(clientX, clientY)) {
      dockAt(clientX, clientY);
      return;
    }

    const { vx, vy } = getLaunchVelocity();
    const rect = ball.getBoundingClientRect();
    ball.classList.add('is-flying');
    runPhysics(rect.left, rect.top, vx, vy);
  }

  ball.addEventListener('pointerdown', (e) => {
    startDrag(e.clientX, e.clientY, e.pointerId);
  });

  ball.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    ball.style.left = `${e.clientX - offsetX}px`;
    ball.style.top = `${e.clientY - offsetY}px`;
    ball.style.right = 'auto';
    ball.style.bottom = 'auto';
    recordSample(e.clientX, e.clientY);
  });

  ball.addEventListener('pointerup', (e) => endDrag(e.clientX, e.clientY));
  ball.addEventListener('pointercancel', (e) => endDrag(e.clientX, e.clientY));

  // Keyboard: Enter or Space tosses the ball up from wherever it is
  ball.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (dragging) return;
    const rect = ball.getBoundingClientRect();
    moveToBody();
    ball.classList.remove('is-freed', 'is-dragging');
    ball.classList.add('is-flying');
    ball.style.position = 'fixed';
    ball.style.right = 'auto';
    ball.style.bottom = 'auto';
    const vx = (Math.random() * 2 - 1) * 8;
    runPhysics(rect.left, rect.top, vx, -22);
  });
})();

// ===== LIGHTBOX GALLERY =====
(function () {
    const galleries = {
        ufy: {
            title: "Vice President — United Foursquare Youth",
            images: [
                { src: "Portfolio/UFY1.webp"},
                { src: "Portfolio/UFY2.webp"},
                { src: "Portfolio/UFY3.webp"},
                { src: "Portfolio/UFY4.webp"},
                { src: "Portfolio/UFY5.webp"}
            ]
        },
        honors: {
            title: "With Honors — Conduct Awardee",
            images: [
                { src: "Portfolio/Graduate1.webp" },
                { src: "Portfolio/Graduate2.webp" },
                { src: "Portfolio/Graduate3.webp" },
                { src: "Portfolio/Graduate4.webp" },
                { src: "Portfolio/Graduate5.webp" }
            ]
        },
        cashier: {
            title: "Cashier Experience — Tiblawan Hardware",
            images: [
                { src: "Portfolio/Cashier1.webp"},
                { src: "Portfolio/Cashier2.webp"},
                { src: "Portfolio/Cashier3.webp"},
                { src: "Portfolio/Cashier4.webp"},
                { src: "Portfolio/Cashier5.webp"}
            ]
        },
      craftsman: {
            title: "Craftsman — Carpentry",
            images: [
                { src: "Portfolio/Craftsman1.webp" },
                { src: "Portfolio/Craftsman2.webp" },
                { src: "Portfolio/Craftsman3.webp" },
                { src: "Portfolio/Craftsman4.webp" },
                { src: "Portfolio/Craftsman5.webp" }
            ]
        },
        "beach-manager": {
            title: "Beach Manager — Breezy Leaves Tiblawan",
            images: [
                { src: "Portfolio/Beach1.webp" },
                { src: "Portfolio/Beach2.webp" },
                { src: "Portfolio/Beach3.webp" },
                { src: "Portfolio/Beach4.webp" },
                { src: "Portfolio/Beach5.webp" }
            ]
        }
    };

    const lightbox = document.getElementById("lightbox");
    const imageEl = document.getElementById("lightboxImage");
    const captionEl = document.getElementById("lightboxCaption");
    const dotsEl = document.getElementById("lightboxDots");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    const titleEl = document.getElementById("lightboxTitle");
    const stageEl = document.getElementById("lightboxStage");

    // Hide the loading spinner once the photo has arrived (or failed)
    imageEl.addEventListener("load", () => stageEl.classList.remove("is-loading"));
    imageEl.addEventListener("error", () => stageEl.classList.remove("is-loading"));

    let currentGallery = null;
    let currentIndex = 0;
    let lastFocusedTrigger = null;

    function renderDots() {
        dotsEl.innerHTML = "";
        currentGallery.images.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", `Photo ${i + 1} of ${currentGallery.images.length}`);
            if (i === currentIndex) dot.classList.add("is-active");
            dot.addEventListener("click", () => showImage(i));
            dotsEl.appendChild(dot);
        });
    }

    function preload(index) {
        const n = currentGallery.images.length;
        new Image().src = currentGallery.images[(index + n) % n].src;
    }

    function showImage(index) {
        const total = currentGallery.images.length;
        currentIndex = (index + total) % total;
        const item = currentGallery.images[currentIndex];
        if (imageEl.getAttribute("src") !== item.src) {
            stageEl.classList.add("is-loading");
            imageEl.src = item.src;
        }
        imageEl.alt = item.caption || `${currentGallery.title} — photo ${currentIndex + 1} of ${total}`;
        preload(currentIndex + 1);
        preload(currentIndex - 1);
        captionEl.textContent = item.caption
            ? `${item.caption} — ${currentIndex + 1} / ${currentGallery.images.length}`
            : `${currentIndex + 1} / ${currentGallery.images.length}`;
        renderDots();
    }

    function openGallery(key, triggerEl) {
        const gallery = galleries[key];
        if (!gallery) return;
        currentGallery = gallery;
        lastFocusedTrigger = triggerEl;
        titleEl.textContent = gallery.title;
        showImage(0);
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        lightbox.querySelector(".lightbox-close").focus();
    }

    function closeGallery() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (lastFocusedTrigger) lastFocusedTrigger.focus();
    }

    // ===== Focus trap: keeps Tab cycling inside the lightbox while it's open =====
    function getFocusable() {
        return Array.from(
            lightbox.querySelectorAll(
                'button, [href], [tabindex]:not([tabindex="-1"])'
            )
        ).filter(el => el.offsetParent !== null);
    }

    function trapFocus(e) {
        if (e.key !== "Tab") return;
        const focusable = getFocusable();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    document.querySelectorAll("[data-gallery]").forEach((trigger) => {
        trigger.addEventListener("click", () => openGallery(trigger.dataset.gallery, trigger));
    });

    document.querySelectorAll("[data-lightbox-close]").forEach((el) => {
        el.addEventListener("click", closeGallery);
    });

    prevBtn.addEventListener("click", () => showImage(currentIndex - 1));
    nextBtn.addEventListener("click", () => showImage(currentIndex + 1));

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("is-open")) return;
        if (e.key === "Escape") closeGallery();
        if (e.key === "ArrowLeft") showImage(currentIndex - 1);
        if (e.key === "ArrowRight") showImage(currentIndex + 1);
        trapFocus(e);
    });
})();
// ===== Theme toggle: sunset (light) and night (dark) =====
(function () {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (err) { return null; }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const isNight = theme === 'night';
    toggle.setAttribute('aria-label', isNight ? 'Switch to sunset theme' : 'Switch to night theme');
    if (themeColor) themeColor.setAttribute('content', isNight ? '#151233' : '#F7B9A6');
  }

  applyTheme(root.getAttribute('data-theme') === 'night' ? 'night' : 'sunset');
  toggle.hidden = false;

  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'night' ? 'sunset' : 'night';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (err) { /* storage blocked: theme still applies for this visit */ }
  });

  // Follow the device setting until the visitor picks a theme themselves
  darkQuery.addEventListener('change', (e) => {
    if (!storedTheme()) applyTheme(e.matches ? 'night' : 'sunset');
  });
})();

// ===== Scroll progress bar and back-to-top button =====
(function () {
  const bar = document.getElementById('tideProgress');
  const toTop = document.getElementById('toTop');
  if (!bar || !toTop) return;
  let ticking = false;

  function update() {
    ticking = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    bar.style.transform = `scaleX(${progress})`;
    toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
})();

// ===== Reveal cards as they scroll into view =====
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll(
    '.hut-card, .skills-group, .chest-card, .postcard, .island-card'
  );

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      revealObserver.unobserve(el);
      el.classList.add('is-visible');
      // Drop the helper classes afterwards so the stagger delay doesn't slow down hover effects
      const delay = parseFloat(el.style.transitionDelay) || 0;
      setTimeout(() => {
        el.classList.remove('reveal', 'is-visible');
        el.style.transitionDelay = '';
      }, delay + 800);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => {
    // Stagger cards that sit side by side in the same grid
    const index = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.transitionDelay = `${Math.min(index, 4) * 70}ms`;
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
})();

// ===== Project filters (by category, or by a skill clicked in the Skills section) =====
(function () {
  const bar = document.getElementById('projectFilters');
  const status = document.getElementById('filterStatus');
  const section = document.getElementById('projects');
  if (!bar || !status || !section) return;

  const chips = bar.querySelectorAll('.filter-chip');
  const cards = section.querySelectorAll('.island-card');
  const grids = section.querySelectorAll('.island-grid');

  function skillsOf(card) {
    return Array.from(card.querySelectorAll(':scope > .skill-tags span'), span => span.textContent.trim());
  }

  // A temporary chip that shows the active skill and clears it when pressed
  const skillChip = document.createElement('button');
  skillChip.type = 'button';
  skillChip.className = 'filter-chip filter-chip--skill';
  skillChip.setAttribute('aria-pressed', 'true');
  skillChip.hidden = true;
  bar.appendChild(skillChip);

  function show(matches, activeFilter, skill) {
    let shown = 0;
    cards.forEach(card => {
      const match = matches(card);
      card.hidden = !match;
      if (match) shown++;
    });

    // Hide a group's heading when none of its projects match
    grids.forEach(grid => {
      const hasVisible = grid.querySelector('.island-card:not([hidden])') !== null;
      grid.hidden = !hasVisible;
      const heading = grid.previousElementSibling;
      if (heading && heading.classList.contains('island-subhead')) heading.hidden = !hasVisible;
    });

    chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filter === activeFilter)));

    skillChip.hidden = !skill;
    if (skill) {
      skillChip.textContent = `${skill} \u00D7`;
      skillChip.setAttribute('aria-label', `Showing projects that use ${skill}. Clear this filter`);
      status.textContent = `Showing ${shown} of ${cards.length} projects that use ${skill}`;
    } else {
      status.textContent = activeFilter === 'all'
        ? `Showing all ${cards.length} projects`
        : `Showing ${shown} of ${cards.length} projects`;
    }
  }

  function applyFilter(filter) {
    show(card => filter === 'all' || (card.dataset.category || '').split(' ').includes(filter), filter, null);
  }

  function applySkill(skill) {
    show(card => skillsOf(card).includes(skill), null, skill);
  }

  chips.forEach(chip => chip.addEventListener('click', () => applyFilter(chip.dataset.filter)));
  skillChip.addEventListener('click', () => {
    applyFilter('all');
    bar.querySelector('[data-filter="all"]').focus();
  });
  bar.hidden = false;

  // Skills that appear on at least one project become buttons that jump to those projects
  const counts = {};
  cards.forEach(card => skillsOf(card).forEach(skill => { counts[skill] = (counts[skill] || 0) + 1; }));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('#skills .skill-rows .tag-cloud span').forEach(span => {
    const skill = span.textContent.trim();
    const count = counts[skill];
    if (!count) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tag-button';
    button.textContent = skill;
    button.title = count === 1 ? 'Show the project that uses this' : `Show the ${count} projects that use this`;
    const context = document.createElement('span');
    context.className = 'sr-only';
    context.textContent = count === 1 ? ', show 1 project' : `, show ${count} projects`;
    button.appendChild(context);

    button.addEventListener('click', () => {
      applySkill(skill);
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      skillChip.focus({ preventScroll: true });
    });
    span.replaceWith(button);
  });
})();

// ===== Copy email to clipboard =====
(function () {
  const button = document.getElementById('copyEmail');
  const toast = document.getElementById('toast');
  if (!button || !toast || !navigator.clipboard) return;
  let hideTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  button.hidden = false;
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(button.dataset.email)
      .then(() => showToast('Email address copied'))
      .catch(() => showToast('Could not copy — select the address below instead'));
  });
})();

// ===== Project details dialog =====
(function () {
  const dialog = document.getElementById('projectDialog');
  const body = document.getElementById('projectDialogBody');
  const closeBtn = document.getElementById('projectDialogClose');
  if (!dialog || !body || !closeBtn || typeof dialog.showModal !== 'function') return;

  function openDetails(card) {
    body.textContent = '';

    const shot = card.querySelector('.island-shot');
    if (shot) {
      const img = shot.cloneNode();
      img.className = 'project-dialog-shot';
      img.removeAttribute('loading');
      body.appendChild(img);
    }

    const title = document.createElement('h2');
    title.id = 'projectDialogTitle';
    title.textContent = card.querySelector('h3').textContent.trim();
    body.appendChild(title);

    const summary = card.querySelector(':scope > p');
    if (summary) body.appendChild(summary.cloneNode(true));

    card.querySelectorAll('.island-details > *').forEach(el => body.appendChild(el.cloneNode(true)));

    const tags = card.querySelector('.skill-tags');
    if (tags) body.appendChild(tags.cloneNode(true));

    const links = card.querySelector('.island-links');
    if (links) {
      const copy = links.cloneNode(true);
      copy.querySelectorAll('.island-more').forEach(el => el.remove());
      body.appendChild(copy);
    }

    document.body.style.overflow = 'hidden';
    dialog.showModal();
    body.scrollTop = 0;
  }

  // Only cards that carry extra details get a button
  document.querySelectorAll('#projects .island-card').forEach(card => {
    const details = card.querySelector('.island-details');
    const links = card.querySelector('.island-links');
    if (!details || !links) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'island-link island-more';
    button.textContent = 'Details';
    const context = document.createElement('span');
    context.className = 'sr-only';
    context.textContent = ` about ${card.querySelector('h3').textContent.trim()}`;
    button.appendChild(context);
    button.addEventListener('click', () => openDetails(card));
    links.prepend(button);
  });

  closeBtn.addEventListener('click', () => dialog.close());
  // A click on the backdrop lands on the dialog element itself
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
})();

// ===== Live GitHub numbers (the static text stays if the request fails) =====
(function () {
  const strip = document.getElementById('githubStats');
  const list = document.getElementById('githubStatsList');
  const note = document.getElementById('githubStatsNote');
  if (!strip || !list || !note || !window.fetch) return;

  const user = strip.dataset.user;
  const CACHE_KEY = 'githubRepos';
  const CACHE_MINUTES = 30;

  function readCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.savedAt < CACHE_MINUTES * 60000) return cached.repos;
    } catch (err) { /* storage blocked or empty */ }
    return null;
  }

  function writeCache(repos) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), repos }));
    } catch (err) { /* storage blocked: just fetch again next time */ }
  }

  function timeAgo(dateString) {
    const days = Math.round((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.round(days / 30);
    if (months < 12) return months === 1 ? 'a month ago' : `${months} months ago`;
    const years = Math.round(days / 365);
    return years === 1 ? 'a year ago' : `${years} years ago`;
  }

  function addStat(label, ...content) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.append(...content);
    row.append(dt, dd);
    list.appendChild(row);
  }

  function render(repos) {
    const own = repos.filter(repo => !repo.fork);
    if (!own.length) return;

    addStat('Public repositories', String(repos.length));

    const latest = own[0]; // the API call sorts by most recently pushed
    const link = document.createElement('a');
    link.href = latest.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = latest.name;
    const when = document.createElement('span');
    when.className = 'github-stat-note';
    when.textContent = ` \u00B7 ${timeAgo(latest.pushedAt)}`;
    addStat('Latest push', link, when);

    const counts = {};
    own.forEach(repo => { if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1; });
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
    if (top.length) addStat('Most used', top.join(', '));

    note.hidden = true;
    list.hidden = false;
  }

  const cached = readCache();
  if (cached) { render(cached); return; }

  fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=pushed&per_page=100`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(response => {
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Keep only the fields the strip shows
      const repos = data.map(repo => ({
        name: repo.name,
        url: repo.html_url,
        fork: repo.fork,
        language: repo.language,
        pushedAt: repo.pushed_at
      }));
      writeCache(repos);
      render(repos);
    })
    .catch(() => { /* offline or rate-limited: the static text and profile link remain */ });
})();
