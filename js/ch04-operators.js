(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cSub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  function cSqrt(z) {
    const r = Math.hypot(z.re, z.im), theta = Math.atan2(z.im, z.re);
    const sr = Math.sqrt(r);
    return { re: sr * Math.cos(theta / 2), im: sr * Math.sin(theta / 2) };
  }
  function round2(v) { return Math.round(v * 100) / 100; }

  function matMul2(A, B) {
    const C = [[null, null], [null, null]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      C[i][j] = cAdd(cMul(A[i][0], B[0][j]), cMul(A[i][1], B[1][j]));
    }
    return C;
  }
  function dagger(M) {
    return [[cConj(M[0][0]), cConj(M[1][0])], [cConj(M[0][1]), cConj(M[1][1])]];
  }
  function eig2(M) {
    const trace = cAdd(M[0][0], M[1][1]);
    const det = cSub(cMul(M[0][0], M[1][1]), cMul(M[0][1], M[1][0]));
    const disc = cSub(cMul(trace, trace), cMul({ re: 4, im: 0 }, det));
    const sq = cSqrt(disc);
    return [cMul({ re: 0.5, im: 0 }, cAdd(trace, sq)), cMul({ re: 0.5, im: 0 }, cSub(trace, sq))];
  }
  function approxEqual(A, B, eps) {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      if (Math.abs(A[i][j].re - B[i][j].re) > eps || Math.abs(A[i][j].im - B[i][j].im) > eps) return false;
    }
    return true;
  }
  const I2 = [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 1, im: 0 }]];

  function fmtC(z) {
    const re = Math.abs(z.re) < 1e-9 ? 0 : round2(z.re);
    const im = Math.abs(z.im) < 1e-9 ? 0 : round2(z.im);
    if (im === 0) return `${re}`;
    if (re === 0) return `${im}i`;
    return `${re}${im >= 0 ? "+" : ""}${im}i`;
  }
  function fmtCLatex(z) {
    const re = Math.abs(z.re) < 1e-9 ? 0 : round2(z.re);
    const im = Math.abs(z.im) < 1e-9 ? 0 : round2(z.im);
    if (im === 0) return `${re}`;
    if (re === 0) return `${im}i`;
    return `${re}${im >= 0 ? "+" : ""}${im}i`;
  }

  function readMatrix() {
    const get = (id) => parseFloat(document.getElementById(id).value) || 0;
    return [
      [{ re: get("m00re"), im: get("m00im") }, { re: get("m01re"), im: get("m01im") }],
      [{ re: get("m10re"), im: get("m10im") }, { re: get("m11re"), im: get("m11im") }],
    ];
  }
  function writeMatrix(M) {
    const set = (id, v) => { document.getElementById(id).value = v; };
    set("m00re", M[0][0].re); set("m00im", M[0][0].im);
    set("m01re", M[0][1].re); set("m01im", M[0][1].im);
    set("m10re", M[1][0].re); set("m10im", M[1][0].im);
    set("m11re", M[1][1].re); set("m11im", M[1][1].im);
  }

  function matrixToLatex(M) {
    return `\\begin{bmatrix}${fmtCLatex(M[0][0])}&${fmtCLatex(M[0][1])}\\\\${fmtCLatex(M[1][0])}&${fmtCLatex(M[1][1])}\\end{bmatrix}`;
  }

  function renderAll() {
    const M = readMatrix();
    const Md = dagger(M);
    const isHermitian = approxEqual(M, Md, 1e-6);
    const product = matMul2(Md, M);
    const isUnitary = approxEqual(product, I2, 1e-6);
    const eigs = eig2(M);

    const unitaryTag = document.getElementById("op-unitary-tag");
    const hermitianTag = document.getElementById("op-hermitian-tag");
    if (unitaryTag) {
      unitaryTag.textContent = isUnitary ? "Unitary: YES" : "Unitary: NO";
      unitaryTag.className = "op-status " + (isUnitary ? "is-yes" : "is-no");
    }
    if (hermitianTag) {
      hermitianTag.textContent = isHermitian ? "Hermitian: YES" : "Hermitian: NO";
      hermitianTag.className = "op-status " + (isHermitian ? "is-yes" : "is-no");
    }

    const daggerEl = document.getElementById("op-dagger");
    const productEl = document.getElementById("op-product");
    if (daggerEl) daggerEl.innerHTML = `$$M^\\dagger = ${matrixToLatex(Md)}$$`;
    if (productEl) productEl.innerHTML = `$$M^\\dagger M = ${matrixToLatex(product)}$$`;

    const eigEl = document.getElementById("op-eigen");
    if (eigEl) {
      const realFlags = eigs.map((e) => Math.abs(e.im) < 1e-6 ? " (real)" : " (complex!)");
      eigEl.textContent = `λ₁ = ${fmtC(eigs[0])}${realFlags[0]}    λ₂ = ${fmtC(eigs[1])}${realFlags[1]}`;
    }

    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById("op-widget"), { delimiters: [{ left: "$$", right: "$$", display: true }] });
    }
  }

  function wirePresets() {
    document.querySelectorAll(".op-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        writeMatrix(JSON.parse(btn.dataset.matrix));
        renderAll();
      });
    });
  }

  function wireInputs() {
    document.querySelectorAll("#op-widget input").forEach((el) => {
      el.addEventListener("input", renderAll);
    });
  }

  function init() {
    if (!document.getElementById("op-widget")) return;
    wirePresets();
    wireInputs();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();