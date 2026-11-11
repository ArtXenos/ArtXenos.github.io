# My Portfolio — Art Xenos D. Guadalquiver

## Overview
This repository contains my personal developer portfolio, built as a prelim project for my web development course. It's a single-page, beach/sunset-themed site showcasing my background, skills, achievements, academic work, and projects — built with semantic HTML5, CSS3 (Flexbox/Grid), and vanilla JavaScript.

## Live Site
🔗 [https://ArtXenos.github.io](https://ArtXenos.github.io)

## Sections
- **About Me** — introduction, profile photo, and links to my GitHub, LinkedIn, Facebook, Instagram, and X
- **Skills & Currently Learning** — languages and tools I use, plus what I'm currently picking up
- **Achievements & Experience** — leadership roles, honors, and work experience, each with a photo gallery
- **Academic Work** — Fashion Blog, Wine Festival Schedule, Davies Burger, Markdown-to-HTML Converter, and Real-Time Telemetry (Auth Gate) course activities
- **Projects** — software projects (Em-Ployger, Skye Crafts, Kita Kita, Income Category Ledger, and Java desktop apps) with live demo and code links, plus capstone systems (SAKTO, PAPER, SLOPE, OUTAGE) and research projects

## Features
- Custom lightbox photo gallery for each achievement, with keyboard navigation (arrow keys, Esc), dot indicators, and focus management
- Animated sunset sky with a bouncing sun and continuously flowing wave layers, all in pure CSS
- Fully responsive layout with a collapsible mobile nav menu
- Scroll-based nav highlighting so the active section is always visible in the menu
- Sunset and night themes with a toggle in the nav — the night theme turns the sun into a moon and adds stars; the choice is remembered, and it follows the device's light/dark setting by default
- Screenshots on the software project cards (lazy-loaded WebP)
- Project detail view — a "Details" button on each software project opens a dialog with a larger screenshot, highlights, the stack and links
- Project filters (All, Web apps, Java, Research & Capstone) with a live count
- Clickable skills — a skill that appears on a project jumps to Projects and shows only the projects that use it
- Hero buttons that jump straight to Projects and Contact, a scroll progress bar, and a back-to-top button
- Cards fade in as they scroll into view
- Live GitHub strip under Projects — public repo count, latest push and most-used languages from the GitHub API, with plain text if the request fails
- "Copy email" button with a confirmation message
- Sunset-and-wave favicon (SVG, with ICO and Apple touch icon fallbacks)
- Respects `prefers-reduced-motion` for visitors who prefer minimal animation

## Tools Used
- Hand-written HTML5, CSS3 (Flexbox/Grid), and vanilla JavaScript — no frameworks
- Fonts via Google Fonts (Fraunces, Nunito, Space Mono)
- Built and edited in VS Code, version-controlled with Git/GitHub
- Used Claude (Anthropic) throughout development as a collaborative tool — for structuring the initial layout, troubleshooting CSS/JS bugs (e.g. the lightbox image-cropping issue, animation conflicts), and reviewing content like the About Me copy. All design decisions, content, and final code choices are my own; I can walk through how each part works.

## Running Locally
Clone the repo and open `index.html` in a browser — no build step or dependencies required.