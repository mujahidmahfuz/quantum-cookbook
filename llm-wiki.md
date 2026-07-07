# Quantum Cookbook — Complete Technical Wiki

> Any LLM reading this file should be able to fix bugs, add chapters,
> or extend features without re-reading the build history.
> See also `claude.md` for architecture rules, deployment issues, and planned features.

---

## 1. Project summary

| Field | Value |
|---|---|
| Name | Quantum Cookbook |
| Type | Free interactive quantum computing textbook |
| URL | https://mujahidmahfuz.github.io/quantum-cookbook/ |
| Repo | https://github.com/mujahidmahfuz/quantum-cookbook |
| Creator | Mujahid Mahfuz |
| Contact | mujahid168216@gmail.com · mujahidmahfuz@proton.me · mujahidmahfuz@tutamail.com · https://x.com/muja1o1 |
| Stack | Static HTML/CSS/JS on GitHub Pages. No backend. No build system. |
| Chapters | 29 live (Parts I, II, III, V). Part IV not built. Part 0 placeholder only. |

---

## 2. Technology stack

| Layer | Technology | Notes |
|---|---|---|
| Hosting | GitHub Pages | Static files only |
| Markup | Raw HTML5 | No templating, no SSG |
| Styling | Single `css/style.css` | CSS custom properties. No preprocessor. |
| Math | KaTeX 0.16.9 (CDN) | `$$...$$` display math via auto-render |
| 3D | Three.js 0.160.0 (CDN) | Bloch sphere in Ch.3 only |
| Python | Pyodide (CDN) | Lazy-loaded on first code-cell "Run" click |
| Fonts | Google Fonts (CDN) | Source Serif 4, Work Sans, JetBrains Mono |
| Storage | localStorage | SM-2 cards, user name, seen-version. Zero server calls. |

---

## 3. Complete file inventory

### Root-level pages
| File | Status on live site | Purpose |
|---|---|---|
| `index.html` | ✅ Deployed (current version) | Landing page, catalog TOC |
| `about.html` | ✅ At repo root (moved out of `chapters/` in v5) | Creator info, 6-step usage manual, contact card |
| `updates.html` | ✅ At repo root (moved out of `chapters/` in v5) | Changelog, optional local "remember me" |
| `composer.html` | ✅ Deployed | Standalone 4-qubit circuit builder |
| `README.md` | ✅ Deployed | Repo README |
| `claude.md` | New | AI project context file |
| `llm-wiki.md` | New | This file |

### CSS files
| File | Purpose |
|---|---|
| `css/style.css` | All site styling. Grows by appending per-part blocks. |
| `css/composer.css` | Composer-specific styles |

### JavaScript files — global
| File | Purpose | Key exports/behavior |
|---|---|---|
| `js/main.js` | SM-2 scheduler, quiz cards, resource panels, update badge | `QC_LATEST_VERSION = 5`, `qcCheckUpdateBadge()` |
| `js/ai-tutor.js` | "Ask AI" tutor (Groq API) on every chapter page | Floating FAB bottom-left, slide-up chat panel, stateless |
| `js/code-cell.js` | Pyodide loader, code-cell run/reset | Finds `.code-cell` figures, lazy-loads Pyodide |
| `js/algo-shared.js` | Verified algorithm engine for Part V | `window.QCAlgo` — see §5 below |
| `js/updates.js` | Changelog rendering, name persistence | `CHANGELOG` array, localStorage ops |

