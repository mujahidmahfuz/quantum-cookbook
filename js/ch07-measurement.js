(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  function innerProduct(v, psi) {
    let s = { re: 0, im: 0 };
    for (let i = 0; i < v.length; i++) s = cAdd(s, cMul(cConj(v[i]), psi[i]));
    return s;
  }
  function prob(v, psi) { const ip = innerProduct(v, psi); return ip.re * ip.re + ip.im * ip.im; }

  const SQRT1_2 = 1 / Math.sqrt(2);
  const BASES = {
    Z: { v0: [{ re: 1, im: 0 }, { re: 0, im: 0 }], v1: [{ re: 0, im: 0 }, { re: 1, im: 0 }], label0: "0", label1: "1" },
    X: { v0: [{ re: SQRT1_2, im: 0 }, { re: SQRT1_2, im: 0 }], v1: [{ re: SQRT1_2, im: 0 }, { re: -SQRT1_2, im: 0 }], label0: "+", label1: "−" },
  };

  let theta = Math.PI / 2, phi = 0;
  let basis = "Z";
  let counts = { 0: 0, 1: 0 };

  function currentState() {
    return [{ re: Math.cos(theta / 2), im: 0 }, { re: Math.sin(theta / 2) * Math.cos(phi), im: Math.sin(theta / 2) * Math.sin(phi) }];
  }

  function theoreticalProbs() {
    const psi = currentState();
    const B = BASES[basis];
    return [prob(B.v0, psi), prob(B.v1, psi)];
  }

  function renderState() {
    const ketEl = document.getElementById("meas-ket");
    if (ketEl && window.katex) {
      const thetaDeg = ((theta * 180) / Math.PI).toFixed(0);
      const phiDeg = ((((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 180 / Math.PI).toFixed(0);
      katex.render(`|\\psi\\rangle = \\cos\\tfrac{\\theta}{2}|0\\rangle + e^{i\\phi}\\sin\\tfrac{\\theta}{2}|1\\rangle \\quad (\\theta=${thetaDeg}^\\circ,\\ \\phi=${phiDeg}^\\circ)`, ketEl);
    }
    document.getElementById("theta-val-m").textContent = `${((theta * 180) / Math.PI).toFixed(0)}°`;
    document.getElementById("phi-val-m").textContent = `${((((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 180 / Math.PI).toFixed(0)}°`;
    renderHistogram();
  }

  function renderHistogram() {
    const [p0, p1] = theoreticalProbs();
    const total = counts[0] + counts[1];
    const B = BASES[basis];

    document.getElementById("meas-label-0").textContent = `|${B.label0}⟩`;
    document.getElementById("meas-label-1").textContent = `|${B.label1}⟩`;

    const bar0 = document.getElementById("meas-bar-0"), bar1 = document.getElementById("meas-bar-1");
    const line0 = document.getElementById("meas-theory-0"), line1 = document.getElementById("meas-theory-1");
    const val0 = document.getElementById("meas-val-0"), val1 = document.getElementById("meas-val-1");

    const emp0 = total > 0 ? counts[0] / total : 0;
    const emp1 = total > 0 ? counts[1] / total : 0;
    bar0.style.height = (emp0 * 100) + "%";
    bar1.style.height = (emp1 * 100) + "%";
    line0.style.bottom = (p0 * 130) + "px";
    line1.style.bottom = (p1 * 130) + "px";
    val0.textContent = total > 0 ? `${counts[0]}/${total} = ${(emp0 * 100).toFixed(1)}%  (theory ${(p0 * 100).toFixed(1)}%)` : `theory ${(p0 * 100).toFixed(1)}%`;
    val1.textContent = total > 0 ? `${counts[1]}/${total} = ${(emp1 * 100).toFixed(1)}%  (theory ${(p1 * 100).toFixed(1)}%)` : `theory ${(p1 * 100).toFixed(1)}%`;

    const readout = document.getElementById("meas-readout");
    if (readout) readout.textContent = total === 0 ? "No shots yet — click \"Run 100 shots\" to start sampling." : `Total shots: ${total}. As this grows, the bars (amber line = exact Born-rule probability) converge to the theoretical value — the law of large numbers in action.`;
  }

  function runShots(n) {
    const [p0] = theoreticalProbs();
    for (let i = 0; i < n; i++) {
      counts[Math.random() < p0 ? 0 : 1]++;
    }
    renderHistogram();
  }

  function wireControls() {
    const thetaSlider = document.getElementById("theta-slider-m");
    const phiSlider = document.getElementById("phi-slider-m");
    thetaSlider.addEventListener("input", (e) => { theta = parseFloat(e.target.value); renderState(); });
    phiSlider.addEventListener("input", (e) => { phi = parseFloat(e.target.value); renderState(); });

    document.querySelectorAll(".meas-basis-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        basis = btn.dataset.basis;
        document.querySelectorAll(".meas-basis-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        counts = { 0: 0, 1: 0 };
        renderState();
      });
    });

    document.getElementById("meas-run").addEventListener("click", () => runShots(100));
    document.getElementById("meas-reset").addEventListener("click", () => { counts = { 0: 0, 1: 0 }; renderHistogram(); });
  }

  function init() {
    if (!document.getElementById("meas-widget")) return;
    wireControls();
    renderState();
  }

  document.addEventListener("DOMContentLoaded", init);
})();