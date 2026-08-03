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