### JavaScript files — chapter widgets
| File | Chapter | Widget |
|---|---|---|
| `js/bloch-sphere.js` | Ch.3 | Three.js Bloch sphere |
| `js/circuit-builder.js` | Ch.3 | Single-qubit drag-drop circuit |
| `js/multi-qubit-circuit.js` | Ch.3 | 2-qubit circuit with CNOT |
| `js/composer.js` | Composer | Full 4-qubit composer |
| `js/ch01-vectors.js` | Ch.1 | Vector plane, matrix transformer, eigenvalue disc |
| `js/ch02-products.js` | Ch.2 | Inner product + outer product |
| `js/ch04-operators.js` | Ch.4 | Matrix checker (unitary/Hermitian/eigenvalues) |
| `js/ch05-tensor.js` | Ch.5 | Tensor product builders |
| `js/ch06-commutator.js` | Ch.6 | Live commutator [A,B] |
| `js/ch07-measurement.js` | Ch.7 | Repeated measurement histogram |
| `js/ch08-density.js` | Ch.8 | Ensemble builder, ρ, Tr(ρ²) |
| `js/ch09-purity.js` | Ch.9 | Purity disc |
| `js/ch10-partial-trace.js` | Ch.10 | Entanglement↔mixedness slider |
| `js/ch11-kraus.js` | Ch.11 | Kraus applicator + completeness |
| `js/ch12-damping.js` | Ch.12 | Bloch-slice damping |
| `js/ch13-amplifying.js` | Ch.13 | Generalized amplitude damping |
| `js/ch14-teleportation.js` | Ch.14 | Full 3-qubit teleportation protocol |
| `js/ch15-locc.js` | Ch.15 | Local-gate sandbox |
| `js/ch16-multipartite.js` | Ch.16 | Bipartition classifier |
| `js/ch17-ghz-w.js` | Ch.17 | GHZ vs W qubit-loss simulator |
| `js/ch18-graph-states.js` | Ch.18 | Graph builder + stabilizer verifier |
| `js/ch19-dicke.js` | Ch.19 | Dicke state n,k slider |
| `js/ch22-parallelism.js` | Ch.22 | Truth-table parallelism |
| `js/ch23-oracles.js` | Ch.23 | Phase-kickback demo |
| `js/ch24-toffoli.js` | Ch.24 | Toffoli truth table + circuit SVG |
| `js/ch25-deutsch.js` | Ch.25 | Deutsch single-query |
| `js/ch26-deutsch-jozsa.js` | Ch.26 | Deutsch–Jozsa with n-slider |
| `js/ch27-bv.js` | Ch.27 | BV hidden-string recovery |
| `js/ch28-grover.js` | Ch.28 | Grover with over-rotation demo |
| `js/ch29-qft.js` | Ch.29 | QFT period-finder |
| `js/ch30-qpe.js` | Ch.30 | QPE with adjustable t and φ |
| `js/ch31-shor.js` | Ch.31 | Complete Shor pipeline |

### Chapter HTML files (29 total)
- **Part I (7):** ch01-basic-linear-algebra through ch07-postulates-measurement
- **Part II (6):** ch08-density-matrices through ch13-amplifying-channel
- **Part III (6):** ch14-quantum-teleportation through ch19-dicke-states
- **Part V (10):** ch22-quantum-parallelism through ch31-shors-algorithm
- **Part IV (0):** Ch. 20–21 not built yet

---

## 4. CSS custom properties

