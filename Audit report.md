# UI/UX Audit Report: artxenos.github.io

**Site:** https://artxenos.github.io/
**Files reviewed:** `index.html`, `style.css`, `script.js`, and the `Portfolio/` assets folder
**Date:** November 10, 2026
**Method:** Manual code review against the UI/UX Pro Max guidelines (accessibility, touch, performance, layout, typography and color, animation, navigation), with WCAG 2.1 AA as the accessibility standard. Contrast ratios were calculated from the exact hex values in `style.css`.

---

## Summary

The site has a strong, memorable concept. The beach and sunset theme carries through every section (the lifebuoy nav, the dive bag, the treasure chest, the postcards, the islands), the layout uses responsive grids, and the code already covers several things many portfolios miss: a reduced-motion setting, a focus trap in the lightbox, and Open Graph tags.

Two problems hold it back:

1. **Low color contrast.** Most of the colored text (coral, blue, and white on pastel backgrounds) is far below the readable minimum.
2. **Very heavy images.** The `Portfolio/` folder is **51 MB**, and the profile photo alone is **2 MB** even though it is shown at 160 × 160 px.

Fixing these two problems would improve the site more than all the other items combined.

| Severity | Count | Meaning |
|---|---|---|
| 🔴 Critical | 3 | Blocks some visitors from reading or using the site |
| 🟠 High | 6 | Noticeably hurts usability, mobile experience, or load time |
| 🟡 Medium | 8 | Polish and best-practice gaps |
| ⚪ Low | 5 | Code tidiness, no visible impact |

---

## What's already working well

- **Mobile basics:** the viewport meta tag, `lang="en"`, and a meta description are all present.
- **Responsive grids:** `repeat(auto-fit, minmax(...))` grids adapt without needing many breakpoints.
- **Reduced motion:** `prefers-reduced-motion` turns off animations and smooth scrolling.
- **Lightbox accessibility:** it traps focus, returns focus to the button that opened it, closes with Escape, and supports arrow keys.
- **External links:** they use `rel="noopener"`.
- **Mobile menu:** the toggle has `aria-expanded`, `aria-controls`, and an `aria-label`.
- **Real buttons:** the gallery "View" triggers are `<button>` elements, not clickable `<div>`s.
- **Fonts:** Google Fonts loads with `display=swap` and a `preconnect`.
- **Semantic HTML:** the page uses `<nav>`, `<header>`, `<main>`, `<section>`, `<article>`, and `<footer>`.

---

## 🔴 Critical

### C1. Text color contrast fails across the site

WCAG AA requires **4.5:1** for normal text and **3:1** for large text (24px and up, or 18.7px and up when bold). The ratios below are calculated from the colors in `style.css`:

| Text | Where it's used | Ratio | Result |
|---|---|---|---|
| Coral `#E8927C` on white | Eyebrows, "Art Xenos" highlight, Skills headings, all View/Code/Live links, nav logo, active nav link | **2.34:1** | ❌ Fail |
| Coral on sand `#F2E2C4` | Eyebrows in the Skills and Academic Work sections | **1.86:1** | ❌ Fail |
| Blue `#7EA8C9` on white | "Currently Learning" tags, chest subtitles, "Software Projects" subheads | **2.48:1** | ❌ Fail |
| White on blue | **The entire footer/contact section** | **2.48:1** | ❌ Fail |
| White on peach `#F7B9A6` | Hero eyebrow, subtitle, title | **1.66:1** | ❌ Fail |
| White on coral | Lightbox close button "×" | **2.34:1** | ❌ Fail |
| Plum `#3D3352` on white or sand | Body text | 11.5:1 / 9.2:1 | ✅ Pass |

The contact section and the project links are the parts recruiters most need to read, and both fail.

**Fix:** keep the pastel colors for backgrounds and decoration, and add darker text versions to `:root`. These values are verified:

