(function () {
  let scene, camera, renderer, sphereGroup, vectorArrow;
  let theta = Math.PI / 3;
  let phi = Math.PI / 4;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let animId = null;

  function initThree() {
    const canvas = document.getElementById("bloch-canvas");
    const wrap = canvas.parentElement;
    const width = wrap.clientWidth;
    const height = 280;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.4, 1.8, 2.6);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x3a4256, wireframe: true, transparent: true, opacity: 0.45 });
    sphereGroup.add(new THREE.Mesh(sphereGeo, sphereMat));

    const equatorGeo = new THREE.TorusGeometry(1, 0.004, 8, 64);
    const equatorMat = new THREE.MeshBasicMaterial({ color: 0x2748c9, transparent: true, opacity: 0.45 });
    const equator = new THREE.Mesh(equatorGeo, equatorMat);
    equator.rotation.x = Math.PI / 2;
    sphereGroup.add(equator);

    const axisMat = new THREE.LineBasicMaterial({ color: 0x6b7290 });
    [
      [[0, -1.3, 0], [0, 1.3, 0]],
      [[-1.3, 0, 0], [1.3, 0, 0]],
      [[0, 0, -1.3], [0, 0, 1.3]],
    ].forEach(([a, b]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
      sphereGroup.add(new THREE.Line(geo, axisMat));
    });

    vectorArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0xa8702b,
      0.16,
      0.09
    );
    sphereGroup.add(vectorArrow);

    updateVector();
    animate();
    window.addEventListener("resize", onResize);
    wireDrag(canvas);
  }

  function onResize() {
    const canvas = document.getElementById("bloch-canvas");
    const wrap = canvas.parentElement;
    const width = wrap.clientWidth;
    renderer.setSize(width, 280);
    camera.aspect = width / 280;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!dragging) sphereGroup.rotation.y += 0.0015;
    renderer.render(scene, camera);
  }

  function blochCoords() {
    const x = Math.sin(theta) * Math.cos(phi);
    const z = Math.sin(theta) * Math.sin(phi);
    const y = Math.cos(theta);
    return { x, y, z };
  }

  function updateVector() {
    const { x, y, z } = blochCoords();
    vectorArrow.setDirection(new THREE.Vector3(x, y, z).normalize());
    updateReadout();
    update2D();
    syncSliders();
  }

  function syncSliders() {
    const thetaSlider = document.getElementById("theta-slider");
    const phiSlider = document.getElementById("phi-slider");
    const thetaVal = document.getElementById("theta-val");
    const phiVal = document.getElementById("phi-val");
    if (thetaSlider) thetaSlider.value = theta;
    if (phiSlider) phiSlider.value = phi;
    if (thetaVal) thetaVal.textContent = `${((theta * 180) / Math.PI).toFixed(0)}°`;
    if (phiVal) phiVal.textContent = `${(((phi % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) * 180 / Math.PI).toFixed(0)}°`;
  }

  function fmt(n) {
    return (Math.abs(n) < 1e-6 ? 0 : n).toFixed(3);
  }

  function updateReadout() {
    const c0 = Math.cos(theta / 2);
    const c1Re = Math.sin(theta / 2) * Math.cos(phi);
    const c1Im = Math.sin(theta / 2) * Math.sin(phi);
    const { x, y, z } = blochCoords();

    const ketEl = document.getElementById("bloch-ket");
    const coordEl = document.getElementById("bloch-coords");
    if (window.katex && ketEl) {
      const phiDeg = (((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * 180 / Math.PI).toFixed(0);
      const thetaDeg = ((theta * 180) / Math.PI).toFixed(0);
      katex.render(
        `|\\psi\\rangle = \\cos\\tfrac{\\theta}{2}|0\\rangle + e^{i\\phi}\\sin\\tfrac{\\theta}{2}|1\\rangle \\quad (\\theta=${thetaDeg}^\\circ,\\ \\phi=${phiDeg}^\\circ)`,
        ketEl
      );
    }
    if (coordEl) {
      coordEl.textContent = `c0 = ${fmt(c0)}   c1 = ${fmt(c1Re)} ${c1Im >= 0 ? "+" : "-"} ${fmt(Math.abs(c1Im))}i   |c0|²+|c1|² = ${fmt(c0 * c0 + c1Re * c1Re + c1Im * c1Im)}`;
    }
  }

  function update2D() {
    const svg = document.getElementById("bloch-2d");
    if (!svg) return;
    const r = 70;
    const cx = 90, cy = 90;
    const px = cx + r * Math.sin(theta);
    const py = cy - r * Math.cos(theta);
    svg.innerHTML = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ddd7c8" stroke-width="1.5" />
      <line x1="${cx}" y1="${cy - r - 10}" x2="${cx}" y2="${cy + r + 10}" stroke="#a39d8e" stroke-width="1" />
      <text x="${cx + 4}" y="${cy - r - 14}" fill="#6e6a60" font-size="11" font-family="JetBrains Mono, monospace">|0&#9002;</text>
      <text x="${cx + 4}" y="${cy + r + 22}" fill="#6e6a60" font-size="11" font-family="JetBrains Mono, monospace">|1&#9002;</text>
      <line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#a8702b" stroke-width="2.5" />
      <circle cx="${px}" cy="${py}" r="4" fill="#a8702b" />
      <path d="M ${cx} ${cy - 24} A 24 24 0 0 1 ${cx + 24 * Math.sin(theta)} ${cy - 24 * Math.cos(theta)}" fill="none" stroke="#2748c9" stroke-width="1.5" />
    `;
  }

  // ---------- Direct drag-to-rotate on the sphere itself ----------
  function wireDrag(canvas) {
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      phi += dx * 0.012;
      theta = Math.max(0, Math.min(Math.PI, theta - dy * 0.012));
      updateVector();
    });
    canvas.addEventListener("pointerup", (e) => {
      dragging = false;
      canvas.style.cursor = "grab";
      canvas.releasePointerCapture(e.pointerId);
    });
  }

  // ---------- Slider controls (kept as a precise alternative to dragging) ----------
  function wireControls() {
    const thetaSlider = document.getElementById("theta-slider");
    const phiSlider = document.getElementById("phi-slider");

    thetaSlider.addEventListener("input", (e) => {
      theta = parseFloat(e.target.value);
      updateVector();
    });
    phiSlider.addEventListener("input", (e) => {
      phi = parseFloat(e.target.value);
      updateVector();
    });
  }

  // ---------- Gate buttons: real complex-amplitude matrix multiplication ----------
  const SQRT1_2 = 1 / Math.sqrt(2);
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  const GATES = {
    I: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 1, im: 0 }]],
    X: [[{ re: 0, im: 0 }, { re: 1, im: 0 }], [{ re: 1, im: 0 }, { re: 0, im: 0 }]],
    Y: [[{ re: 0, im: 0 }, { re: 0, im: -1 }], [{ re: 0, im: 1 }, { re: 0, im: 0 }]],
    Z: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: -1, im: 0 }]],
    H: [[{ re: SQRT1_2, im: 0 }, { re: SQRT1_2, im: 0 }], [{ re: SQRT1_2, im: 0 }, { re: -SQRT1_2, im: 0 }]],
    S: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 0, im: 1 }]],
    T: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }]],
  };

  function applyGate(name) {
    const M = GATES[name];
    if (!M) return;
    const c0 = { re: Math.cos(theta / 2), im: 0 };
    const c1 = { re: Math.sin(theta / 2) * Math.cos(phi), im: Math.sin(theta / 2) * Math.sin(phi) };

    const newC0 = cAdd(cMul(M[0][0], c0), cMul(M[0][1], c1));
    const newC1 = cAdd(cMul(M[1][0], c0), cMul(M[1][1], c1));

    // Strip global phase so c0 becomes real & non-negative, the canonical form our theta/phi parametrization assumes.
    const phase0 = Math.atan2(newC0.im, newC0.re);
    const mag0 = Math.hypot(newC0.re, newC0.im);
    const c1re = newC1.re * Math.cos(-phase0) - newC1.im * Math.sin(-phase0);
    const c1im = newC1.re * Math.sin(-phase0) + newC1.im * Math.cos(-phase0);

    const targetTheta = 2 * Math.acos(Math.max(-1, Math.min(1, mag0)));
    let targetPhi = Math.atan2(c1im, c1re);

    animateTo(targetTheta, targetPhi);
  }

  function animateTo(targetTheta, targetPhi) {
    if (animId) cancelAnimationFrame(animId);
    const startTheta = theta;
    let startPhi = phi;
    // shortest path for phi
    let d = targetPhi - ((startPhi % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI));
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const endPhi = startPhi + d;
    const duration = 350;
    const t0 = performance.now();

    function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      theta = startTheta + (targetTheta - startTheta) * ease;
      phi = startPhi + (endPhi - startPhi) * ease;
      updateVector();
      if (t < 1) {
        animId = requestAnimationFrame(step);
      } else {
        animId = null;
      }
    }
    animId = requestAnimationFrame(step);
  }

  function wireGateButtons() {
    document.querySelectorAll(".gate-btn").forEach((btn) => {
      btn.addEventListener("click", () => applyGate(btn.dataset.gate));
    });
    const resetBtn = document.getElementById("bloch-reset");
    if (resetBtn) resetBtn.addEventListener("click", () => animateTo(0, 0));
  }

  function init() {
    if (!document.getElementById("bloch-canvas")) return;
    initThree();
    wireControls();
    wireGateButtons();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

/* ---------- Pyodide code cell, lazy-loaded only when "Run" is first clicked ---------- */
(function () {
  let pyodidePromise = null;

  function loadPyodide_() {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
      script.onload = async () => {
        try {
          const py = await window.loadPyodide();
          await py.loadPackage("numpy"); // numpy ships with Pyodide but must be explicitly loaded
          resolve(py);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return pyodidePromise;
  }

  function wireCodeCell(cellEl) {
    const runBtn = cellEl.querySelector(".js-run");
    const resetBtn = cellEl.querySelector(".js-reset");
    const textarea = cellEl.querySelector("textarea");
    const status = cellEl.querySelector(".code-status");
    const output = cellEl.querySelector(".code-output");
    const original = textarea.value;

    runBtn.addEventListener("click", async () => {
      status.textContent = "loading python runtime + numpy…";
      runBtn.disabled = true;
      try {
        const py = await loadPyodide_();
        status.textContent = "running…";
        let captured = "";
        py.setStdout({ batched: (s) => (captured += s + "\n") });
        await py.runPythonAsync(textarea.value);
        output.textContent = captured || "(no output — try adding a print() statement)";
        output.classList.add("is-visible");
        status.textContent = "done";
      } catch (err) {
        output.textContent = String(err);
        output.classList.add("is-visible");
        status.textContent = "error";
      } finally {
        runBtn.disabled = false;
      }
    });

    resetBtn.addEventListener("click", () => {
      textarea.value = original;
      output.classList.remove("is-visible");
      status.textContent = "";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".code-cell").forEach(wireCodeCell);
  });
})();
