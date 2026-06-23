(function () {
  const SCALE = 36;
  const SIZE = 280;
  const ORIGIN = SIZE / 2;
  const RANGE = 3;

  function toPx(x, y) { return { px: ORIGIN + x * SCALE, py: ORIGIN - y * SCALE }; }
  function fromPx(px, py) { return { x: (px - ORIGIN) / SCALE, y: -(py - ORIGIN) / SCALE }; }
  function clamp(v) { return Math.max(-RANGE, Math.min(RANGE, v)); }
  function round1(v) { return Math.round(v * 10) / 10; }

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

  // ---------- Fig 1.1: vector addition ----------
  let a = { x: 1.5, y: 1 };
  let b = { x: 1, y: -1.2 };

  function staticPartAdd() {
    return gridSvg() + arrowSvg(b.x, b.y, "#a39d8e") + arrowSvg(a.x, a.y, "#2748c9");
  }

  function renderAddDynamic() {
    const svg = document.getElementById("vec-add-svg");
    if (!svg) return;
    const sum = { x: a.x + b.x, y: a.y + b.y };
    const guide = `<line x1="${toPx(a.x, a.y).px}" y1="${toPx(a.x, a.y).py}" x2="${toPx(sum.x, sum.y).px}" y2="${toPx(sum.x, sum.y).py}" stroke="#a39d8e" stroke-width="1.6" stroke-dasharray="4 3" />`;
    svg.innerHTML = staticPartAdd() + guide + arrowSvg(sum.x, sum.y, "#a8702b") +
      handleSvg(a.x, a.y, "#2748c9", "a") + handleSvg(b.x, b.y, "#6e6a60", "b");
    attachHandleListeners(svg, "vec-add");
    const readout = document.getElementById("vec-add-readout");
    if (readout) readout.textContent = `a = (${round1(a.x)}, ${round1(a.y)})    b = (${round1(b.x)}, ${round1(b.y)})    a + b = (${round1(sum.x)}, ${round1(sum.y)})`;
  }

  // ---------- Fig 1.2: matrix transformation ----------
  let v = { x: 1.4, y: 0.8 };
  let M = [[1, 0], [0, 1]];

  function applyM(vec) {
    return { x: M[0][0] * vec.x + M[0][1] * vec.y, y: M[1][0] * vec.x + M[1][1] * vec.y };
  }

  function renderTransformDynamic() {
    const svg = document.getElementById("vec-transform-svg");
    if (!svg) return;
    const mv = applyM(v);
    svg.innerHTML = gridSvg() + arrowSvg(mv.x, mv.y, "#a8702b") + arrowSvg(v.x, v.y, "#2748c9") +
      handleSvg(v.x, v.y, "#2748c9", "v");
    attachHandleListeners(svg, "vec-transform");
    const readout = document.getElementById("vec-transform-readout");
    if (readout) readout.textContent = `v = (${round1(v.x)}, ${round1(v.y)})    Mv = (${round1(mv.x)}, ${round1(mv.y)})`;
    const eq = document.getElementById("vec-transform-eq");
    if (eq && window.katex) {
      katex.render(
        `\\begin{bmatrix}${M[0][0]}&${M[0][1]}\\\\${M[1][0]}&${M[1][1]}\\end{bmatrix}\\begin{bmatrix}${round1(v.x)}\\\\${round1(v.y)}\\end{bmatrix}=\\begin{bmatrix}${round1(mv.x)}\\\\${round1(mv.y)}\\end{bmatrix}`,
        eq
      );
    }
  }

  function syncMatrixInputs() {
    ["m00", "m01", "m10", "m11"].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) el.value = [M[0][0], M[0][1], M[1][0], M[1][1]][idx];
    });
  }

  // ---------- Fig 1.4: eigenvalues / eigenvectors of M ----------
  function lineSvg(dx, dy, color) {
    // full line through the origin in direction (dx,dy), both ways
    const p1 = toPx(dx, dy), p2 = toPx(-dx, -dy);
    return `<line x1="${p1.px}" y1="${p1.py}" x2="${p2.px}" y2="${p2.py}" stroke="${color}" stroke-width="2" stroke-dasharray="6 4" />`;
  }

  function eigenvectorFor(M, lambda) {
    const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
    let x, y;
    if (Math.abs(b) > 1e-9) { x = b; y = lambda - a; }
    else if (Math.abs(c) > 1e-9) { x = lambda - d; y = c; }
    else { x = Math.abs(lambda - a) < 1e-9 ? 1 : 0; y = Math.abs(lambda - a) < 1e-9 ? 0 : 1; }
    const len = Math.hypot(x, y) || 1;
    return { x: (x / len) * 2.4, y: (y / len) * 2.4 };
  }

  function computeEigen(M) {
    const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
    const trace = a + d, det = a * d - b * c;
    const disc = trace * trace - 4 * det;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      const l1 = (trace + sq) / 2, l2 = (trace - sq) / 2;
      return { real: true, l1, l2, v1: eigenvectorFor(M, l1), v2: eigenvectorFor(M, l2) };
    }
    const sq = Math.sqrt(-disc);
    return { real: false, reL: trace / 2, imL: sq / 2 };
  }

  function renderEigen() {
    const svg = document.getElementById("eigen-svg");
    if (!svg) return;
    const eig = computeEigen(M);
    const readout = document.getElementById("eigen-readout");

    if (eig.real) {
      svg.innerHTML = gridSvg() + lineSvg(eig.v1.x, eig.v1.y, "#2748c9") + lineSvg(eig.v2.x, eig.v2.y, "#a8702b");
      if (readout) {
        readout.textContent = `λ₁ = ${round1(eig.l1)}  (blue line, direction ≈ (${round1(eig.v1.x)}, ${round1(eig.v1.y)}))    λ₂ = ${round1(eig.l2)}  (amber line, direction ≈ (${round1(eig.v2.x)}, ${round1(eig.v2.y)}))`;
      }
    } else {
      svg.innerHTML = gridSvg();
      if (readout) {
        readout.textContent = `No real eigenvectors — eigenvalues are complex: λ = ${round1(eig.reL)} ± ${round1(eig.imL)}i. This matrix is a pure rotation (plus scaling): every direction gets rotated, so none survives as its own eigenvector.`;
      }
    }
  }

  // ---------- Drag state (module-level, listeners attached ONCE per svg, not per render) ----------
  let dragTarget = null; // "a" | "b" | "v" | null
  let activeSvg = null;
  let activeWhich = null;
  let pendingFrame = false;

  function attachHandleListeners(svg, which) {
    // Only the handle circles are recreated each render, so (re)bind pointerdown on them.
    svg.querySelectorAll("[data-handle]").forEach((h) => {
      h.onpointerdown = (e) => {
        dragTarget = h.dataset.handle;
        activeSvg = svg;
        activeWhich = which;
        try { svg.setPointerCapture(e.pointerId); } catch (err) {}
        h.style.cursor = "grabbing";
        e.preventDefault();
      };
    });
  }

  function handleMove(svg, which, clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * SIZE;
    const py = ((clientY - rect.top) / rect.height) * SIZE;
    const { x, y } = fromPx(px, py);
    const cx = clamp(round1(x)), cy = clamp(round1(y));

    if (which === "vec-add") {
      if (dragTarget === "a") a = { x: cx, y: cy };
      else if (dragTarget === "b") b = { x: cx, y: cy };
    } else if (which === "vec-transform") {
      v = { x: cx, y: cy };
    }

    if (pendingFrame) return;
    pendingFrame = true;
    requestAnimationFrame(() => {
      pendingFrame = false;
      if (which === "vec-add") renderAddDynamic();
      else if (which === "vec-transform") renderTransformDynamic();
    });
  }

  function wireGlobalPointerEvents() {
    // Attached exactly once — never re-attached on render — which is the actual fix for the lag.
    window.addEventListener("pointermove", (e) => {
      if (!dragTarget || !activeSvg) return;
      handleMove(activeSvg, activeWhich, e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", () => { dragTarget = null; activeSvg = null; });
    window.addEventListener("pointercancel", () => { dragTarget = null; activeSvg = null; });
  }

  function wireMatrixInputs() {
    const ids = ["m00", "m01", "m10", "m11"];
    ids.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        const val = parseFloat(el.value);
        const r = Math.floor(idx / 2), c = idx % 2;
        M[r][c] = isNaN(val) ? 0 : val;
        renderTransformDynamic();
        renderEigen();
      });
    });
    document.querySelectorAll(".matrix-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        M = JSON.parse(btn.dataset.matrix);
        syncMatrixInputs();
        renderTransformDynamic();
        renderEigen();
      });
    });
  }

  function init() {
    wireGlobalPointerEvents();
    if (document.getElementById("vec-add-svg")) renderAddDynamic();
    if (document.getElementById("vec-transform-svg")) {
      syncMatrixInputs();
      wireMatrixInputs();
      renderTransformDynamic();
      renderEigen();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();