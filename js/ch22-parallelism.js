(function () {
  let n = 2;
  let truth = [0, 1, 1, 0]; // f(00),f(01),f(10),f(11) -- default: XOR, balanced

  function render() {
    const N = 1 << n;
    const A = window.QCAlgo;

    const ttGrid = document.getElementById("para-truth-table");
    let html = '<div class="tt-cell is-header">x</div><div class="tt-cell is-header">f(x)</div>';
    for (let x = 0; x < N; x++) {
      html += `<div class="tt-cell">${x.toString(2).padStart(n, "0")}</div><div class="tt-cell is-toggle" data-x="${x}">${truth[x]}</div>`;
    }
    ttGrid.style.gridTemplateColumns = "repeat(2, auto)";
    ttGrid.innerHTML = html;
    ttGrid.querySelectorAll("[data-x]").forEach((cell) => {
      cell.addEventListener("click", () => {
        const x = parseInt(cell.dataset.x, 10);
        truth[x] = 1 - truth[x];
        render();
      });
    });

    let amps = A.basisState(N, 0);
    amps = A.hadamardTransform(amps, n);
    amps = A.applyPhaseOracle(amps, (x) => truth[x]);

    const panel = document.getElementById("para-amps");
    panel.innerHTML = amps.map((a, x) => {
      const h = Math.round(Math.abs(a.re) * 130);
      const isNeg = a.re < 0;
      return `<div class="amp-bar-col">
        <div class="amp-bar-track"><div class="amp-bar-fill${isNeg ? " is-neg" : ""}" style="height:${h}px;"></div></div>
        <div class="amp-bar-label">${x.toString(2).padStart(n, "0")}</div>
      </div>`;
    }).join("");

    document.getElementById("para-readout").textContent = `Every one of the ${N} amplitudes carries a ± sign set by f(x) — blue = (+), amber = (−). One H-gate layer and one oracle query, and all ${N} values of f are present at once.`;
  }

  function init() {
    if (!document.getElementById("para-widget")) return;
    document.getElementById("para-n-slider").addEventListener("input", (e) => {
      n = parseInt(e.target.value, 10);
      truth = new Array(1 << n).fill(0).map((_, i) => i % 2);
      document.getElementById("para-n-val").textContent = n;
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();