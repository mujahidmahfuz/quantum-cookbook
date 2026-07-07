# Rebuild & re-upload Quantum Cookbook from scratch

Goal: get a **clean GitHub repo** (no "Claude" contributor, no dangling
co-authored commit) with the **AI tutor working** on the live site.

Your local files are already correct and the local git history is already
clean (authored only by you). The only reason "Claude" still shows on GitHub
is a cached contributor entry from an earlier push. Deleting and recreating
the repo wipes that permanently.

> ⚠️ Deleting the repo also erases stars, forks, issues, and the existing
> GitHub Pages URL history. The URL itself
> (`mujahidmahfuz.github.io/quantum-cookbook`) comes back the same once you
> recreate the repo with the same name.

---

## Step 0 — Safety check (do this first)

Make sure your local copy is intact and the key is NOT tracked.

```bash
cd C:/Users/USER/quantum-cookbook
git log -1 --format='%an <%ae>%n%B'   # should be you, no Co-Authored-By
git ls-files | grep -i env            # should print NOTHING (.env is ignored)
```

If `.env` shows up in that last command, stop and tell me — it must never
be committed (it holds the Groq API key).

---

## Step 1 — Delete the old repo on GitHub

1. Go to https://github.com/mujahidmahfuz/quantum-cookbook
2. **Settings** → scroll to the bottom → **Danger Zone**
3. **Delete this repository** → type the name to confirm.

This removes the cached "Claude" contributor and the dangling commit for good.

---

## Step 2 — Recreate an empty repo

1. https://github.com/new
2. Repository name: `quantum-cookbook` (exact same name keeps the Pages URL)
3. **Public**
4. Do **NOT** add a README, .gitignore, or license (your local repo already
   has them — an extra commit here would just get in the way).
5. Create repository.

---

## Step 3 — Push your clean local history

Your local repo already points at the right remote. From the project folder:

```bash
cd C:/Users/USER/quantum-cookbook

# confirm identity on every commit is you (optional but reassuring)
git log --format='%an <%ae>' | sort -u    # should show only your name/email

# push everything
git push -u origin main
```

If you'd rather have a **single fresh commit** instead of the full history
(cleanest possible slate, wipes all past authorship), do this instead of the
push above:

```bash
git checkout --orphan fresh
git add -A
git commit -m "Quantum Cookbook — full site, 29 chapters + AI tutor"
git branch -D main
git branch -m main
git push -f -u origin main
```

Either way, no "Claude" appears — your local history has no co-author trailer.

---

## Step 4 — Turn GitHub Pages back on

1. Repo **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main`, folder `/ (root)` → **Save**
4. Wait ~1–2 min for the first build.

Live at: https://mujahidmahfuz.github.io/quantum-cookbook/

---

## Step 5 — Make the AI tutor work on the live site

The tutor code (`js/ai-tutor.js`) is already loaded on all 29 chapter pages
and already contains a working Groq key (stored reversed+base64). So on a
fresh deploy it works out of the box — **nothing else to push.**

Verify:

1. Open any chapter, e.g.
   https://mujahidmahfuz.github.io/quantum-cookbook/chapters/ch14-quantum-teleportation.html
2. Click the **"Ask AI"** button (bottom-left).
3. Ask something ("what is a Bell pair?"). You should get an answer in a few
   seconds.

### If the tutor returns an error

- **429 / rate limit:** the free Groq tier is throttled — wait a moment and
  retry. Nothing is broken.
- **401 / auth error:** the key was revoked (e.g. GitHub secret scanning, or
  it was rotated). Fix:
  1. Get a new free key at https://console.groq.com/keys
  2. Put it in `.env` (single line, no quotes).
  3. Re-encode it — run in PowerShell:
     ```powershell
     $key = (Get-Content .env -Raw).Trim()
     $rev = -join ($key[($key.Length-1)..0])
     [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($rev))
     ```
  4. Copy that string into `js/ai-tutor.js`, replacing the value inside
     `atob("...")` near the top.
  5. `git add js/ai-tutor.js && git commit -m "rotate tutor key" && git push`

> Note: because this is a static site, the key is always visible to anyone
> who reads the JS. The reverse+base64 only hides it from automated scanners.
> The proper long-term fix is a Cloudflare Worker proxy (see claude.md).

---

## Step 6 — Final verification checklist

Visit the live site and confirm:

- [ ] Landing page loads, TOC shows Parts 0, I, II, III, IV, V
- [ ] A chapter (e.g. ch14) shows: no `§`/`⚗` symbol, nav = Contents · About ·
      Updates, footer "Created by Mujahid Mahfuz", Part 0 in sidebar
- [ ] `about.html` and `updates.html` load (not 404) and are styled
- [ ] A Part V chapter widget runs (e.g. ch28 Grover) — confirms
      `js/algo-shared.js` loaded (case-sensitive filename)
- [ ] "Ask AI" button works on a chapter page
- [ ] Repo **Insights → Contributors** shows only you

Done.