```css
:root {
  --paper: #f7f4ec;        --paper-raised: #efebe2;
  --ink: #1c1a16;          --ink-muted: #6e6a60;       --ink-faint: #a39d8e;
  --signal: #2748c9;       --signal-dim: #e8ecf7;
  --amber: #a8702b;        --amber-bg: #f5eee2;
  --green: #2e7d42;        --rule: #ddd7c8;
  --radius: 5px;
  --font-body: 'Source Serif 4', serif;
  --font-ui: 'Work Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Key CSS classes
| Class | Purpose |
|---|---|
| `.site-header` / `.site-footer` | Page chrome |
| `.toc-rail` | Left sidebar chapter links |
| `.content` | Main content area |
| `.qc-figure` | Figure container (`.figure-label` + `.figure-body`) |
| `.level-tag.basic/.intermediate/.advanced` | Difficulty badges |
| `.status-tag.is-live/.is-planned/.is-cooking` | Status badges |
| `.quiz-card` | SM-2 review card |
| `.code-cell` | Pyodide code runner |
| `.resource-panel` | Collapsible further-reading |
| `.op-status.is-yes/.is-no/.is-mid` | Green/red/amber result tags |
| `.amp-bar-panel` | Part V amplitude bars |
| `.truth-table-grid` | Part V truth tables |
| `.circuit-diagram-wrap` | SVG circuit containers |
| `.protocol-step` | Part III protocol steps |
| `.graph-node/.graph-edge` | Ch.18 interactive graph |
| `.has-update` | Amber dot badge (CSS `::after`) |
| `.remember-box` | updates.html name input |
| `.changelog-entry/.is-new` | Changelog items |
| `.contact-card` | about.html contact block |

---

## 5. The shared algorithm engine (`js/algo-shared.js`)

Exports `window.QCAlgo` with these functions:

| Function | Signature | What it does |
|---|---|---|
| `hadamardTransform` | `(amps, n) → amps` | Apply H⊗n to an N=2ⁿ amplitude array |
| `applyPhaseOracle` | `(amps, f) → amps` | Flip sign where `f(x)` returns truthy |
| `popcount` | `(x) → int` | Hamming weight of integer x |
| `qft` | `(amps) → amps` | Quantum Fourier Transform |
| `iqft` | `(amps) → amps` | Inverse QFT |
| `probs` | `(amps) → float[]` | |amplitude|² for each basis state |
| `basisState` | `(N, idx) → amps` | Computational basis state |
| `gcd` | `(a, b) → int` | Euclidean algorithm |
| `findOrder` | `(a, N) → int` | Classical order-finding for Shor |

All functions use complex objects `{re: number, im: number}`. Helper functions `cMul`, `cAdd` are defined locally in each widget file (not exported).

---

## 6. Chapter page template

Every chapter follows this structure:

```
<header>  → brand "Quantum Cookbook" (no symbol), nav: Contents | About | Updates
<toc-rail> → Part 0 placeholder, Part I (7 links), Part II (6), Part III (6), Part IV cooking, Part V (10)
<main>
  <eyebrow> Part N · Chapter M
  <h1> Chapter Title
  <lesson-header> read time, prerequisites, tools, status tag
  <article>
    level-tag basic    → introductory content
    level-tag intermediate → interactive widget
    level-tag advanced → deeper theory
    code-cell → Pyodide Python
    resource-panel → further reading
  </article>
  quiz-cards (4–5) → SM-2 spaced repetition
