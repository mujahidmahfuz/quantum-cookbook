(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round2(v) { return Math.round(v * 100) / 100; }

  function purityOfReduced1of3(amps, keepWire) {
    const rho = [[re(0), re(0)], [re(0), re(0)]];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      let match = true;
      for (let w = 0; w < 3; w++) if (w !== keepWire && ((i >> w) & 1) !== ((j >> w) & 1)) match = false;
      if (!match) continue;
      const ri = (i >> keepWire) & 1, rj = (j >> keepWire) & 1;
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

  const SQRT1_2 = 1 / Math.sqrt(2), SQRT1_3 = 1 / Math.sqrt(3);
  const PRESETS = {
    product: { label: "Product: |000⟩", amps: (() => { const a = new Array(8).fill(0); a[0] = 1; return a; })() },
    biseparable: { label: "Biseparable: Bell(q0,q1) ⊗ |0⟩₂", amps: (() => { const a = new Array(8).fill(0); a[0] = SQRT1_2; a[3] = SQRT1_2; return a; })() },
    ghz: { label: "GHZ: (|000⟩+|111⟩)/√2", amps: (() => { const a = new Array(8).fill(0); a[0] = SQRT1_2; a[7] = SQRT1_2; return a; })() },
    w: { label: "W: (|001⟩+|010⟩+|100⟩)/√3", amps: (() => { const a = new Array(8).fill(0); a[1] = SQRT1_3; a[2] = SQRT1_3; a[4] = SQRT1_3; return a; })() },
  };

  function render(presetKey) {
    const preset = PRESETS[presetKey];
    const amps = preset.amps.map((x) => re(x));
    document.getElementById("mp-state-label").textContent = preset.label;

    const purities = [0, 1, 2].map((w) => purityOfReduced1of3(amps, w));
    const labels = ["q0 | q1,q2", "q1 | q0,q2", "q2 | q0,q1"];
    const rows = document.getElementById("mp-bipartitions");
    rows.innerHTML = purities.map((p, i) => {
      const entangled = p < 0.999;
      return `<div class="bipartition-row"><span>${labels[i]}</span><span style="color: ${entangled ? "var(--amber)" : "var(--green)"};">${entangled ? "ENTANGLED" : "separable"} (Tr(ρ²)=${round2(p)})</span></div>`;
    }).join("");

    const allSeparable = purities.every((p) => p > 0.999);
    const allEntangled = purities.every((p) => p < 0.999);
    const tag = document.getElementById("mp-classification");
    if (allSeparable) {
      tag.textContent = "Fully separable — no entanglement anywhere";
      tag.className = "op-status is-yes";
    } else if (allEntangled) {
      tag.textContent = "Genuinely multipartite entangled — every bipartition shows entanglement";
      tag.className = "op-status is-no";
    } else {
      tag.textContent = "Biseparable — entangled across some bipartitions, separable across at least one";
      tag.className = "op-status is-mid";
    }
  }

  function init() {
    if (!document.getElementById("mp-widget")) return;
    document.querySelectorAll(".mp-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".mp-preset-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render(btn.dataset.preset);
      });
    });
    render("product");
  }

  document.addEventListener("DOMContentLoaded", init);
})();