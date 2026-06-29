(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round2(v) { return Math.round(v * 100) / 100; }

  function outer(psi) {
    const c = (z) => ({ re: z.re, im: -z.im });
    return [
      [cMul(psi[0], c(psi[0])), cMul(psi[0], c(psi[1]))],
      [cMul(psi[1], c(psi[0])), cMul(psi[1], c(psi[1]))],
    ];
  }
  function mix(p, A, B) {
    const out = [[null, null], [null, null]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) out[i][j] = cAdd(cMul(re(p), A[i][j]), cMul(re(1 - p), B[i][j]));
    return out;
  }
  function trace(M) { return M[0][0].re + M[1][1].re; }
  function matMul2(A, B) {
    const C = [[null, null], [null, null]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) C[i][j] = cAdd(cMul(A[i][0], B[0][j]), cMul(A[i][1], B[1][j]));
    return C;
  }
  function expect(rho, M) { return trace(matMul2(rho, M)); }

  const ZERO = [re(1), re(0)], ONE = [re(0), re(1)];
  const SQRT1_2 = 1 / Math.sqrt(2);
  const PLUS = [re(SQRT1_2), re(SQRT1_2)], MINUS = [re(SQRT1_2), re(-SQRT1_2)];
  const Zop = [[re(1), re(0)], [re(0), re(-1)]];
  const Xop = [[re(0), re(1)], [re(1), re(0)]];

  let pair = "Z"; // "Z" -> mix of |0>,|1>; "X" -> mix of |+>,|->
  let p = 0.5;

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

  function render() {
    const A = pair === "Z" ? ZERO : PLUS;
    const B = pair === "Z" ? ONE : MINUS;
    const rho = mix(p, outer(A), outer(B));
    const rho2 = matMul2(rho, rho);
    const purity = trace(rho2);

    const el = document.getElementById("ens-rho");
    if (el) el.innerHTML = `$$\\rho = ${round2(p)}|${pair === "Z" ? "0" : "+"}\\rangle\\langle${pair === "Z" ? "0" : "+"}| + ${round2(1 - p)}|${pair === "Z" ? "1" : "-"}\\rangle\\langle${pair === "Z" ? "1" : "-"}| = ${matrixLatex(rho)}$$`;

    document.getElementById("ens-trace").textContent = `Tr(ρ) = ${round2(trace(rho))}`;
    document.getElementById("ens-purity").textContent = `Tr(ρ²) = ${round2(purity)}  ${purity > 0.999 ? "(pure)" : "(mixed)"}`;
    document.getElementById("ens-expz").textContent = `⟨Z⟩ = Tr(ρZ) = ${round2(expect(rho, Zop))}`;
    document.getElementById("ens-expx").textContent = `⟨X⟩ = Tr(ρX) = ${round2(expect(rho, Xop))}`;

    const gauge = document.getElementById("ens-purity-fill");
    if (gauge) gauge.style.width = (purity * 100) + "%";

    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById("ens-widget"), { delimiters: [{ left: "$$", right: "$$", display: true }] });
    }
  }

  function init() {
    if (!document.getElementById("ens-widget")) return;
    document.querySelectorAll(".ens-pair-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        pair = btn.dataset.pair;
        document.querySelectorAll(".ens-pair-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render();
      });
    });
    document.getElementById("ens-p-slider").addEventListener("input", (e) => {
      p = parseFloat(e.target.value);
      document.getElementById("ens-p-val").textContent = round2(p);
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();