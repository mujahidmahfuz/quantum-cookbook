(function () {
  let n = 4, marked = 5, iters = 3;

  function groverIteration(amps, N, idx) {
    amps = amps.map((a, x) => (x === idx ? -a : a));
    const mean = amps.reduce((s, a) => s + a, 0) / N;
    return amps.map((a) => 2 * mean - a);
  }

  function render() {
    const N = 1 << n;
    marked = Math.min(marked, N - 1);
    let amps = new Array(N).fill(1 / Math.sqrt(N));
    const maxIters = Math.ceil(Math.PI / 2 * Math.sqrt(N) / 1) + 2;
    iters = Math.min(iters, maxIters);

    const history = [amps[marked] ** 2];
    for (let k = 0; k < iters; k++) {
      amps = groverIteration(amps, N, marked);
      history.push(amps[marked] ** 2);
    }
    const pMarked = amps[marked] ** 2;

    const optimal = Math.round((Math.PI / 4) * Math.sqrt(N));

    document.getElementById("grover-n-val").textContent = n;
    document.getElementById("grover-marked-val").textContent = marked.toString(2).padStart(n, "0");
    document.getElementById("grover-iters-val").textContent = iters;
    document.getElementById("grover-optimal").textContent = `Optimal iteration count for N=${N}: ${optimal} (≈ π/4·√N)`;
    document.getElementById("grover-result").innerHTML = `After ${iters} iteration${iters === 1 ? "" : "s"}: P(marked) = <strong>${pMarked.toFixed(4)}</strong>` +
      (iters > optimal ? `  — past the optimum: more iterations made it WORSE` : iters === optimal ? `  — at the optimum` : ``);

    // geometric rotation picture: angle from |other> axis
    const theta0 = Math.asin(1 / Math.sqrt(N));
    const theta = (2 * iters + 1) * theta0;
    const R = 80, CX = 100, CY = 100;
    const px = CX + R * Math.sin(theta);
    const py = CY - R * Math.cos(theta);
    const svg = document.getElementById("grover-geo-svg");
    svg.innerHTML = `
      <line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R - 10}" stroke="#a39d8e" stroke-width="1" />
      <line x1="${CX}" y1="${CY}" x2="${CX + R + 10}" y2="${CY}" stroke="#a39d8e" stroke-width="1" />
      <text x="${CX - 4}" y="${CY - R - 16}" font-family="JetBrains Mono, monospace" font-size="11" fill="#6e6a60" text-anchor="middle">|marked⟩</text>
      <text x="${CX + R + 14}" y="${CY + 4}" font-family="JetBrains Mono, monospace" font-size="11" fill="#6e6a60">|other⟩</text>
      <path d="M ${CX} ${CY - 30} A 30 30 0 0 1 ${CX + 30 * Math.sin(theta)} ${CY - 30 * Math.cos(theta)}" fill="none" stroke="#2748c9" stroke-width="1.5" />
      <line x1="${CX}" y1="${CY}" x2="${px}" y2="${py}" stroke="#a8702b" stroke-width="2.4" />
      <circle cx="${px}" cy="${py}" r="6" fill="#a8702b" />
    `;

    // bar chart of P(marked) per iteration so far
    document.getElementById("grover-history").innerHTML = history.map((p, k) => {
      const h = Math.round(p * 100);
      return `<div class="amp-bar-col"><div class="amp-bar-track" style="height:100px;"><div class="amp-bar-fill" style="height:${h}px;"></div></div><div class="amp-bar-label">${k}</div></div>`;
    }).join("");
  }

  function init() {
    if (!document.getElementById("grover-widget")) return;
    document.getElementById("grover-n-slider").addEventListener("input", (e) => { n = parseInt(e.target.value, 10); render(); });
    document.getElementById("grover-marked-slider").addEventListener("input", (e) => { marked = parseInt(e.target.value, 10); render(); });
    document.getElementById("grover-iters-slider").addEventListener("input", (e) => { iters = parseInt(e.target.value, 10); render(); });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();