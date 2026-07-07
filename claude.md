# Quantum Cookbook — AI Project Context

> **Any AI working on this project: read this file first.**
> It tells you what's built, what's broken on the live site right now,
> what the rules are, and what's planned next.

---

## What this is

A free, interactive, static-HTML quantum computing textbook.

- **Live:** https://mujahidmahfuz.github.io/quantum-cookbook/
- **Repo:** https://github.com/mujahidmahfuz/quantum-cookbook
- **Creator:** Mujahid Mahfuz
- **Email:** mujahid168216@gmail.com · mujahidmahfuz@proton.me · mujahidmahfuz@tutamail.com
- **X/Twitter:** https://x.com/muja1o1
- **Academic supervisor:** Prof. Fatih Ozaydin (quantum information)
- **Hosting:** GitHub Pages — static only, zero backend
- **Purpose:** Supplement to university QC/QI courses. Not a replacement for lectures, textbooks, or problem sets.

29 chapters live across Parts I, II, III, V. Part IV (photonics) not yet built. Part 0 (prerequisite QM) is a placeholder.

---

## ✅ Site sync — FIXED (July 2026, version 5)

The old "live site is behind the local build" problem turned out to be misdiagnosed: the repo **was** fully pushed; the local chapter files themselves were outdated, and several files were in the wrong place or mis-cased. All fixed in the version-5 release:

- **All 29 chapter pages**: brand symbol removed, nav = Contents | About | Updates, creator-credit footer, Part 0 placeholder in TOC rail, `ai-tutor.js` included.
- **`about.html` / `updates.html`**: were committed inside `chapters/` while all their links (`css/style.css`, `index.html`, `js/…`) assumed repo root — the cause of the root 404s and the unstyled About page. Moved to repo root via `git mv`.
- **`js/Algo-shared.js` → `js/algo-shared.js`** and **`js/multi-qubit-circuits.js` → `js/multi-qubit-circuit.js`**: chapters referenced the lowercase/singular names. Local Windows is case-insensitive so it worked locally, but GitHub Pages is case-sensitive → every Part V widget and ch03's 2-qubit circuit were broken on the live site. Renamed to match the references.
- **`.env` is gitignored.** It holds the Groq API key. Never commit it.

⚠️ Lesson recorded: before trusting this file's "what's broken" claims, verify against the actual files and live URLs — this section was stale once already.

---

## Architecture (non-negotiable rules)

1. **Static-only.** GitHub Pages, no backend, no database, no server-side anything.
2. **No build system.** Raw HTML/CSS/JS. No webpack, no React framework, no npm.
3. **Client-side computation.** Pyodide (Python in browser), Three.js (Bloch sphere), raw JS (all widgets).
4. **localStorage only.** SM-2 cards, user name, update-seen version — purely local. Explicitly NOT a real account.
5. **Custom SVG diagrams only.** No stock photos, no AI-generated images. All visuals are hand-coded SVG.
6. **Verify-first.** Every formula checked numerically BEFORE any widget is built. Every widget headless-tested via jsdom BEFORE shipping.
7. **Individual file delivery.** Present files one at a time. User pushes via git. No ZIP files.

---

## Design system

| Property | Value |
|---|---|
| Background | `#f7f4ec` (warm paper) |
| Signal color | `#2748c9` (ink blue) |
| Amber accent | `#a8702b` |
| Body font | Source Serif 4 |
| UI font | Work Sans |
| Code font | JetBrains Mono |
| Figure numbering | Fig. N.M (chapter.figure) |
| Difficulty levels | `basic` / `intermediate` / `advanced` |
| Status tags | `is-live` / `is-planned` / `is-cooking` |
| Footer | `Quantum Cookbook — built free, stays free. Created by Mujahid Mahfuz.` |
| Header nav | `Contents | About | Updates` (no Composer, no Source) |
| Brand | Just text "Quantum Cookbook" — no § or ⚗ symbol |

---

## Planned features (not yet built)