</main>
<review-fab> → bottom-right floating button
<footer> → "Quantum Cookbook — built free, stays free. Created by Mujahid Mahfuz."
<scripts> → KaTeX, main.js, code-cell.js, chapter-specific JS
```

**Path convention in chapters/**: use `../` for root files (`../index.html`, `../about.html`, `../css/style.css`, `../js/main.js`)

---

## 7. Part-by-part chapter reference

### Part I — Foundations (Ch. 1–7)
| Ch | File | Title | Widget summary |
|---|---|---|---|
| 1 | ch01-basic-linear-algebra.html | Basic Linear Algebra | Vector plane, matrix transformer, eigenvalue disc |
| 2 | ch02-inner-outer-product.html | Inner & Outer Product | Projection + outer product builder |
| 3 | ch03-bloch-sphere.html | Qubits & Gate Intro | 3D Bloch sphere (Three.js), 1-qubit circuit, 2-qubit circuit, histogram |
| 4 | ch04-unitary-hermitian.html | Unitary & Hermitian | Matrix checker with eigenvalue display |
| 5 | ch05-tensor-kronecker-product.html | Tensor / Kronecker Product | Vector + matrix tensor builders |
| 6 | ch06-commutation-relations.html | Commutation Relations | Live [A,B] calculator |
| 7 | ch07-postulates-measurement.html | Postulates & Measurement | Repeated measurement histogram, Z/X toggle |

**Ch.3 is the most complex page** — 3 JS files (bloch-sphere, circuit-builder, multi-qubit-circuit), Three.js, links to Composer.

### Part II — Open Systems (Ch. 8–13)
| Ch | File | Title | Widget summary |
|---|---|---|---|
| 8 | ch08-density-matrices.html | Density Matrices | Ensemble builder, ρ, Tr(ρ²), ⟨M⟩ |
| 9 | ch09-pure-mixed-states.html | Pure vs. Mixed States | Purity disc (drag inside Bloch ball) |
| 10 | ch10-partial-trace.html | Partial Trace | Entanglement↔mixedness slider |
| 11 | ch11-kraus-operators.html | Kraus Operators | Applicator + completeness checker |
| 12 | ch12-amplitude-phase-damping.html | Amplitude & Phase Damping | Bloch-slice with γ slider |
| 13 | ch13-amplifying-channel.html | Amplifying Channel | Generalized damping with p-slider |

### Part III — Multipartite Entanglement (Ch. 14–19)
| Ch | File | Title | Widget summary |
|---|---|---|---|
| 14 | ch14-quantum-teleportation.html | Quantum Teleportation | Full 3-qubit sim, random measurement, correction |
| 15 | ch15-locc.html | LOCC | Local-gate sandbox (purity stays 1) |
| 16 | ch16-multipartite-entanglement.html | Multipartite Entanglement | Bipartition classifier (product/bisep/GME) |
| 17 | ch17-ghz-w-states.html | GHZ and W States | Qubit-loss simulator, reduced state display |
| 18 | ch18-cluster-graph-states.html | Cluster and Graph States | Graph builder + stabilizer verifier |
| 19 | ch19-dicke-states.html | Dicke States | n,k slider, term enumeration |

### Part IV — Photonics (Ch. 20–21)
**NOT BUILT.** Planned content: PBS, fusion gates, network photonics. Creator's research area.

### Part V — Algorithms (Ch. 22–31)
All use `js/algo-shared.js` (`window.QCAlgo`).

| Ch | File | Title | Widget summary | Key result |
|---|---|---|---|---|
| 22 | ch22-quantum-parallelism.html | Quantum Parallelism | Truth-table → amplitude bars | Signs encode f after 1 query |
| 23 | ch23-oracles.html | Oracles | Phase-kickback demonstrator | Both paths match all 4 functions |
| 24 | ch24-toffoli-gate.html | Toffoli Gate | Interactive truth table + circuit SVG | Both controls 1 → target flips |
| 25 | ch25-deutsch-algorithm.html | Deutsch's Algorithm | 1-query constant/balanced | P(0)=1 or P(0)=0, certain |
| 26 | ch26-deutsch-jozsa.html | Deutsch–Jozsa | n-slider + presets | All presets correct, n=5 tested |
| 27 | ch27-bernstein-vazirani.html | Bernstein–Vazirani | Bit-toggle hidden string | All recover s, P=1.000 |
| 28 | ch28-grovers-algorithm.html | Grover's Algorithm | Iteration slider | P=0.96 optimal; P=0.02 at 6 iters |
| 29 | ch29-quantum-fourier-transform.html | QFT | Period-finder | Periods 2,4,8 → correct peaks |
| 30 | ch30-quantum-phase-estimation.html | QPE | Adjustable t and φ | Exact phases P=1; error shrinks with t |
| 31 | ch31-shors-algorithm.html | Shor's Algorithm | Full pipeline: order + QPE + gcd | 15=3×5, 21=7×3, 35=7×5 |

---

## 8. Spaced repetition system (SM-2)

- **Algorithm:** SM-2 (SuperMemo 2)
- **Storage key:** `localStorage["qc_cards_v1"]` — JSON object, card IDs as keys
- **Quality mapping:** Hard=2, Good=4, Easy=5
- **Interval:** 1 day → 6 days → interval × ease_factor
- **Ease bounds:** minimum 1.3
- **Card ID format:** `ch{N}-q{M}` (e.g., `ch14-q1`)
- **Due count:** shown in floating "Review" button (bottom-right)
- **Per-card HTML attribute:** `data-card-id`

---

## 9. Update notification system

1. `js/main.js` defines `QC_LATEST_VERSION = 5`
2. On every page load: `qcCheckUpdateBadge()` checks `localStorage["qc_last_seen_version"]`
3. If `lastSeen < QC_LATEST_VERSION`, adds `.has-update` class → amber dot via CSS `::after`
4. `updates.html` "Mark all read" button sets localStorage to latest version
5. To release: bump `QC_LATEST_VERSION` in main.js AND add entry to `CHANGELOG` in updates.js

**localStorage keys used across the site:**
| Key | Type | Purpose |
|---|---|---|
| `qc_cards_v1` | JSON object | SM-2 card state |
| `qc_user_name` | string | Optional "remember me" name |
| `qc_last_seen_version` | integer | Last acknowledged update version |

---

## 10. AI tutor (Groq) — BUILT in v5

**Status:** LIVE. `js/ai-tutor.js`, loaded on all 29 chapter pages.
(The original plan said "Grok/xAI"; the actual key is a **Groq** key — `gsk_` prefix — so the tutor uses Groq's OpenAI-compatible API.)

**Behavior:**
- Floating "Ask AI" button: bottom-left corner (review FAB is bottom-right)
- Chat panel: slides up, max 400px tall, scrollable; close button
- Stateless: conversation lives in a JS array only — nothing in localStorage, cleared on reload
- Works without login — available to all visitors
- Follow-up questions resend full in-memory history

**Chapter context is scraped from the page** — no per-page config: `document.title` (minus the "· Quantum Cookbook" suffix) plus the `.eyebrow` text ("Part N · Chapter M") go into the system prompt.

**API details:**
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.3-70b-versatile` · temperature 0.3 · max_tokens 700
- Auth: Bearer key, stored in `ai-tutor.js` as `base64(reverse(key))` — decoded at runtime. This hides it from automated secret scanners (which would auto-revoke it) but NOT from humans; that's the accepted trade-off (free rate-limited key, static site). Source of truth for the key: `.env` (gitignored). To rotate: get a new key at console.groq.com, put it in `.env`, re-encode, update `ai-tutor.js`.

