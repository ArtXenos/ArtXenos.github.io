// ===== LIGHTBOX GALLERY =====
(function () {
    const galleries = {
      craftsman: {
        title: "Craftsman — Carpentry",
        images: [
          { src: "Portfolio/Craftsman-1.jpg" },
          { src: "Portfolio/Craftsman-2.jpg" },
          { src: "Portfolio/Craftsman-3.jpg" },
          { src: "Portfolio/Craftsman-4.jpg" },
          { src: "Portfolio/Craftsman-5.jpg" }
        ]
      },
      "beach-manager": {
        title: "Beach Manager — Breezy Leaves Tiblawan",
        images: [
          { src: "Portfolio/Beach-Manager-1.jpg" },
          { src: "Portfolio/Beach-Manager-2.jpg" },
          { src: "Portfolio/Beach-Manager-3.jpg" },
          { src: "Portfolio/Beach-Manager-4.jpg" },
          { src: "Portfolio/Beach-Manager-5.jpg" }
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
      captionEl.textContent = `${item.caption || ""} — ${currentIndex + 1} / ${currentGallery.images.length}`;
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