# NEXT BINGE WATCH — Futuristic Cyber-Neon Design System

## 1. Visual Theme & Atmosphere

**NEXT BINGE WATCH** uses a **Futuristic Cyber-Cinema HUD** design language: a deep obsidian canvas (`#05070e`) layered with a GPU-accelerated atmospheric background (perspective HUD dot-grid, dual volumetric neon aurora orbs, and subtle film-grain texture) beneath translucent dark-glass HUD panels. Rather than locking the interface to a single static accent color, the entire design system dynamically adapts its high-contrast neon accent tokens to the **genre of the active series** or a dedicated **Talent Spotlight** palette for **person profiles**, while individual cards in Search and Watchlist carry their own per-item genre accent edges.

The system is architected in **three decoupled tiers** so evolving the visual identity in the future requires editing a single token file without rewriting component code:

1. **Tier 1 — CSS Custom Properties & Genre Registry** (`frontend/src/styles/tokens.css` & `frontend/src/styles/genreThemes.ts`)
2. **Tier 2 — Semantic Tailwind Theme Mappings** (`frontend/tailwind.config.js`)
3. **Tier 3 — Reusable Design System Primitives** (`frontend/src/components/ds/`)

---

## 2. Color System & Dynamic Genre Palettes

### Base Obsidian & Glass Surfaces

| Token | Value | Role |
| --- | --- | --- |
| `--ds-void` | `#05070e` | Primary deep-space page canvas |
| `--ds-surface` | `rgba(11, 16, 30, 0.76)` | Primary translucent glass HUD panel (`backdrop-blur-md`) |
| `--ds-surface-elevated` | `rgba(17, 25, 45, 0.88)` | Elevated controls, inputs, headers, nested cards |
| `--ds-text` | `#f8fafc` | Primary crisp off-white text (contrast > 16:1 on void/surface) |
| `--ds-text-muted` | `#94a3b8` | Secondary metadata text (contrast > 6.5:1 on void/surface) |
| `--ds-border` | `rgba(148, 163, 184, 0.22)` | Subtle neutral glass hairline |
| `--ds-danger` | `#fb7185` | Destructive actions & error alerts |

### High-Contrast Genre-Reactive Neon Themes (`data-genre-theme`)

Every filled neon CTA uses a calibrated dark `--ds-accent-ink` pairing achieving **≥ 7:1 WCAG AAA contrast**, while neon text and borders over dark glass maintain **≥ 4.5:1 WCAG AA contrast**.

| Theme ID | Matched TVmaze Genres / Entity | Primary Accent (`--ds-accent`) | Secondary Glow (`--ds-accent-secondary`) | CTA Ink (`--ds-accent-ink`) |
| --- | --- | --- | --- | --- |
| `default` | Default / Home / Watchlist shell | `#22d3ee` (Electric Cyan) | `#a855f7` (Neon Violet) | `#03121a` |
| `sci-fi` | Science-Fiction, Space, Cyber | `#00f0ff` (Hyper Cyan) | `#3b82f6` (Cobalt Pulse) | `#02131a` |
| `crime-thriller` | Crime, Thriller, Mystery, Espionage | `#ff4d79` (Crimson Pulse) | `#fb923c` (Amber Spark) | `#1a030a` |
| `drama` | Drama, Romance, Medical, Legal | `#c084fc` (Violet Plasma) | `#e879f9` (Fuchsia Glow) | `#13051f` |
| `comedy` | Comedy, Family, Music | `#fbbf24` (Solar Amber) | `#fb7185` (Coral Volt) | `#1a1102` |
| `horror` | Horror, Supernatural | `#f472b6` (Toxic Magenta) | `#fb7185` (Crimson Neon) | `#1a0411` |
| `fantasy` | Fantasy, Anime, Animation, Children | `#34d399` (Emerald Arcane) | `#2dd4bf` (Teal Nova) | `#021a12` |
| `action` | Action, Adventure, War, Western, Sports | `#fb923c` (Hyper Orange) | `#facc15` (Solar Gold) | `#1a0b02` |
| `documentary` | Documentary, History, Nature, Food, Travel | `#38bdf8` (Arctic Ice) | `#5eead4` (Frost Mint) | `#02131c` |
| `person` | Person Profile (Talent Spotlight) | `#facc15` (Holographic Gold) | `#818cf8` (Indigo Pulse) | `#171202` |

