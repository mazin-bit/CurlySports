# Responsive & Accessibility Changes (320px–1920px)

## What Was Done

### 1. New file: `src/responsive-all-formats.css`
- Loaded after `index.css` and `responsive.css` so it can override where needed.
- Implements a single responsive layer for **all common widths (320–1920px)** and **height-based** adjustments.

### 2. Foundation (all viewports)
- **Overflow:** `html` and `body` use `overflow-x: hidden`; `#root` and `.app-container` use `min-width: 0` so flex children can shrink and the page never scrolls horizontally.
- **Touch targets (WCAG 2.5.5):** Buttons, `.nav-item`, `.sport-chip`, `.source-badge`, `.seat`, `.close-modal`, `.logout-btn-pro`, `.fav-star` have `min-height` and `min-width` of **44px** so they stay clickable on touch devices.
- **Typography:** Root variables `--text-min` (14px) and `--text-min-small` (12px); body text uses `max(var(--text-min-small), 1em)`; headings use `clamp(...)` for fluid scaling.
- **Inputs:** `font-size: max(16px, 1em)` and `min-height: 44px` to avoid zoom on focus on iOS and keep fields tappable.
- **Images:** Global `img` has `max-width: 100%` and `height: auto`; small logos (team, nav, league) are limited to 48px and `object-fit: contain` so they don’t overflow or distort.
- **Cards & grids:** All main cards and grids have `min-width: 0` and cards have `max-width: 100%` so they don’t break layout.
- **Tables & bracket:** `.table-container` and `.bracket-container` use `overflow-x: auto` and `max-width: 100%` so wide content scrolls inside the page.
- **Modals:** `max-width: min(96vw, 600px)` and `max-height: 90vh` so they never exceed the viewport.

### 3. Width breakpoints
- **320px:** Tighter padding, smaller fonts, nav items ~44px wide, standings table ~260px min-width.
- **375px:** Slightly increased padding and font sizes for small phones.
- **480px:** Single-column grids, full-width modals, smaller close button.
- **600px:** Single-column matches, smaller bracket columns, adjusted nav/sport chips.
- **768px:** Bottom nav layout, 2-column players grid, scrollable standings, sheet-style modals, booking layout stacked.
- **900px:** Main content padding and match grid with `minmax(min(260px, 100%), 1fr)`; bracket scrolls horizontally.
- **1024px:** Same grid approach with 280px min; sports row can scroll horizontally.
- **1200px:** Bracket grid no longer forces a large min-width; container scrolls.
- **1440px:** Centered main content, max-width 1600px, larger match grid columns.
- **1920px:** Max-width 1800px, larger gaps and match cards.

### 4. Height-based
- **max-height: 700px:** Shorter sports/leagues bars, smaller titles, less padding, modals capped at 88vh.
- **max-height: 500px:** Even more compact bars and nav; modals 85vh.
- **max-width: 500px and max-height: 600px:** Extra compact padding and top bar.

### 5. Change in `src/index.css`
- Global `img` given `max-width: 100%` and `height: auto` so images don’t overflow. Existing rules for `.news-image`, `.hero-img`, `.modal-player-img` (width/height 100% + object-fit) are unchanged so those still fill their containers.

### 6. Import in `src/index.js`
- Added: `import './responsive-all-formats.css';` after `responsive.css` so the new layer applies last.

---

## Fallbacks for tricky cases

1. **Browsers without `dvh`:**  
   `@supports not (height: 100dvh)` sets `#root` and `.app-container` to `100vh` so layout still fills the screen.

2. **No `backdrop-filter`:**  
   `@supports not (backdrop-filter: blur(10px))` gives `.sidebar`, `.modal-content`, `.login-card-pro` a solid background so they stay readable.

3. **No `gap` (very old browsers):**  
   `@supports not (gap: 8px)` uses margins on grid/flex children so spacing still works.

4. **Reduced motion:**  
   `@media (prefers-reduced-motion: reduce)` forces short animation/transition durations to limit layout shift and motion.

5. **Text size adjust:**  
   `html { -webkit-text-size-adjust: 100%; }` avoids iOS from resizing text in landscape and breaking layout.

6. **Small viewports:**  
   At 320px, padding and font sizes are reduced so content fits; tables and bracket scroll horizontally inside their containers.

7. **Unusual aspect ratios:**  
   Existing `(max-aspect-ratio: 4/3)` in `responsive.css` keeps the two-row top bar on square/portrait viewports; height-based rules keep short viewports usable.

---

## Practices used

- **Flexbox:** Sidebar rows, top bar, nav menus, cards; `min-width: 0` on flex children that need to shrink.
- **Grid:** `repeat(auto-fill, minmax(min(…px, 100%), 1fr))` so columns never overflow.
- **Fluid units:** `clamp()` for spacing and heading sizes; `max()` for minimum font sizes.
- **Media queries:** Width bands at 320, 375, 480, 600, 768, 900, 1024, 1200, 1440, 1920; height at 500px and 700px; one combined narrow+short query.
- **Accessibility:** 44px minimum touch targets, readable minimum font sizes, scrollable overflow instead of clipping, modals constrained to viewport.

Core design and behavior are unchanged; only layout, overflow, scaling, and touch/readability were adjusted for stability across screen sizes and resolutions.
