(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  const re = (x) => ({ re: x, im: 0 });

  function applyPairGate(amps, wire, M) {
    const dim = amps.length;
    const mask = 1 << wire;
    const out = amps.slice();
    for (let i = 0; i < dim; i++) if ((i & mask) === 0) {
      const j = i | mask, a = amps[i], b = amps[j];
      out[i] = cAdd(cMul(M[0][0], a), cMul(M[0][1], b));
      out[j] = cAdd(cMul(M[1][0], a), cMul(M[1][1], b));
    }
    return out;
  }
  const SQRT1_2 = 1 / Math.sqrt(2);
  const H = [[re(SQRT1_2), re(SQRT1_2)], [re(SQRT1_2), re(-SQRT1_2)]];
  const X = [[re(0), re(1)], [re(1), re(0)]];

  let truth = [0, 1]; // f(0), f(1)

  function applyBitFlipOracle(amps) {
    // generic single-bit oracle: |x>|y> -> |x>|y XOR f(x)>, via explicit construction
    const out = amps.slice();
    for (let x = 0; x < 2; x++) {
      if (truth[x] === 1) {
        // flip the ancilla bit (wire0) whenever the x register (wire1) equals x
        const i0 = (x << 1) | 0, i1 = (x << 1) | 1;
        const tmp = out[i0]; out[i0] = out[i1]; out[i1] = tmp;
      }
    }
    return out;
  }

  function round2(v) { return Math.round(v * 100) / 100; }

  function render() {
    const ttGrid = document.getElementById("oracle-truth-table");
    ttGrid.innerHTML = `<div class="tt-cell is-header">x</div><div class="tt-cell is-header">f(x)</div>` +
      [0, 1].map((x) => `<div class="tt-cell">${x}</div><div class="tt-cell is-toggle" data-x="${x}">${truth[x]}</div>`).join("");
    ttGrid.style.gridTemplateColumns = "repeat(2, auto)";
    ttGrid.querySelectorAll("[data-x]").forEach((cell) => {
      cell.addEventListener("click", () => {
        const x = parseInt(cell.dataset.x, 10);
        truth[x] = 1 - truth[x];
        render();
      });
    });

    // Path A: direct phase oracle on a single qubit x, starting from |+>
    let xOnly = [re(1), re(0)];
    xOnly = applyPairGate(xOnly, 0, H);
    xOnly = xOnly.map((a, x) => (truth[x] ? { re: -a.re, im: -a.im } : a));

    // Path B: bit-flip oracle with ancilla in |->, then check the x register's effective phase
    let full = [re(1), re(0), re(0), re(0)]; // |x=0>|anc=0>
    full = applyPairGate(full, 1, H); // x -> |+>
    full = applyPairGate(full, 0, X); full = applyPairGate(full, 0, H); // ancilla -> |->
    full = applyBitFlipOracle(full);
    // extract x-register amplitude relative to ancilla=0 component (since factored, anc=0 component alone tells the x phase up to the constant 1/sqrt2 from |->)
    const xFromKickback = [full[0], full[2]].map((a) => ({ re: a.re * Math.sqrt(2), im: a.im * Math.sqrt(2) }));

    document.getElementById("oracle-patha").textContent = `Direct phase oracle on x: [${xOnly.map((a) => round2(a.re)).join(", ")}]`;
    document.getElementById("oracle-pathb").textContent = `Recovered from bit-flip oracle + kickback: [${xFromKickback.map((a) => round2(a.re)).join(", ")}]`;

    const matches = xOnly.every((a, i) => Math.abs(a.re - xFromKickback[i].re) < 1e-6);
    const tag = document.getElementById("oracle-tag");
    tag.textContent = matches ? "Match: YES — phase kickback exactly reproduces the phase oracle" : "Match: NO";
    tag.className = "op-status " + (matches ? "is-yes" : "is-no");
  }

  function init() {
    if (!document.getElementById("oracle-widget")) return;
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();