### Scoping Behavior
- **Page-wide Aura & Accents:** Applied via `data-genre-theme` on `<html>` (`GenreThemeProvider`):
  - **Series Profile (`/series/:id`):** Shifts smoothly to the series's primary genre.
  - **Home (`/`)**: Shifts to the highlighted **Next Binge Watch** recommendation's primary genre (or `default`).
  - **Person Profile (`/people/:id`):** Shifts to `person` (**Talent Spotlight**).
  - **Watchlist (`/watchlist`):** Uses `default` page aura while each card scopes its own `data-genre-theme`.
- **Per-Card Genre Accents:** Search Result cards and Watchlist cards set `data-genre-theme` directly on their `HudPanel` wrapper so each title reflects its own genre border and badge glow simultaneously.

---

## 3. Typography Rules

Loaded via Google Fonts in `frontend/index.html` with resilient system fallbacks:

- **Display (`font-display`):** `'Space Grotesk', system-ui, sans-serif` — geometric sci-fi authority for brand wordmark, `h1`–`h3` headings, and section titles (`tracking-tight`).
- **Body (`font-sans`):** `'Inter', system-ui, sans-serif` — crisp, high-legibility UI copy (`16px` base, `leading-relaxed`).
- **Telemetry / Mono (`font-mono`):** `'JetBrains Mono', ui-monospace, monospace` — episode codes (`S01E01`), ratings (`9.2`), years, counts, percentages, and API connectivity status.

---

## 4. Innovative Background — Layered Cyber-Atmosphere

Implemented in `CyberBackground.tsx` and `frontend/src/styles/tokens.css` (pure CSS/SVG, zero JS animation loops):
1. **Obsidian Void Base (`#05070e`)**
2. **Dual Volumetric Neon Aurora Orbs:** Two large radial-gradient ambient fields tinted by `--ds-accent` and `--ds-accent-secondary` that gently drift (`20s`/`26s` ease-in-out keyframes) and smoothly transition color (`500ms`) when the active genre changes.
3. **Perspective HUD Dot-Grid:** Crisp radial dot matrix masked softly toward the viewport edges to frame content without competing with typography.
4. **Subtle Scanline Texture:** Ultra-low-opacity horizontal lines (`0.03` alpha) adding cinematic monitor depth.
5. **Motion Accessibility:** `@media (prefers-reduced-motion: reduce)` immediately disables orb drift and decorative animations while preserving instant color transitions.

---

## 5. Design System Primitives (`frontend/src/components/ds/`)

- **`CyberBackground`**: Fixed `aria-hidden="true"` backdrop layer rendered once inside `AppLayout`.
- **`HudPanel`**: Translucent dark-glass container (`backdrop-blur-md`), `rounded-2xl`, 1px neon-tinted hairline border, subtle top specular highlight, optional `genreTheme` prop for per-card color scoping.
- **`NeonButton`**: Supports `primary` (solid `--ds-accent` fill + `--ds-accent-ink` text + neon glow hover), `secondary` (glass HUD surface + neon hairline hover), `ghost`, and `danger` variants; `min-h-[40px]`, tactile `active:scale-[0.98]`, high-contrast `focus-visible` neon ring.
- **`NeonBadge`**: Compact pill/tag supporting `accent`, `outline`, `neutral`, and `mono` variants.
- **`HudInput` & `HudSelect`**: Dark-glass form inputs (`min-h-[44px]`/`min-h-[40px]`) with accessible focus rings bound to `--ds-accent`.

---

## 6. How to Customize the Theme in the Future

- **Change global surfaces, blur, radii, or fonts:** Edit CSS custom properties under `:root` in [tokens.css](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/frontend/src/styles/tokens.css).
- **Add or tweak a genre palette:** Update the palette block in [tokens.css](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/frontend/src/styles/tokens.css) and its genre keyword mapping in [genreThemes.ts](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/frontend/src/styles/genreThemes.ts).
- **Adjust primitive geometry or elevation across the entire app:** Update the corresponding component in `frontend/src/components/ds/`.
