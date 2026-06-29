(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round2(v) { return Math.round(v * 100) / 100; }

  function partialTraceOutQ0(amps) {
    const rhoAB = [];
    for (let i = 0; i < 4; i++) { rhoAB.push([]); for (let j = 0; j < 4; j++) rhoAB[i].push(cMul(amps[i], cConj(amps[j]))); }
    const out = [[re(0), re(0)], [re(0), re(0)]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      out[i][j] = { re: rhoAB[2 * i][2 * j].re + rhoAB[2 * i + 1][2 * j + 1].re, im: rhoAB[2 * i][2 * j].im + rhoAB[2 * i + 1][2 * j + 1].im };
    }
    return out;
  }
  function purityOf(rho) {
    function mul(A, B) {
      const C = [[null, null], [null, null]];
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        let s = { re: 0, im: 0 };
        for (let k = 0; k < 2; k++) s = { re: s.re + (A[i][k].re * B[k][j].re - A[i][k].im * B[k][j].im), im: s.im + (A[i][k].re * B[k][j].im + A[i][k].im * B[k][j].re) };
        C[i][j] = s;
      }
      return C;
    }
    const r2 = mul(rho, rho);
    return r2[0][0].re + r2[1][1].re;
  }
  function fmtC(z) {
    const r = Math.abs(z.re) < 1e-9 ? 0 : round2(z.re);
    const i = Math.abs(z.im) < 1e-9 ? 0 : round2(z.im);
    if (i === 0) return `${r}`;
    if (r === 0) return `${i}i`;
    return `${r}${i >= 0 ? "+" : ""}${i}i`;
  }

  let tDeg = 0;

  function render() {
    const t = (tDeg * Math.PI) / 180;
    const amps = [re(Math.cos(t)), re(0), re(0), re(Math.sin(t))];
    const rhoA = partialTraceOutQ0(amps);
    const purity = purityOf(rhoA);

    const ketEl = document.getElementById("pt-ket");
    if (ketEl) ketEl.textContent = `|ψ⟩ = ${round2(Math.cos(t))}|00⟩ + ${round2(Math.sin(t))}|11⟩`;

    const rhoEl = document.getElementById("pt-rho");
    if (rhoEl) rhoEl.textContent = `ρ_A = [[${fmtC(rhoA[0][0])}, ${fmtC(rhoA[0][1])}], [${fmtC(rhoA[1][0])}, ${fmtC(rhoA[1][1])}]]`;

    document.getElementById("pt-purity").textContent = `Tr(ρ_A²) = ${round2(purity)}  ${purity > 0.999 ? "(q1 alone is PURE — no entanglement)" : purity < 0.501 ? "(q1 alone is MAXIMALLY MIXED — maximal entanglement)" : "(q1 alone is partially mixed)"}`;
    document.getElementById("pt-fill").style.width = (purity * 100) + "%";
    document.getElementById("pt-t-val").textContent = tDeg + "°";
  }

  function init() {
    if (!document.getElementById("pt-widget")) return;
    document.getElementById("pt-t-slider").addEventListener("input", (e) => {
      tDeg = parseFloat(e.target.value);
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();