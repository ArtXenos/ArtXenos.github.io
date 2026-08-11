// ===== Mobile nav toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close the mobile menu after a link is tapped
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ===== Highlight the current section in the nav while scrolling =====
const sections = document.querySelectorAll('main section, header.hero, footer.shoreline');
const navAnchors = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--coral)' : '';
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

  function squash() {
    ball.classList.remove('is-bouncing');
    void ball.offsetWidth; // restart the animation
    ball.classList.add('is-bouncing');
  }

  function dockAt(centerX, centerY) {
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
      let bounced = false;

      if (x < 0) { x = 0; vx = -vx * RESTITUTION; bounced = true; }
      if (x > maxX) { x = maxX; vx = -vx * RESTITUTION; bounced = true; }
      if (y < 0) { y = 0; vy = -vy * RESTITUTION; bounced = true; }
      if (y > maxY) {
        y = maxY;
        vy = -vy * RESTITUTION;
        vx *= FLOOR_FRICTION;
        bounced = true;
      }

      ball.style.left = `${x}px`;
      ball.style.top = `${y}px`;
      if (bounced && Math.abs(vy) > 1) squash();

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
})();

// ===== LIGHTBOX GALLERY =====
(function () {
    const galleries = {
        ufy: {
            title: "Vice President — United Foursquare Youth",
            images: [
                { src: "Portfolio/UFY1.png"},
                { src: "Portfolio/UFY2.jpg"},
                { src: "Portfolio/UFY3.jpg"},
                { src: "Portfolio/UFY4.png"},
                { src: "Portfolio/UFY5.jpg"}
            ]
        },
        honors: {
            title: "With Honors — Conduct Awardee",
            images: [
                { src: "Portfolio/Graduate1.jpg" },
                { src: "Portfolio/Graduate2.png" },
                { src: "Portfolio/Graduate3.png" },
                { src: "Portfolio/Graduate4.png" },
                { src: "Portfolio/Graduate5.jpg" }
            ]
        },
        cashier: {
            title: "Cashier Experience — Tiblawan Hardware",
            images: [
                { src: "Portfolio/Cashier1.jpg"},
                { src: "Portfolio/Cashier2.jpeg"},
                { src: "Portfolio/Cashier3.png"},
                { src: "Portfolio/Cashier4.jpeg"},
                { src: "Portfolio/Cashier5.jpeg"}
            ]
        },
      craftsman: {
            title: "Craftsman — Carpentry",
            images: [
                { src: "Portfolio/Craftsman1.jpg" },
                { src: "Portfolio/Craftsman2.jpg" },
                { src: "Portfolio/Craftsman3.jpg" },
                { src: "Portfolio/Craftsman4.jpg" },
                { src: "Portfolio/Craftsman5.jpg" }
            ]
        },
        "beach-manager": {
            title: "Beach Manager — Breezy Leaves Tiblawan",
            images: [
                { src: "Portfolio/Beach1.jpg" },
                { src: "Portfolio/Beach2.jpg" },
                { src: "Portfolio/Beach3.jpg" },
                { src: "Portfolio/Beach4.jpg" },
                { src: "Portfolio/Beach5.png" }
            ]
        }
    };

    const lightbox = document.getElementById("lightbox");
    const imageEl = document.getElementById("lightboxImage");
    const captionEl = document.getElementById("lightboxCaption");
    const dotsEl = document.getElementById("lightboxDots");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");

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

    function showImage(index) {
        currentIndex = (index + currentGallery.images.length) % currentGallery.images.length;
        const item = currentGallery.images[currentIndex];
        imageEl.src = item.src;
        imageEl.alt = item.caption || currentGallery.title;
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