**Error handling:** non-OK responses render an amber error bubble mentioning the HTTP status and the rate-limit hint; the send button re-enables.

**Tests:** headless jsdom suite (14 assertions) — UI injection, open/close, request payload (model, system prompt contains chapter title + part, decoded key matches `.env`), response render, follow-up history, 429 error path.

---

## 11. Qubit ordering convention

**Critical for debugging — the #1 source of bugs in this codebase.**

All widgets and `algo-shared.js` use:
```
index = 2^(n-1) · q_{n-1} + ... + 2 · q_1 + q_0
```
Wire 0 is LSB (least significant bit). For a 3-qubit system with wires C(2), A(1), B(0):
```
index = 4·C + 2·A + B
```

This is consistent across ALL chapters. The `kron3(c, a, b)` helper used in Part III puts argument `c` in the MSB position.

---

## 12. Common pitfalls

1. **Brand symbol is GONE.** Old versions had `§` or `⚗` in `<span class="brand-mark">`. Removed sitewide. Don't re-add.
2. **Composer is NOT in the nav.** Linked from Ch.3 body and about.html only. Deliberately removed from header.
3. **Complex numbers are `{re, im}` objects**, not native JS. Every widget redefines `cMul`/`cAdd` locally.
4. **Chapter files live in `chapters/`** — relative paths to root use `../`.
5. **No build step.** Editing a file = editing what gets served. Push = deploy.
6. **KaTeX delimiters:** `$$...$$` only. Many chapters avoid inline math entirely, using HTML entities (⟨, ⟩, α, β) instead.
7. **Pyodide is LAZY.** The ~30MB runtime only downloads on first code-cell "Run" click.
8. **Filename case matters in production.** Windows is case-insensitive, GitHub Pages is not — `js/Algo-shared.js` silently broke every Part V widget on the live site until renamed to `algo-shared.js` (v5). Keep all filenames lowercase.
9. **`about.html` and `updates.html` live at repo ROOT** (since v5) — their links assume root. Chapter pages reach them via `../about.html` / `../updates.html`.
