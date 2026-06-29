(function () {
  let period = 4;
  const N = 16;

  function render() {
    const A = window.QCAlgo;
    const count = N / period;
    const amps = new Array(N).fill(0).map((_, x) => (x % period === 0 ? 1 / Math.sqrt(count) : 0)).map((v) => ({ re: v, im: 0 }));

    document.getElementById("qft-input-panel").innerHTML = amps.map((a, x) => {
      const h = Math.round((a.re ** 2 + a.im ** 2) * 130 * count);
      return `<div class="amp-bar-col"><div class="amp-bar-track"><div class="amp-bar-fill" style="height:${Math.min(h, 130)}px;"></div></div><div class="amp-bar-label">${x}</div></div>`;
    }).join("");

    const result = A.qft(amps);
    document.getElementById("qft-output-panel").innerHTML = result.map((a, y) => {
      const prob = a.re ** 2 + a.im ** 2;
      const h = Math.round(prob * 130 * count);
      return `<div class="amp-bar-col"><div class="amp-bar-track"><div class="amp-bar-fill" style="height:${Math.min(h, 130)}px;"></div></div><div class="amp-bar-label">${y}</div></div>`;
    }).join("");

    document.getElementById("qft-readout").textContent = `Input: uniform superposition over every multiple of ${period} (period ${period} within N=${N}). Output: nonzero only at multiples of N/period = ${N / period} — the QFT has read the period straight off the input.`;
  }

  function init() {
    if (!document.getElementById("qft-widget")) return;
    document.querySelectorAll(".qft-period-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        period = parseInt(btn.dataset.period, 10);
        document.querySelectorAll(".qft-period-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render();
      });
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();