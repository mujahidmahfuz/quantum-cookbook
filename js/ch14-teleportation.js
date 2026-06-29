(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round2(v) { return Math.round(v * 100) / 100; }
  const DIM = 8;

  function kron3(c, a, b) {
    const out = new Array(DIM);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) out[4 * i + 2 * j + k] = cMul(cMul(c[i], a[j]), b[k]);
    return out;
  }
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
  function applyCNOT(amps, control, target) {
    const out = new Array(DIM).fill(null);
    for (let i = 0; i < DIM; i++) { let j = i; if ((i >> control) & 1) j = i ^ (1 << target); out[j] = amps[i]; }
    return out;
  }
  const SQRT1_2 = 1 / Math.sqrt(2);
  const H = [[re(SQRT1_2), re(SQRT1_2)], [re(SQRT1_2), re(-SQRT1_2)]];
  const X = [[re(0), re(1)], [re(1), re(0)]];
  const Z = [[re(1), re(0)], [re(0), re(-1)]];

  let thetaDeg = 60, phiDeg = 40;

  function fmtC(z) {
    const r = Math.abs(z.re) < 1e-9 ? 0 : round2(z.re);
    const i = Math.abs(z.im) < 1e-9 ? 0 : round2(z.im);
    if (i === 0) return `${r}`;
    if (r === 0) return `${i}i`;
    return `${r}${i >= 0 ? "+" : ""}${i}i`;
  }

  function runProtocol() {
    const theta = (thetaDeg * Math.PI) / 180, phi = (phiDeg * Math.PI) / 180;
    const a0 = re(Math.cos(theta / 2));
    const a1 = { re: Math.sin(theta / 2) * Math.cos(phi), im: Math.sin(theta / 2) * Math.sin(phi) };
    const phiC = [a0, a1];
    const zero = [re(1), re(0)];

    document.getElementById("tp-original").textContent = `|φ⟩ = ${fmtC(a0)}|0⟩ + ${fmtC(a1)}|1⟩`;

    let state = kron3(phiC, zero, zero); // wires: 2=C, 1=A, 0=B
    state = applyPairGate(state, 1, H);
    state = applyCNOT(state, 1, 0); // Bell pair on A,B
    state = applyCNOT(state, 2, 1); // CNOT C->A
    state = applyPairGate(state, 2, H); // H on C

    // Simulate the random measurement: compute probabilities for each (C,A) outcome, sample
    const probs = [];
    for (let c = 0; c < 2; c++) for (let a = 0; a < 2; a++) {
      let p = 0;
      for (let d = 0; d < 2; d++) {
        const idx = (c << 2) | (a << 1) | d;
        p += state[idx].re ** 2 + state[idx].im ** 2;
      }
      probs.push({ c, a, p });
    }
    const r = Math.random();
    let cum = 0, chosen = probs[0];
    for (const pr of probs) { cum += pr.p; if (r <= cum) { chosen = pr; break; } }

    const i0 = (chosen.c << 2) | (chosen.a << 1) | 0;
    const i1 = (chosen.c << 2) | (chosen.a << 1) | 1;
    const raw = [state[i0], state[i1]];
    const norm = Math.sqrt(raw[0].re ** 2 + raw[0].im ** 2 + raw[1].re ** 2 + raw[1].im ** 2);
    let bob = raw.map((z) => ({ re: z.re / norm, im: z.im / norm }));

    document.getElementById("tp-outcome").textContent = `Alice measured: C=${chosen.c}, A=${chosen.a} (sent to Bob as 2 classical bits)`;
    document.getElementById("tp-before-correction").textContent = `Bob's qubit before correction: ${fmtC(bob[0])}|0⟩ + ${fmtC(bob[1])}|1⟩`;

    function applyMat(v, M) {
      return [cAdd(cMul(M[0][0], v[0]), cMul(M[0][1], v[1])), cAdd(cMul(M[1][0], v[0]), cMul(M[1][1], v[1]))];
    }
    if (chosen.a === 1) bob = applyMat(bob, X);
    if (chosen.c === 1) bob = applyMat(bob, Z);

    document.getElementById("tp-correction").textContent = `Correction applied: ${chosen.a === 1 ? "X " : ""}${chosen.c === 1 ? "Z" : ""}${chosen.a === 0 && chosen.c === 0 ? "(none needed)" : ""}`;
    document.getElementById("tp-final").textContent = `Bob's qubit after correction: ${fmtC(bob[0])}|0⟩ + ${fmtC(bob[1])}|1⟩`;

    const matches = Math.abs(bob[0].re - a0.re) < 1e-6 && Math.abs(bob[1].re - a1.re) < 1e-6 && Math.abs(bob[1].im - a1.im) < 1e-6;
    const tag = document.getElementById("tp-match-tag");
    tag.textContent = matches ? "Match: YES — Bob's qubit is exactly |φ⟩" : "Match: NO";
    tag.className = "op-status " + (matches ? "is-yes" : "is-no");
  }

  function init() {
    if (!document.getElementById("tp-widget")) return;
    document.getElementById("tp-theta-slider").addEventListener("input", (e) => { thetaDeg = parseFloat(e.target.value); document.getElementById("tp-theta-val").textContent = thetaDeg + "°"; });
    document.getElementById("tp-phi-slider").addEventListener("input", (e) => { phiDeg = parseFloat(e.target.value); document.getElementById("tp-phi-val").textContent = phiDeg + "°"; });
    document.getElementById("tp-run").addEventListener("click", runProtocol);
    runProtocol();
  }

  document.addEventListener("DOMContentLoaded", init);
})();