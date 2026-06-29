(function () {
  const SIZE = 200, CX = 100, CY = 100, R = 80;
  let theta = Math.PI / 3; // pure-state direction angle
  let mixedness = 0; // 0 = pure (on boundary), 1 = maximally mixed (center)

  function round2(v) { return Math.round(v * 100) / 100; }

  function render() {
    const svg = document.getElementById("purity-svg");
    if (!svg) return;
    const r = 1 - mixedness;
    const px = CX + r * R * Math.sin(theta);
    const py = CY - r * R * Math.cos(theta);
    const purity = (1 + r * r) / 2;

    svg.innerHTML = `
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#ddd7c8" stroke-width="1.5" />
      <circle cx="${CX}" cy="${CY}" r="2" fill="#a39d8e" />
      <line x1="${CX}" y1="${CY - R - 8}" x2="${CX}" y2="${CY + R + 8}" stroke="#a39d8e" stroke-width="1" />
      <text x="${CX + 6}" y="${CY - R - 10}" font-family="JetBrains Mono, monospace" font-size="11" fill="#6e6a60">|0⟩</text>
      <text x="${CX + 6}" y="${CY + R + 20}" font-family="JetBrains Mono, monospace" font-size="11" fill="#6e6a60">|1⟩</text>
      <line x1="${CX}" y1="${CY}" x2="${px}" y2="${py}" stroke="#a8702b" stroke-width="2.4" />
      <circle cx="${px}" cy="${py}" r="8" fill="#a8702b" stroke="#fff" stroke-width="2" data-handle="point" style="cursor:grab;" />
    `;
    wireHandle(svg);

    document.getElementById("purity-readout").textContent = `r = ${round2(r)}    Tr(ρ²) = ${round2(purity)}    ${purity > 0.999 ? "PURE (on the boundary)" : "MIXED (inside the disc)"}`;
    const gauge = document.getElementById("purity-fill-9");
    if (gauge) gauge.style.width = (purity * 100) + "%";
  }

  let dragging = false;
  function wireHandle(svg) {
    const handle = svg.querySelector("[data-handle]");
    handle.onpointerdown = (e) => { dragging = true; try { svg.setPointerCapture(e.pointerId); } catch (err) {} };
  }

  function handleMove(svg, clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * SIZE;
    const py = ((clientY - rect.top) / rect.height) * SIZE;
    const dx = px - CX, dy = py - CY;
    const dist = Math.hypot(dx, dy);
    theta = Math.atan2(dx, -dy);
    const r = Math.max(0, Math.min(1, dist / R));
    mixedness = 1 - r;
    document.getElementById("mixedness-slider").value = mixedness;
    document.getElementById("mixedness-val").textContent = round2(mixedness);
    render();
  }

  function init() {
    if (!document.getElementById("purity-svg")) return;
    const svg = document.getElementById("purity-svg");
    let pendingFrame = false;
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      if (pendingFrame) return;
      pendingFrame = true;
      requestAnimationFrame(() => { pendingFrame = false; handleMove(svg, e.clientX, e.clientY); });
    });
    window.addEventListener("pointerup", () => { dragging = false; });

    document.getElementById("mixedness-slider").addEventListener("input", (e) => {
      mixedness = parseFloat(e.target.value);
      document.getElementById("mixedness-val").textContent = round2(mixedness);
      render();
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();