(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cSub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function round2(v) { return Math.round(v * 100) / 100; }

  function matMul2(A, B) {
    const C = [[null, null], [null, null]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      C[i][j] = cAdd(cMul(A[i][0], B[0][j]), cMul(A[i][1], B[1][j]));
    }
    return C;
  }
  function matSub(A, B) {
    return [[cSub(A[0][0], B[0][0]), cSub(A[0][1], B[0][1])], [cSub(A[1][0], B[1][0]), cSub(A[1][1], B[1][1])]];
  }
  function isZero(M, eps) {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      if (Math.abs(M[i][j].re) > eps || Math.abs(M[i][j].im) > eps) return false;
    }
    return true;
  }

  function fmtC(z) {
    const re = Math.abs(z.re) < 1e-9 ? 0 : round2(z.re);
    const im = Math.abs(z.im) < 1e-9 ? 0 : round2(z.im);
    if (im === 0) return `${re}`;
    if (re === 0) return `${im}i`;
    return `${re}${im >= 0 ? "+" : ""}${im}i`;
  }
  function matrixToLatex(M) {
    return `\\begin{bmatrix}${fmtC(M[0][0])}&${fmtC(M[0][1])}\\\\${fmtC(M[1][0])}&${fmtC(M[1][1])}\\end{bmatrix}`;
  }

  function readMatrix(prefix) {
    const get = (id) => parseFloat(document.getElementById(id).value) || 0;
    return [
      [{ re: get(prefix + "00re"), im: get(prefix + "00im") }, { re: get(prefix + "01re"), im: get(prefix + "01im") }],
      [{ re: get(prefix + "10re"), im: get(prefix + "10im") }, { re: get(prefix + "11re"), im: get(prefix + "11im") }],
    ];
  }
  function writeMatrix(prefix, M) {
    const set = (id, v) => { document.getElementById(id).value = v; };
    set(prefix + "00re", M[0][0].re); set(prefix + "00im", M[0][0].im);
    set(prefix + "01re", M[0][1].re); set(prefix + "01im", M[0][1].im);
    set(prefix + "10re", M[1][0].re); set(prefix + "10im", M[1][0].im);
    set(prefix + "11re", M[1][1].re); set(prefix + "11im", M[1][1].im);
  }

  function renderAll() {
    const A = readMatrix("ca");
    const B = readMatrix("cb");
    const AB = matMul2(A, B);
    const BA = matMul2(B, A);
    const comm = matSub(AB, BA);
    const commutes = isZero(comm, 1e-6);

    const tag = document.getElementById("commute-tag");
    if (tag) {
      tag.textContent = commutes ? "Commute: YES — [A,B] = 0" : "Commute: NO — [A,B] ≠ 0";
      tag.className = "op-status " + (commutes ? "is-yes" : "is-no");
    }

    const abEl = document.getElementById("commutator-ab");
    const baEl = document.getElementById("commutator-ba");
    const commEl = document.getElementById("commutator-comm");
    if (abEl) abEl.innerHTML = `$$AB = ${matrixToLatex(AB)}$$`;
    if (baEl) baEl.innerHTML = `$$BA = ${matrixToLatex(BA)}$$`;
    if (commEl) commEl.innerHTML = `$$[A,B] = ${matrixToLatex(comm)}$$`;

    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById("commutator-widget"), { delimiters: [{ left: "$$", right: "$$", display: true }] });
    }
  }

  function wirePresets() {
    document.querySelectorAll(".commutator-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const data = JSON.parse(btn.dataset.preset);
        writeMatrix("ca", data.A);
        writeMatrix("cb", data.B);
        renderAll();
      });
    });
  }

  function wireInputs() {
    document.querySelectorAll("#commutator-widget input").forEach((el) => {
      el.addEventListener("input", renderAll);
    });
  }

  function init() {
    if (!document.getElementById("commutator-widget")) return;
    wirePresets();
    wireInputs();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();