```css
:root {
  --coral-text: #9E4733; /* 6.07 on white, 5.59 on sand-light, 4.83 on sand */
  --blue-text:  #3D6380; /* 6.27 on white, 5.77 on sand-light, 4.99 on sand */
}
```

- Use `--coral-text` for `.eyebrow`, `.highlight`, `.island-link`, `.skills-group h3`, `.nav-logo`, and the active nav link.
- Use `--blue-text` for `.chest-subtitle`, `.island-subhead`, and `.tag-cloud--learning span`, including its dashed border.
- Change the footer background to `--blue-text` (white on it is **6.27:1**).
- In the hero, make the eyebrow, subtitle, and tagline `var(--plum)` (**6.94:1** on peach). The title can stay white only if its text shadow is much stronger. The safer choice is plum as well.
- Change the lightbox close button background to `var(--plum)` (white on plum is 11.5:1), and keep coral only as its hover color.

### C2. The image files are far too large

| File | Size | Displayed at |
|---|---|---|
| `IMG_20260330_172242.jpg` (profile photo and social share image) | **2.0 MB** | 160 × 160 px |
| `Craftsman1.jpg` | **4.4 MB** | at most 720 px wide |
| `Craftsman5.jpg` | 3.6 MB | at most 720 px wide |
| `Graduate2.png`, `Graduate4.png`, `Graduate3.png`, `Cashier3.png` | 2.4–2.8 MB each | at most 720 px wide |
| Whole `Portfolio/` folder | **51 MB** | |

The profile photo loads on every visit, and on mobile data 2 MB can take several seconds. Opening a gallery downloads multi-megabyte photos one at a time while the lightbox sits blank.

