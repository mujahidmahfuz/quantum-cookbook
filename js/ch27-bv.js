(function () {
  let n = 4;
  let s = 5; // hidden string, as integer

  function render() {
    const A = window.QCAlgo;
    const N = 1 << n;

    const toggleRow = document.getElementById("bv-s-toggles");
    toggleRow.innerHTML = "";
    for (let bit = n - 1; bit >= 0; bit--) {
      const val = (s >> bit) & 1;
      const btn = document.createElement("button");
      btn.className = "toff-bit-btn" + (val ? " is-active" : "");
      btn.textContent = val;
      btn.dataset.bit = bit;
      btn.addEventListener("click", () => { s ^= (1 << bit); render(); });
      toggleRow.appendChild(btn);
    }

    let amps = A.basisState(N, 0);
    amps = A.hadamardTransform(amps, n);
    amps = A.applyPhaseOracle(amps, (x) => A.popcount(x & s) % 2);
    amps = A.hadamardTransform(amps, n);
    const p = A.probs(amps);

    let bestIdx = 0, bestP = 0;
    p.forEach((prob, i) => { if (prob > bestP) { bestP = prob; bestIdx = i; } });

    document.getElementById("bv-hidden-label").textContent = s.toString(2).padStart(n, "0");
    document.getElementById("bv-result").innerHTML =
      `Measured: <strong>${bestIdx.toString(2).padStart(n, "0")}</strong> (P=${bestP.toFixed(3)}) — ` +
      (bestIdx === s ? `exactly matches the hidden s, recovered in a single query.` : `MISMATCH (this shouldn't happen — please report it)`);

    const panel = document.getElementById("bv-amps");
    panel.innerHTML = p.map((prob, x) => {
      const h = Math.round(prob * 130);
      return `<div class="amp-bar-col">
        <div class="amp-bar-track"><div class="amp-bar-fill${x === s ? "" : " is-neg"}" style="height:${h}px;"></div></div>
        <div class="amp-bar-label">${x.toString(2).padStart(n, "0")}</div>
      </div>`;
    }).join("");
  }

  function init() {
    if (!document.getElementById("bv-widget")) return;
    document.getElementById("bv-n-slider").addEventListener("input", (e) => {
      n = parseInt(e.target.value, 10);
      s = s % (1 << n);
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();