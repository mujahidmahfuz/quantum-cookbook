(function () {
  const SCALE = 36;
  const SIZE = 280;
  const ORIGIN = SIZE / 2;
  const RANGE = 3;

  function toPx(x, y) { return { px: ORIGIN + x * SCALE, py: ORIGIN - y * SCALE }; }
  function fromPx(px, py) { return { x: (px - ORIGIN) / SCALE, y: -(py - ORIGIN) / SCALE }; }
  function clamp(v) { return Math.max(-RANGE, Math.min(RANGE, v)); }
  function round1(v) { return Math.round(v * 10) / 10; }
  function round2(v) { return Math.round(v * 100) / 100; }

  function gridSvg() {
    let s = "";
    for (let i = -RANGE; i <= RANGE; i++) {
      const { px } = toPx(i, 0);
      const { py } = toPx(0, i);
      s += `<line x1="${px}" y1="0" x2="${px}" y2="${SIZE}" stroke="#ddd7c8" stroke-width="${i === 0 ? 1.2 : 0.6}" />`;
      s += `<line x1="0" y1="${py}" x2="${SIZE}" y2="${py}" stroke="#ddd7c8" stroke-width="${i === 0 ? 1.2 : 0.6}" />`;
    }
    return s;
  }

  function arrowSvg(x, y, color) {
    const { px, py } = toPx(x, y);
    if (Math.hypot(x, y) < 0.02) return "";
    const angle = Math.atan2(py - ORIGIN, px - ORIGIN);
    const headLen = 9;
    const h1x = px - headLen * Math.cos(angle - Math.PI / 7);
    const h1y = py - headLen * Math.sin(angle - Math.PI / 7);
    const h2x = px - headLen * Math.cos(angle + Math.PI / 7);
    const h2y = py - headLen * Math.sin(angle + Math.PI / 7);
    return `
      <line x1="${ORIGIN}" y1="${ORIGIN}" x2="${px}" y2="${py}" stroke="${color}" stroke-width="2.4" />
      <polygon points="${px},${py} ${h1x},${h1y} ${h2x},${h2y}" fill="${color}" />
    `;
  }

  function handleSvg(x, y, color, id) {
    const { px, py } = toPx(x, y);
    return `<circle cx="${px}" cy="${py}" r="9" fill="${color}" stroke="#fff" stroke-width="2" data-handle="${id}" style="cursor:grab;" />`;
  }

  // ---------- Shared state: one vector pair drives both Fig 2.1 (inner product) and Fig 2.2 (outer product) ----------
  let a = { x: 1.8, y: 0.6 };
  let b = { x: 0.6, y: 1.6 };

  function renderInner() {
    const svg = document.getElementById("inner-svg");
    if (!svg) return;

    const dot = a.x * b.x + a.y * b.y;
    const aa = a.x * a.x + a.y * a.y;
    const t = aa > 1e-9 ? dot / aa : 0;
    const foot = { x: t * a.x, y: t * a.y };
    const magA = Math.sqrt(aa), magB = Math.sqrt(b.x * b.x + b.y * b.y);
    const cosTheta = magA > 1e-9 && magB > 1e-9 ? clampCos(dot / (magA * magB)) : 0;
    const thetaDeg = (Math.acos(cosTheta) * 180) / Math.PI;

    const projLine = `<line x1="${toPx(b.x, b.y).px}" y1="${toPx(b.x, b.y).py}" x2="${toPx(foot.x, foot.y).px}" y2="${toPx(foot.x, foot.y).py}" stroke="#a39d8e" stroke-width="1.4" stroke-dasharray="3 3" />`;
    const projSeg = `<line x1="${ORIGIN}" y1="${ORIGIN}" x2="${toPx(foot.x, foot.y).px}" y2="${toPx(foot.x, foot.y).py}" stroke="#25d39a" stroke-width="4" stroke-opacity="0.55" />`;

    svg.innerHTML = gridSvg() + projSeg + projLine +
      arrowSvg(b.x, b.y, "#a8702b") + arrowSvg(a.x, a.y, "#2748c9") +
      handleSvg(a.x, a.y, "#2748c9", "a") + handleSvg(b.x, b.y, "#a8702b", "b");

    attachHandleListeners(svg, "inner");

    const readout = document.getElementById("inner-readout");
    if (readout) {
      readout.textContent = `a = (${round1(a.x)}, ${round1(a.y)})   b = (${round1(b.x)}, ${round1(b.y)})   a·b = ${round2(dot)}   |a||b|cosθ = ${round2(magA * magB * cosTheta)}   θ ≈ ${thetaDeg.toFixed(0)}°`;
    }
    renderOuter();
  }

  function clampCos(v) { return Math.max(-1, Math.min(1, v)); }

  function renderOuter() {
    const el = document.getElementById("outer-matrix");
    if (!el) return;
    const m = [[a.x * b.x, a.x * b.y], [a.y * b.x, a.y * b.y]];
    el.innerHTML = `$$\\begin{bmatrix}${round2(a.x)}\\\\${round2(a.y)}\\end{bmatrix}\\begin{bmatrix}${round2(b.x)}&${round2(b.y)}\\end{bmatrix}=\\begin{bmatrix}${round2(m[0][0])}&${round2(m[0][1])}\\\\${round2(m[1][0])}&${round2(m[1][1])}\\end{bmatrix}$$`;
    if (window.renderMathInElement) {
      renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }] });
    }
  }

  // ---------- Drag wiring (listeners attached once, render throttled to one frame — same fix as Ch.1) ----------
  let dragTarget = null;
  let activeSvg = null;
  let pendingFrame = false;

  function attachHandleListeners(svg) {
    svg.querySelectorAll("[data-handle]").forEach((h) => {
      h.onpointerdown = (e) => {
        dragTarget = h.dataset.handle;
        activeSvg = svg;
        try { svg.setPointerCapture(e.pointerId); } catch (err) {}
        h.style.cursor = "grabbing";
        e.preventDefault();
      };
    });
  }

  function handleMove(svg, clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * SIZE;
    const py = ((clientY - rect.top) / rect.height) * SIZE;
    const { x, y } = fromPx(px, py);
    const cx = clamp(round1(x)), cy = clamp(round1(y));
    if (dragTarget === "a") a = { x: cx, y: cy };
    else if (dragTarget === "b") b = { x: cx, y: cy };

    if (pendingFrame) return;
    pendingFrame = true;
    requestAnimationFrame(() => {
      pendingFrame = false;
      renderInner();
    });
  }

  function wireGlobalPointerEvents() {
    window.addEventListener("pointermove", (e) => {
      if (!dragTarget || !activeSvg) return;
      handleMove(activeSvg, e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", () => { dragTarget = null; activeSvg = null; });
    window.addEventListener("pointercancel", () => { dragTarget = null; activeSvg = null; });
  }

  function init() {
    wireGlobalPointerEvents();
    if (document.getElementById("inner-svg")) renderInner();
  }

  document.addEventListener("DOMContentLoaded", init);
})();