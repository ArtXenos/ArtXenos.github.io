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
    });
})();