(function () {
  let phi = 0.3, t = 4;

  function render() {
    const A = window.QCAlgo;
    const N = 1 << t;
    const amps = new Array(N).fill(null).map((_, k) => {
      const theta = 2 * Math.PI * phi * k;
      return { re: Math.cos(theta) / Math.sqrt(N), im: Math.sin(theta) / Math.sqrt(N) };
    });
    const result = A.iqft(amps);
    const p = A.probs(result);

    let bestIdx = 0, bestP = 0;
    p.forEach((prob, i) => { if (prob > bestP) { bestP = prob; bestIdx = i; } });
    const estimate = bestIdx / N;

    document.getElementById("qpe-t-val").textContent = t;
    document.getElementById("qpe-phi-val").textContent = phi.toFixed(3);
    document.getElementById("qpe-result").innerHTML =
      `True φ = ${phi.toFixed(4)}.  Measured k = ${bestIdx} out of N=${N}, so estimated φ ≈ k/N = <strong>${estimate.toFixed(4)}</strong> (P=${bestP.toFixed(3)}).  Error = ${Math.abs(estimate - phi).toFixed(4)}.`;

    const panel = document.getElementById("qpe-amps");
    panel.innerHTML = p.map((prob, k) => {
      const h = Math.round(prob * 130);
      return `<div class="amp-bar-col"><div class="amp-bar-track"><div class="amp-bar-fill${k === bestIdx ? "" : " is-neg"}" style="height:${Math.min(h, 130)}px;"></div></div><div class="amp-bar-label">${k}</div></div>`;
    }).join("");
  }

  function init() {
    if (!document.getElementById("qpe-widget")) return;
    document.getElementById("qpe-phi-slider").addEventListener("input", (e) => { phi = parseFloat(e.target.value); render(); });
    document.getElementById("qpe-t-slider").addEventListener("input", (e) => { t = parseInt(e.target.value, 10); render(); });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();