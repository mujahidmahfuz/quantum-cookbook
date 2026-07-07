(function () {
  const CHANGELOG = [
    { version: 5, title: "AI tutor + full site sync", date: "Jul 2026", desc: "Every chapter now has an \"Ask AI\" button (bottom-left): a free AI tutor that knows which chapter you're reading — ask it anything, no login needed, nothing saved. Also in this release: fixed the algorithm engine and 2-qubit circuit not loading on the live site, unified the header (Contents · About · Updates) and footer across all 29 chapters, added the Part 0 placeholder to every chapter's sidebar, and fixed the About and Updates pages." },
    { version: 4, title: "Part V — Algorithms", date: "Jun 2026", desc: "10 chapters: Quantum Parallelism, Oracles, the Toffoli gate, Deutsch's Algorithm, Deutsch–Jozsa, Bernstein–Vazirani, Grover's Algorithm, the Quantum Fourier Transform, Quantum Phase Estimation, and Shor's Algorithm. Look for: every chapter has a real circuit diagram and a live widget — Ch. 31's widget runs the entire Shor's algorithm pipeline end to end, including an independent quantum-phase-estimation cross-check of the answer." },
    { version: 3, title: "Part III — Multipartite Entanglement", date: "Jun 2026", desc: "6 chapters: Quantum Teleportation, LOCC, Multipartite Entanglement, GHZ and W States, Cluster and Graph States, Dicke States. Look for: Ch. 14's teleportation widget runs a real random 3-qubit measurement every click; Ch. 17 lets you watch GHZ and W states behave completely differently under qubit loss." },
    { version: 2, title: "Part II — Open Quantum Systems", date: "Jun 2026", desc: "6 chapters: Density Matrices, Pure vs. Mixed States, Partial Trace, Kraus Operators, Amplitude & Phase Damping, the Amplifying Channel. Look for: Ch. 10's single slider showing entanglement directly causing mixedness in a subsystem." },
    { version: 1, title: "Part I — Foundations, and the Quantum Composer", date: "Jun 2026", desc: "7 chapters: Basic Linear Algebra through Postulates & Measurement, plus the standalone Quantum Composer (4-qubit circuit builder with OpenQASM, a Q-sphere, and a gate-matrix inspector). Look for: every gate button on the Bloch sphere in Ch. 3 is a real matrix multiplication, not a canned animation." },
  ];

  function renderChangelog() {
    let lastSeen = 0;
    try { lastSeen = parseInt(localStorage.getItem("qc_last_seen_version"), 10) || 0; } catch (e) {}

    const list = document.getElementById("changelog-list");
    list.innerHTML = CHANGELOG.map((entry) => {
      const isNew = entry.version > lastSeen;
      return `<div class="changelog-entry${isNew ? " is-new" : ""}">
        <h3>${entry.title}${isNew ? '<span class="cl-badge">New to you</span>' : ""}</h3>
        <span class="cl-date">${entry.date}</span>
        <p>${entry.desc}</p>
      </div>`;
    }).join("");
  }

  function renderRememberBox() {
    let name = "";
    try { name = localStorage.getItem("qc_user_name") || ""; } catch (e) {}
    const greeting = document.getElementById("remember-greeting");
    const input = document.getElementById("remember-name-input");
    if (name) {
      greeting.textContent = `Welcome back, ${name}.`;
      input.value = name;
    } else {
      greeting.textContent = "You're not signed in — and you don't need to be to use anything on this site.";
    }
  }

  function init() {
    if (!document.getElementById("changelog-list")) return;
    renderChangelog();
    renderRememberBox();

    document.getElementById("remember-save").addEventListener("click", () => {
      const val = document.getElementById("remember-name-input").value.trim();
      try { localStorage.setItem("qc_user_name", val); } catch (e) {}
      renderRememberBox();
    });
    document.getElementById("remember-forget").addEventListener("click", () => {
      try { localStorage.removeItem("qc_user_name"); } catch (e) {}
      document.getElementById("remember-name-input").value = "";
      renderRememberBox();
    });
    document.getElementById("mark-read").addEventListener("click", () => {
      try { localStorage.setItem("qc_last_seen_version", String(CHANGELOG[0].version)); } catch (e) {}
      renderChangelog();
      document.querySelectorAll('a[href$="updates.html"]').forEach((l) => l.classList.remove("has-update"));
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();