# Quotia — landing (rebrand of the "Salix" Framer-template reference)

Static landing page reconstructed from the reference video
(`2026-08-12_17-15-33.mkv`, salix.framer.website) and rebranded to the
fictional sales-analytics SaaS **Quotia**. No build step.

## Run

Any static server works:

```bash
python3 -m http.server 4471 --directory .
# open http://127.0.0.1:4471/
```

Public preview (this host): `preview-tunnel.sh --name salix-quotia --port <port> --no-origin`
with an origin serving this directory.

## Structure

- `index.html` — all 12 sections in reference order
- `styles.css` — design tokens (`:root`) + components + responsive (1024/860/520 breakpoints) + `prefers-reduced-motion`
- `app.js` — GSAP/ScrollTrigger reveals, hero word-split, traffic bars, count-up stats, AI tab scroll-spy, pricing toggle, mobile nav
- `assets/vendor/` — self-hosted `gsap.min.js` + `ScrollTrigger.min.js`
- `.reference-analysis/` — forensic evidence package (analysis, section/motion/asset maps, checkpoints, frames)
- `qa/` — Playwright capture script + checkpoint screenshots

## Brand content

Brand identity is centralized in:
- name/wordmark/logo: `index.html` header/hero/CTA/footer (search `Quotia`)
- colors: CSS custom properties in `styles.css :root`
- copy: inline in `index.html` per section

## Motion configuration

All choreography lives in `app.js`. Reduced-motion users get static final
states (CSS media query + JS `matchMedia` gate). GSAP degrades gracefully if
the vendor files are missing (content renders without animation).

## Validation summary (2026-08-12)

- 0 console errors / 0 failed requests (Chrome via Playwright)
- No horizontal overflow at 1280×800 and 390×844
- Pricing toggle (monthly/yearly), FAQ accordion and AI tabs verified working
- Reduced-motion render verified (content fully visible, opacity 1)

## Validation summary (2026-08-13, bidirectional motion pass)

- All scroll reveals converted to reversible (`play reverse play reverse`): enter → visible, leave → hidden, re-enter → replays (Playwright-measured opacity 1 → 0 → 1 on `.why`, `.testi`, `.pricing`)
- Added: word-blur heading reveals (`h2.sec`), staggered card-grid rises (`.bento`/`.dgrid`/`.pcards`/`.faq`), directional testimonial slides (stats ← left, quotes → right), hero + showcase parallax scrubs
- Pin-spacer regression after pinned `#keytools` fixed with `refreshPriority:1` on the pin trigger (post-pin triggers were 1400px off)
- Scrub drifts verified: hero dash `y 0 → -23`, showcase dash `y +2.4 → -29.9`
- No horizontal overflow (1920×900); reduced-motion: 0 hidden `[data-reveal]` elements
- QA evidence: `qa/bidirectional.cjs` + `qa/bd-01..05-*.png`

## Deploys (2026-08-14)

- **OpenShip (estable):** https://vantro.openship.mdxpreview.xyz — proyecto `proj_uqG3ZmvRYwWG6YVR`, deploy estático `dep_vKdXdWOmvE6Y5AUB`, HTTPS emitido (fix chown letsencrypt + verify API).
- **Túnel temporal:** trycloudflare sobre `python3 -m http.server 4471` en este directorio (watchdog /tmp/salix-watchdog.sh; URL cambia en cada respawn).