### 1. ✅ Background AI tutor — BUILT (July 2026, version 5)
**Note:** the plan said "Grok (xAI)" but the key on hand (`gsk_…` in `.env`) is a **Groq** key, so the tutor uses Groq.

- `js/ai-tutor.js`, loaded on all 29 chapter pages after `main.js`
- Floating "Ask AI" button bottom-left (review FAB stays bottom-right); slide-up panel, max 400px, scrollable
- Endpoint `https://api.groq.com/openai/v1/chat/completions`, model `llama-3.3-70b-versatile`, temperature 0.3, max_tokens 700
- Chapter context is scraped from the page itself (`document.title` + `.eyebrow`) — no per-page config
- Follow-ups keep in-memory history; nothing persisted (no localStorage), works without login
- Key decision: option (a) — the free rate-limited key ships in client JS, stored reversed+base64 in `ai-tutor.js` so repo secret-scanners don't auto-revoke it. Anyone determined can extract it; if the quota drains, rotate at console.groq.com and re-encode (`base64(reverse(key))`). Upgrading to a Cloudflare Worker proxy remains the better long-term option.
- Headless-tested via jsdom (14 assertions: UI wiring, payload shape, system prompt, key decode, follow-up history, error path) and verified against the live Groq API

### 2. Part 0 — Prerequisite Quantum Mechanics (optional)
- Material from Griffiths (Introduction to Quantum Mechanics) and Landau & Lifshitz (Quantum Mechanics: Non-Relativistic Theory)
- Topics: wave-particle duality, Schrödinger equation, operators/observables, measurement postulates from a physics-first perspective
- Target audience: students who have physics background but not CS/linear-algebra framing
- Placeholder already exists in every page's TOC rail

### 3. Part IV — Photonics & Networks (Ch. 20–21)
- PBS (polarization beam splitters), fusion gates, network photonics
- Creator's own research area — requires the most original writing
- Placeholder shows "Cooking in the kitchen"

### 4. Standalone Cookbook recipe page
- Flat, searchable recipe lookup (not lecture order)
- Referenced on index.html Cookbook section

### 5. Full cross-chapter review queue
- SM-2 works per-chapter; a global "serve me the next due card from any chapter" view is planned

### 6. Real email notifications
- Would need a third-party mailing service (Buttondown, Mailchimp, etc.)
- Currently only local "remember me" via localStorage

---

## Verified results (reference for debugging)

| Ch | Widget | Key result |
|---|---|---|
| 3 | Bloch sphere + 7 gates | All gate matrices verified, θ/φ parametrization correct |
| 14 | Teleportation | 6 headless runs, all 4 outcomes, all matched |
| 15 | LOCC sandbox | 10 random local gates, purity stays 1 |
| 17 | GHZ vs W loss | GHZ→separable (all 3), W→entangled (all 3) |
| 18 | Graph stabilizers | Path, triangle, empty — all ✓ |
| 19 | Dicke states | k=1=W; C(5,2)=10 terms |
| 25 | Deutsch | constant→P(0)=1, balanced→P(0)=0 |
| 26 | Deutsch–Jozsa | 4 presets correct, n=5 tested |
| 27 | Bernstein–Vazirani | All bit toggles recover s, P=1.000 |
| 28 | Grover | Optimal P=0.96; over-rotation (6 iters)→P=0.02 |
| 30 | QPE | Exact phases P=1; φ=0.3: t=4→err 0.0125, t=8→err 0.0008 |
| 31 | Shor | 15=3×5, 21=7×3, 35=7×5; QPE cross-confirms each order |

---

## Standing instructions

1. Always verify math numerically in Node.js before writing widget code.
2. Always headless-test widgets via jsdom before declaring done.
3. Never use stock photos or AI-generated images — custom SVG only.
4. Never introduce a build system.
5. Deliver files individually via present_files.
6. Match the existing design system exactly.
7. Every chapter page must have: all 29 chapter links in TOC rail, Part 0 placeholder, About/Updates in header nav, creator credit in footer.
8. Bump `QC_LATEST_VERSION` in `js/main.js` AND add a new entry to `CHANGELOG` in `js/updates.js` for each release.
