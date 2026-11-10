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