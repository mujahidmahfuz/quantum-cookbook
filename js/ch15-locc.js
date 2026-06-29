(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round2(v) { return Math.round(v * 100) / 100; }
  const DIM = 4;

  const SQRT1_2 = 1 / Math.sqrt(2);
  const GATES = {
    I: [[re(1), re(0)], [re(0), re(1)]],
    X: [[re(0), re(1)], [re(1), re(0)]],
    Y: [[re(0), { re: 0, im: -1 }], [{ re: 0, im: 1 }, re(0)]],
    Z: [[re(1), re(0)], [re(0), re(-1)]],
    H: [[re(SQRT1_2), re(SQRT1_2)], [re(SQRT1_2), re(-SQRT1_2)]],
    S: [[re(1), re(0)], [re(0), { re: 0, im: 1 }]],
  };

  function applyPairGate(amps, wire, M) {
    const mask = 1 << wire;
    const out = amps.slice();
    for (let i = 0; i < DIM; i++) if ((i & mask) === 0) {
      const j = i | mask, a = amps[i], b = amps[j];
      out[i] = cAdd(cMul(M[0][0], a), cMul(M[0][1], b));
      out[j] = cAdd(cMul(M[1][0], a), cMul(M[1][1], b));
    }
    return out;
  }

  let state = [re(1), re(0), re(0), re(0)]; // |00>
  let appliedLog = [];

  function purityOfReducedQ(amps, wire) {
    const rho = [[re(0), re(0)], [re(0), re(0)]];
    for (let i = 0; i < DIM; i++) for (let j = 0; j < DIM; j++) {
      if (((i >> (1 - wire)) & 1) !== ((j >> (1 - wire)) & 1)) continue; // match the OTHER wire
      const ri = (i >> wire) & 1, rj = (j >> wire) & 1;
      rho[ri][rj] = cAdd(rho[ri][rj], cMul(amps[i], cConj(amps[j])));
    }
    function mul(A, B) {
      const C = [[null, null], [null, null]];
      for (let p = 0; p < 2; p++) for (let q = 0; q < 2; q++) {
        let s = { re: 0, im: 0 };
        for (let k = 0; k < 2; k++) s = { re: s.re + (A[p][k].re * B[k][q].re - A[p][k].im * B[k][q].im), im: s.im + (A[p][k].re * B[k][q].im + A[p][k].im * B[k][q].re) };
        C[p][q] = s;
      }
      return C;
    }
    const r2 = mul(rho, rho);
    return r2[0][0].re + r2[1][1].re;
  }

  function render() {
    document.getElementById("locc-log").textContent = appliedLog.length ? appliedLog.join("  →  ") : "(no gates applied yet — still |00⟩)";
    const purity0 = purityOfReducedQ(state, 0);
    const purity1 = purityOfReducedQ(state, 1);
    document.getElementById("locc-purity").textContent = `Tr(ρ_A²) = ${round2(purity0)}    Tr(ρ_B²) = ${round2(purity1)}`;
    const tag = document.getElementById("locc-tag");
    const stillProduct = purity0 > 0.999 && purity1 > 0.999;
    tag.textContent = stillProduct ? "Still a product state — zero entanglement, no matter what you clicked" : "Entangled!? (shouldn't be possible here — tell us if you see this)";
    tag.className = "op-status " + (stillProduct ? "is-yes" : "is-no");
  }

  function init() {
    if (!document.getElementById("locc-widget")) return;
    let selectedWire = 0;
    document.querySelectorAll(".locc-wire-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedWire = parseInt(btn.dataset.wire, 10);
        document.querySelectorAll(".locc-wire-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });
    document.querySelectorAll(".locc-gate-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state = applyPairGate(state, selectedWire, GATES[btn.dataset.gate]);
        appliedLog.push(`${btn.dataset.gate} on q${selectedWire}`);
        render();
      });
    });
    document.getElementById("locc-reset").addEventListener("click", () => {
      state = [re(1), re(0), re(0), re(0)];
      appliedLog = [];
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();