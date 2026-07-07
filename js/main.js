/* ===========================================================
   Quantum Cookbook — shared site behavior
   - SM-2 spaced repetition, stored in localStorage (zero backend)
   - Quiz card reveal/rate wiring
   - Resource-link panel toggles
   - Update-notification badge (purely local — see updates.html)
   =========================================================== */

const QC_STORE_KEY = "qc_cards_v1";
const QC_LATEST_VERSION = 5; // bump this whenever updates.html gets a new changelog entry

function qcCheckUpdateBadge() {
  let lastSeen = 0;
  try { lastSeen = parseInt(localStorage.getItem("qc_last_seen_version"), 10) || 0; } catch (e) {}
  if (lastSeen < QC_LATEST_VERSION) {
    document.querySelectorAll('a[href$="updates.html"]').forEach((link) => {
      link.classList.add("has-update");
    });
  }
}

function qcLoadCards() {
  try {
    return JSON.parse(localStorage.getItem(QC_STORE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function qcSaveCards(cards) {
  try {
    localStorage.setItem(QC_STORE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.warn("Quantum Cookbook: could not save review progress", e);
  }
}

// SM-2: quality 0-5. We expose three buttons mapped to 2 (hard), 4 (good), 5 (easy).
function sm2(card, quality) {
  const now = Date.now();
  let { interval = 0, ease = 2.5, reps = 0 } = card;
  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  return {
    ...card,
    interval,
    ease,
    reps,
    due: now + interval * 24 * 60 * 60 * 1000,
    lastReviewed: now,
  };
}

function qcRegisterCard(id) {
  const cards = qcLoadCards();
  if (!cards[id]) {
    cards[id] = { interval: 0, ease: 2.5, reps: 0, due: Date.now() - 1, lastReviewed: null };
    qcSaveCards(cards);
  }
}

function qcDueCount() {
  const cards = qcLoadCards();
  const now = Date.now();
  return Object.values(cards).filter((c) => c.due <= now).length;
}

function qcUpdateFab() {
  const fab = document.getElementById("review-fab");
  if (!fab) return;
  const due = qcDueCount();
  fab.dataset.due = due;
  fab.textContent = due > 0 ? `Review (${due} due)` : "Review";
}

function qcWireQuizCards() {
  document.querySelectorAll(".quiz-card").forEach((cardEl) => {
    const id = cardEl.dataset.cardId;
    qcRegisterCard(id);

    const revealBtn = cardEl.querySelector(".js-reveal");
    const answerEl = cardEl.querySelector(".quiz-answer");
    const rateEl = cardEl.querySelector(".quiz-rate");

    revealBtn.addEventListener("click", () => {
      answerEl.classList.add("is-visible");
      rateEl.classList.add("is-visible");
      revealBtn.style.display = "none";
    });

    rateEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cards = qcLoadCards();
        const quality = parseInt(btn.dataset.quality, 10);
        cards[id] = sm2(cards[id] || {}, quality);
        qcSaveCards(cards);
        qcUpdateFab();
        answerEl.classList.remove("is-visible");
        rateEl.classList.remove("is-visible");
        revealBtn.style.display = "";
        revealBtn.textContent = "Reviewed ✓ — show again";
      });
    });
  });
  qcUpdateFab();
}

function qcWireResourcePanels() {
  document.querySelectorAll(".resource-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = btn.nextElementSibling;
      const isOpen = list.classList.toggle("is-visible");
      btn.querySelector(".chev").textContent = isOpen ? "▾" : "▸";
    });
  });
}

function qcWireReviewFab() {
  const fab = document.getElementById("review-fab");
  const overlay = document.getElementById("review-overlay");
  if (!fab || !overlay) return;
  fab.addEventListener("click", () => {
    overlay.classList.add("is-visible");
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("is-visible");
  });
  const closeBtn = overlay.querySelector(".review-modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => overlay.classList.remove("is-visible"));
}

document.addEventListener("DOMContentLoaded", () => {
  qcWireQuizCards();
  qcWireResourcePanels();
  qcWireReviewFab();
  qcCheckUpdateBadge();
});