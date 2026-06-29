(function () {
  let n = 3;
  let truth = [];

  function setPreset(kind) {
    const N = 1 << n;
    if (kind === "constant0") truth = new Array(N).fill(0);
    else if (kind === "constant1") truth = new Array(N).fill(1);
    else if (kind === "balanced-parity") truth = new Array(N).fill(0).map((_, x) => window.QCAlgo.popcount(x) % 2);
    else if (kind === "balanced-msb") truth = new Array(N).fill(0).map((_, x) => (x >> (n - 1)) & 1);
  }

  function render() {
    const A = window.QCAlgo;
    const N = 1 << n;

    let amps = A.basisState(N, 0);
    amps = A.hadamardTransform(amps, n);
    amps = A.applyPhaseOracle(amps, (x) => truth[x]);
    amps = A.hadamardTransform(amps, n);
    const p = A.probs(amps);
    const p0 = p[0];

    const panel = document.getElementById("dj-amps");
    panel.innerHTML = p.map((prob, x) => {
      const h = Math.round(prob * 130);
      return `<div class="amp-bar-col">
        <div class="amp-bar-track"><div class="amp-bar-fill${x === 0 ? "" : " is-neg"}" style="height:${h}px;"></div></div>
        <div class="amp-bar-label">${x.toString(2).padStart(n, "0")}</div>
      </div>`;
    }).join("");

    document.getElementById("dj-result").innerHTML =
      p0 > 0.999
        ? `P(measure all-zero) = <strong>1.000</strong> → f is <strong>CONSTANT</strong>, certain from 1 query.`
        : `P(measure all-zero) = <strong>${p0.toFixed(3)}</strong> → f is <strong>BALANCED</strong> (any nonzero outcome proves it — 1 query, certain).`;

    document.getElementById("dj-n-val").textContent = n;
  }

  function init() {
    if (!document.getElementById("dj-widget")) return;
    setPreset("balanced-parity");
    document.getElementById("dj-n-slider").addEventListener("input", (e) => {
      n = parseInt(e.target.value, 10);
      setPreset("balanced-parity");
      render();
    });
    document.querySelectorAll(".dj-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setPreset(btn.dataset.preset);
        document.querySelectorAll(".dj-preset-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render();
      });
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();