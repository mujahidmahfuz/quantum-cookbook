(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round2(v) { return Math.round(v * 100) / 100; }

  const SQRT1_2 = 1 / Math.sqrt(2), SQRT1_3 = 1 / Math.sqrt(3);
  const STATES = {
    ghz: (() => { const a = new Array(8).fill(0); a[0] = SQRT1_2; a[7] = SQRT1_2; return a; })(),
    w: (() => { const a = new Array(8).fill(0); a[1] = SQRT1_3; a[2] = SQRT1_3; a[4] = SQRT1_3; return a; })(),
  };

  function partialTrace1of3(amps, traceWire) {
    const remaining = [0, 1, 2].filter((w) => w !== traceWire);
    const rho = Array.from({ length: 4 }, () => new Array(4).fill(re(0)));
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      if (((i >> traceWire) & 1) !== ((j >> traceWire) & 1)) continue;
      const ri = ((i >> remaining[1]) & 1) * 2 + ((i >> remaining[0]) & 1);
      const rj = ((j >> remaining[1]) & 1) * 2 + ((j >> remaining[0]) & 1);
      rho[ri][rj] = cAdd(rho[ri][rj], cMul(amps[i], cConj(amps[j])));
    }
    return rho;
  }

  function fmtC(z) {
    const r = Math.abs(z.re) < 1e-9 ? 0 : round2(z.re);
    const i = Math.abs(z.im) < 1e-9 ? 0 : round2(z.im);
    if (i === 0) return `${r}`;
    if (r === 0) return `${i}i`;
    return `${r}${i >= 0 ? "+" : ""}${i}i`;
  }

  let currentState = "ghz", lostWire = 2;

  function render() {
    const amps = STATES[currentState].map((x) => re(x));
    const rho = partialTrace1of3(amps, lostWire);
    const hasCoherence = rho.some((row, i) => row.some((z, j) => i !== j && (Math.abs(z.re) > 1e-6 || Math.abs(z.im) > 1e-6)));

    const grid = document.getElementById("ghzw-matrix");
    grid.innerHTML = rho.map((row) => row.map((z) => `<div class="tb-cell">${fmtC(z)}</div>`).join("")).join("");

    const tag = document.getElementById("ghzw-tag");
    tag.textContent = hasCoherence ? "Remaining 2 qubits: STILL ENTANGLED (coherence survives)" : "Remaining 2 qubits: SEPARABLE (no coherence left)";
    tag.className = "op-status " + (hasCoherence ? "is-no" : "is-yes");
  }

  function init() {
    if (!document.getElementById("ghzw-widget")) return;
    document.querySelectorAll(".ghzw-state-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentState = btn.dataset.state;
        document.querySelectorAll(".ghzw-state-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render();
      });
    });
    document.querySelectorAll(".ghzw-lose-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        lostWire = parseInt(btn.dataset.wire, 10);
        document.querySelectorAll(".ghzw-lose-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render();
      });
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();