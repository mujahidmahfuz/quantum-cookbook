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
  function sumMats(Ms) {
    let out = [[re(0), re(0)], [re(0), re(0)]];
    Ms.forEach((M) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) out[i][j] = cAdd(out[i][j], M[i][j]); });
    return out;
  }
  function isIdentity(M, eps) {
    return Math.abs(M[0][0].re - 1) < eps && Math.abs(M[0][0].im) < eps &&
      Math.abs(M[1][1].re - 1) < eps && Math.abs(M[1][1].im) < eps &&
      Math.abs(M[0][1].re) < eps && Math.abs(M[0][1].im) < eps &&
      Math.abs(M[1][0].re) < eps && Math.abs(M[1][0].im) < eps;
  }

  const I2 = [[re(1), re(0)], [re(0), re(1)]];
  const X = [[re(0), re(1)], [re(1), re(0)]];
  const Y = [[re(0), { re: 0, im: -1 }], [{ re: 0, im: 1 }, re(0)]];
  const Z = [[re(1), re(0)], [re(0), re(-1)]];

  function getKraus(channel, p) {
    if (channel === "identity") return [I2];
    if (channel === "bitflip") return [scaleMat(Math.sqrt(1 - p), I2), scaleMat(Math.sqrt(p), X)];
    if (channel === "phaseflip") return [scaleMat(Math.sqrt(1 - p), I2), scaleMat(Math.sqrt(p), Z)];
    if (channel === "depolarizing") return [
      scaleMat(Math.sqrt(1 - 3 * p / 4), I2),
      scaleMat(Math.sqrt(p / 4), X),
      scaleMat(Math.sqrt(p / 4), Y),
      scaleMat(Math.sqrt(p / 4), Z),
    ];
    return [I2];
  }

  function fmtC(z) {
    const r = Math.abs(z.re) < 1e-9 ? 0 : round2(z.re);
    const i = Math.abs(z.im) < 1e-9 ? 0 : round2(z.im);
    if (i === 0) return `${r}`;
    if (r === 0) return `${i}i`;
    return `${r}${i >= 0 ? "+" : ""}${i}i`;
  }
  function matrixLatex(M) {
    return `\\begin{bmatrix}${fmtC(M[0][0])}&${fmtC(M[0][1])}\\\\${fmtC(M[1][0])}&${fmtC(M[1][1])}\\end{bmatrix}`;
  }

  let channel = "bitflip";
  let p = 0.3;

  function inputRho() {
    // fixed input: |+> state
    const SQRT1_2 = 1 / Math.sqrt(2);
    const psi = [re(SQRT1_2), re(SQRT1_2)];
    const c = (z) => ({ re: z.re, im: -z.im });
    return [[cMul(psi[0], c(psi[0])), cMul(psi[0], c(psi[1]))], [cMul(psi[1], c(psi[0])), cMul(psi[1], c(psi[1]))]];
  }

  function render() {
    const Ks = getKraus(channel, p);
    const completeness = sumMats(Ks.map((K) => matMul2(dagger(K), K)));
    const passes = isIdentity(completeness, 1e-6);

    const tag = document.getElementById("kraus-tag");
    tag.textContent = passes ? "Completeness: YES — ΣKᵢ†Kᵢ = I" : "Completeness: NO";
    tag.className = "op-status " + (passes ? "is-yes" : "is-no");

    const rho = inputRho();
    let outRho = [[re(0), re(0)], [re(0), re(0)]];
    Ks.forEach((K) => {
      const term = matMul2(matMul2(K, rho), dagger(K));
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) outRho[i][j] = cAdd(outRho[i][j], term[i][j]);
    });

    document.getElementById("kraus-count").textContent = `${Ks.length} Kraus operator${Ks.length > 1 ? "s" : ""} for this channel.`;
    document.getElementById("kraus-input").innerHTML = `$$\\rho_{in} = ${matrixLatex(rho)}$$`;
    document.getElementById("kraus-output").innerHTML = `$$\\rho_{out} = ${matrixLatex(outRho)}$$`;

    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById("kraus-widget"), { delimiters: [{ left: "$$", right: "$$", display: true }] });
    }
  }

  function init() {
    if (!document.getElementById("kraus-widget")) return;
    document.querySelectorAll(".kraus-channel-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        channel = btn.dataset.channel;
        document.querySelectorAll(".kraus-channel-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render();
      });
    });
    document.getElementById("kraus-p-slider").addEventListener("input", (e) => {
      p = parseFloat(e.target.value);
      document.getElementById("kraus-p-val").textContent = round2(p);
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();