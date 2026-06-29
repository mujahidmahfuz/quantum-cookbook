(function () {
  let truth = [0, 1]; // f(0), f(1)

  function render() {
    const A = window.QCAlgo;
    const ttGrid = document.getElementById("deutsch-truth-table");
    ttGrid.innerHTML = `<div class="tt-cell is-header">x</div><div class="tt-cell is-header">f(x)</div>` +
      [0, 1].map((x) => `<div class="tt-cell">${x}</div><div class="tt-cell is-toggle" data-x="${x}">${truth[x]}</div>`).join("");
    ttGrid.style.gridTemplateColumns = "repeat(2, auto)";
    ttGrid.querySelectorAll("[data-x]").forEach((cell) => {
      cell.addEventListener("click", () => {
        const x = parseInt(cell.dataset.x, 10);
        truth[x] = 1 - truth[x];
        render();
      });
    });

    let amps = A.basisState(2, 0);
    amps = A.hadamardTransform(amps, 1);
    amps = A.applyPhaseOracle(amps, (x) => truth[x]);
    amps = A.hadamardTransform(amps, 1);
    const p = A.probs(amps);

    const isConstant = truth[0] === truth[1];
    document.getElementById("deutsch-result").innerHTML =
      `Measured: <strong>${p[0] > 0.5 ? "0" : "1"}</strong> (P(0)=${p[0].toFixed(2)}, P(1)=${p[1].toFixed(2)}) → f is <strong>${isConstant ? "CONSTANT" : "BALANCED"}</strong>, determined with certainty from a single query.`;
  }

  function init() {
    if (!document.getElementById("deutsch-widget")) return;
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();