(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round2(v) { return Math.round(v * 100) / 100; }

  function matMul2(A, B) {
    const C = [[null, null], [null, null]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) C[i][j] = cAdd(cMul(A[i][0], B[0][j]), cMul(A[i][1], B[1][j]));
    return C;
  }
  function dagger(M) { return [[cConj(M[0][0]), cConj(M[1][0])], [cConj(M[0][1]), cConj(M[1][1])]]; }
  function scaleMat(c, M) { return M.map((row) => row.map((z) => cMul(re(c), z))); }
  function applyChannel(Ks, rho) {
    let out = [[re(0), re(0)], [re(0), re(0)]];
    Ks.forEach((K) => {
      const t = matMul2(matMul2(K, rho), dagger(K));
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) out[i][j] = cAdd(out[i][j], t[i][j]);
    });
    return out;
  }
  function rhoFromTheta(thetaRad) {
    const c = Math.cos(thetaRad / 2), s = Math.sin(thetaRad / 2);
    const psi = [re(c), re(s)];
    const cc = (z) => ({ re: z.re, im: -z.im });
    return [[cMul(psi[0], cc(psi[0])), cMul(psi[0], cc(psi[1]))], [cMul(psi[1], cc(psi[0])), cMul(psi[1], cc(psi[1]))]];
  }
  function blochFromRho(rho) { return { rx: 2 * rho[0][1].re, rz: rho[0][0].re - rho[1][1].re }; }

  function genAmpDamping(p, gamma) {
    const M0 = scaleMat(Math.sqrt(p), [[re(1), re(0)], [re(0), re(Math.sqrt(1 - gamma))]]);
    const M1 = scaleMat(Math.sqrt(p), [[re(0), re(Math.sqrt(gamma))], [re(0), re(0)]]);
    const M2 = scaleMat(Math.sqrt(1 - p), [[re(Math.sqrt(1 - gamma)), re(0)], [re(0), re(1)]]);
    const M3 = scaleMat(Math.sqrt(1 - p), [[re(0), re(0)], [re(Math.sqrt(gamma)), re(0)]]);
    return [M0, M1, M2, M3];
  }

  const SIZE = 200, CX = 100, CY = 100, R = 80;
  let thetaDeg = 0, gamma = 0.4, p = 0;

  function render() {
    const svg = document.getElementById("amp-svg");
    if (!svg) return;
    const theta = (thetaDeg * Math.PI) / 180;
    const rhoIn = rhoFromTheta(theta);
    const Ks = genAmpDamping(p, gamma);
    const rhoOut = applyChannel(Ks, rhoIn);
    const bIn = blochFromRho(rhoIn);
    const bOut = blochFromRho(rhoOut);

    const toPx = (rx, rz) => ({ px: CX + rx * R, py: CY - rz * R });
    const pIn = toPx(bIn.rx, bIn.rz);
    const pOut = toPx(bOut.rx, bOut.rz);

    svg.innerHTML = `
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#ddd7c8" stroke-width="1.5" />
      <line x1="${CX}" y1="${CY - R - 8}" x2="${CX}" y2="${CY + R + 8}" stroke="#a39d8e" stroke-width="1" />
      <text x="${CX + 6}" y="${CY - R - 10}" font-family="JetBrains Mono, monospace" font-size="11" fill="#6e6a60">|0⟩</text>
      <text x="${CX + 6}" y="${CY + R + 20}" font-family="JetBrains Mono, monospace" font-size="11" fill="#6e6a60">|1⟩</text>
      <line x1="${pIn.px}" y1="${pIn.py}" x2="${pOut.px}" y2="${pOut.py}" stroke="#a39d8e" stroke-width="1.4" stroke-dasharray="3 3" />
      <circle cx="${pIn.px}" cy="${pIn.py}" r="7" fill="none" stroke="#2748c9" stroke-width="2.4" />
      <circle cx="${pOut.px}" cy="${pOut.py}" r="7" fill="#a8702b" />
    `;

    document.getElementById("amp-readout").textContent = `Input: (rx,rz)=(${round2(bIn.rx)}, ${round2(bIn.rz)})    Output: (rx,rz)=(${round2(bOut.rx)}, ${round2(bOut.rz)})`;
    document.getElementById("amp-theta-val").textContent = thetaDeg + "°";
    document.getElementById("amp-gamma-val").textContent = round2(gamma);
    document.getElementById("amp-p-val").textContent = round2(p);
    document.getElementById("amp-p-label").textContent = p > 0.999 ? "(pure damping, Ch. 12)" : p < 0.001 ? "(pure amplifying)" : "(a blend of both)";
  }

  function init() {
    if (!document.getElementById("amp-widget")) return;
    document.getElementById("amp-theta-slider").addEventListener("input", (e) => { thetaDeg = parseFloat(e.target.value); render(); });
    document.getElementById("amp-gamma-slider").addEventListener("input", (e) => { gamma = parseFloat(e.target.value); render(); });
    document.getElementById("amp-p-slider").addEventListener("input", (e) => { p = parseFloat(e.target.value); render(); });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();