**Fix:**
- Resize the profile photo to **320 × 320** (2× the display size for sharp screens) and export it as WebP or JPEG at about 80% quality. The target is **under 40 KB**.
- Resize the gallery photos to about **1440 px on the long edge** and export them as WebP. The target is **150–300 KB each**. PNG photos (`Graduate*.png`, `Cashier3.png`, `UFY*.png`) gain the most from converting to WebP or JPEG.
- Create a separate social share image at **1200 × 630**, under 300 KB, and point `og:image` at it.
- Free tools that can do this: [Squoosh](https://squoosh.app) (in the browser) or the `cwebp` command-line tool.
- Add `width="160" height="160"` and `decoding="async"` to the profile `<img>` so the layout doesn't shift while it loads.

### C3. The mobile menu's hidden links can still be reached with Tab

`style.css:624-638` hides the closed mobile menu with `max-height: 0; overflow: hidden`. That hides it visually, but the six links still receive keyboard focus, so a keyboard user on a narrow screen tabs through invisible links.

**Fix:** also hide the closed menu from focus:

```css
@media (max-width: 720px) {
  .nav-links { visibility: hidden; transition: max-height 0.3s ease, visibility 0.3s; }
  .nav-links.open { visibility: visible; }
}
```

Also close the menu when Escape is pressed, in `script.js`.

---

## 🟠 High

### H1. The beach ball is announced as a button but does nothing from the keyboard

`index.html:76` gives the ball `role="button"` and `tabindex="0"`, so keyboard users land on it and a screen reader announces "button, drag me out of the waves." Pressing Enter or Space does nothing because only pointer events are handled.

**Fix (pick one):**
- **Simplest:** treat it as decoration. Remove `role` and `tabindex` and add `aria-hidden="true"`. Mouse and touch users keep the toy.
- **More fun:** keep it focusable and make Enter or Space toss the ball upward. In `script.js`, call `runPhysics()` with an upward velocity.

### H2. Links don't say where they go ("View", "Code", "Live")

There are 15+ links whose visible text is only "View", "View Certificate", "Code", or "Live". Screen reader users often list all links on a page and would hear "View, View, View, Code, Live, Code…" with no context (WCAG 2.4.4, Link Purpose).

**Fix:** add hidden context text:

```html
<a href="..." class="island-link">Code<span class="sr-only"> for Em-Ployger on GitHub</span></a>
```

```css
.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
```

Links that open a PDF should also say so, for example "View (PDF, 6 MB)". Visitors on mobile data will appreciate the warning.

### H3. Touch targets are too small

| Element | Size | Recommended |
|---|---|---|
| Hamburger menu button | about 32 × 26 px | 44 × 44 px |
| Lightbox dots | **9 × 9 px** | 24 × 24 px minimum |
| Lightbox close | 36 × 36 px | 44 × 44 px |
| View/Code/Live text links | one line of text, about 26px tall | add padding |

**Fix:**
- Give `.nav-toggle` `min-width: 44px; min-height: 44px`.
- Keep the dots small visually but give them a larger clickable area: `width: 24px; height: 24px` with a `::before` pseudo-element for the 9px dot.
- Add `padding: 0.4rem 0` to `.island-link`.

### H4. The lightbox shows nothing while a large photo loads, and every photo has the same alt text

`showImage()` swaps `src` straight away, so with 2–4 MB images the frame shows the previous photo, or an empty sand box, for several seconds with no sign that anything is loading. Every photo in a gallery also gets the same alt text (the gallery title), and the dialog's accessible name comes from the caption, which is only "1 / 5".

**Fix:**
- Show a loading state, such as a CSS spinner or a `.is-loading` class removed on the image's `load` event.
- Preload the next image (`new Image().src = nextSrc`).
- Add a short `caption` to each photo in the `galleries` object (the code already supports one).
- Point the dialog's `aria-labelledby` at a heading that contains the gallery title.

Fixing C2 first will make most of the loading delay go away.

### H5. Body text inside the footer is all bold, and the "Contact" section has no heading

The nav's "Contact" link jumps to a section whose heading is a quote ("Technology is most powerful…"). Both paragraphs are wrapped in `<b>`, so nothing stands out, and the email address (the main call to action) looks like every other line.

**Fix:**
- Add a clear `<h2>Let's connect</h2>` or similar, and keep the quote as a styled `<blockquote>` or `<p class="quote">`.
- Remove the `<b>` tags.
- Make the email address a visible button, for example `Email me →` styled like `.shell-link`.
- Consider a **résumé or CV download link** here. It is usually the first thing a recruiter looks for.

### H6. `100vh` hero and `background-attachment: fixed` cause mobile glitches

- `min-height: 100vh` (`style.css:143`) is taller than the visible screen on mobile browsers with a collapsing address bar, so the content and scroll cue get pushed off-screen. Use `min-height: 100svh` with `100vh` as a fallback on the line before it.
- `background-attachment: fixed` on `.sky-layer` (`style.css:159`) is ignored on iOS Safari and forces expensive repaints elsewhere. Because the layer is already `position: absolute`, it adds nothing visible. Remove it.

---

## 🟡 Medium

### M1. Emoji used as icons

- Every social link uses the same 🐚 shell, so it doesn't help tell GitHub, LinkedIn, and Instagram apart.
- Screen readers read each one aloud ("spiral shell, GitHub").
- Emoji also look different on Windows, Android, and iOS.

**Fix:** use real brand SVG icons, for example from [Simple Icons](https://simpleicons.org) or Phosphor, with `aria-hidden="true"`, or keep the shell and add `aria-hidden="true"` to it. Do the same for the achievement emoji (⛪ 🎓 💵 🔨 🌊 🤖 ☁️).

### M2. Some text is smaller than 12px

`.chest-subtitle` and `.postcard-stamp` use `0.7rem` (11.2px), and `.island-badge` uses `0.7rem` in a monospace font. All three are uppercase or monospace, which makes small text even harder to read. Raise them to at least `0.75rem` (12px), or `0.8rem` to match the eyebrows.

### M3. Heading structure is uneven

- The hero subtitle is an `<h3>` directly after the `<h1>`, which skips `<h2>`. It is a tagline, so make it a `<p class="hero-subtitle">`.
- Postcard titles are split across two `<h3>`s ("Wine Festival" + "Schedule", "Markdown-to-HTML" + "Converter", "Real-Time Telemetry" + "(Auth Gate)"), so screen readers announce two separate headings. Use one `<h3>` and a `<br>` if you want the line break.
- Research titles are very long headings (up to 25 words). Consider a short heading with the full title as the first line of the description.

### M4. No "skip to content" link

Keyboard users must tab through the logo and six nav links on every visit. Add `<a href="#about" class="skip-link">Skip to content</a>` as the first element in `<body>` and show it only on focus.

### M5. The active nav item is shown with color only

`script.js:27` sets the current section's link color inline. It isn't announced to screen readers, and coral on white fails contrast (see C1).

**Fix:** toggle `aria-current="true"` and a class instead, and style `.nav-links a[aria-current]` with the underline that hover already uses.

### M6. Links use `<u>` tags for underlining

`a { text-decoration: none }` removes underlines everywhere, and each project link then puts its text in `<u>` to add one back. `<u>` means "unarticulated annotation", not "link".

**Fix:** remove the `<u>` tags and add `.island-link { text-decoration: underline; text-underline-offset: 3px; }`. Add a visible `:focus-visible` outline to `.island-link`, `.shell-link`, and `.postcard`. The default ring can be hard to see on the pastel cards.

### M7. The Skills section is long and unprioritized

About 54 tags are spread over three equal-weight clouds, and two entries ("Researcher", "Graphic Designer") are roles, not skills. A recruiter skimming for 10 seconds can't tell which are your strongest.

**Fix:** group them, for example *Languages*, *Frameworks*, *Databases*, *Testing*, *Tools*, or highlight your top 5–6 skills first. Move "Researcher" and "Graphic Designer" into the About text.

### M8. Achievements mixes job experience with online certificates

Leadership roles, a hardware-store job, carpentry, resort management, and two Coursera certificates share one grid, so the certificates get the same weight as real work experience.

**Fix:** split them under two subheads, *Experience & Leadership* and *Certifications*, the same way Projects already separates *Software Projects* from *Research & Capstone*.

---

## ⚪ Low (code tidiness)

1. **Duplicate property:** `.island-card` sets `border-radius` twice (`style.css:533-534`), and the first line never applies. Delete it.
2. **Unused CSS:** `.horizon--foot` (`style.css:210`) matches no element.
3. **The squash effect does nothing:** `squash()` in `script.js` adds `is-bouncing`, and the code also uses `is-freed` and `is-flying`, but none of these classes has any CSS. Either add a squash keyframe or remove the calls.
4. **Absolute self-links:** the postcard links use `https://artxenos.github.io/...` for pages in this same repo. Relative paths (`Activity%201.2/index.html`) also work in local testing and if the domain ever changes.
5. **Script loading:** `<script src="script.js">` at the end of `<body>` is fine. Moving it into `<head>` with `defer` is the modern equivalent and lets the browser download it earlier.

---

## Suggested order of work

| Step | Items | Effort | Impact |
|---|---|---|---|
| 1 | **C1** contrast tokens and swaps | about 30 min (CSS only) | Every visitor can read the site |
| 2 | **C2** image compression and resizing | about 1 hour | Much faster load, especially on mobile |
| 3 | **C3, H1, H3** keyboard and touch fixes | about 30 min | Usable without a mouse, easier to tap |
| 4 | **H2, H5** link context and contact section | about 30 min | Clearer for recruiters and screen readers |
| 5 | **H4, H6, M1–M6** | 1–2 hours | Polish |
| 6 | **M7, M8** content restructuring | your call | Better first impression |
| 7 | Low items | 10 min | Cleaner code |

After the fixes, test the site with:
- **Lighthouse** (Chrome DevTools → Lighthouse → Accessibility and Performance)
- Keyboard only (Tab, Shift+Tab, Enter, Escape)
- A real phone on mobile data
