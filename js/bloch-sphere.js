(function () {
  let scene, camera, renderer, sphereGroup, vectorArrow;
  let theta = Math.PI / 3;
  let phi = Math.PI / 4;

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
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x3a4256, wireframe: true, transparent: true, opacity: 0.55 });
    sphereGroup.add(new THREE.Mesh(sphereGeo, sphereMat));

    const equatorGeo = new THREE.TorusGeometry(1, 0.004, 8, 64);
    const equatorMat = new THREE.MeshBasicMaterial({ color: 0x5fd0c7, transparent: true, opacity: 0.5 });
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
      0xd98e4a,
      0.16,
      0.09
    );
    sphereGroup.add(vectorArrow);

    updateVector();
    animate();
    window.addEventListener("resize", onResize);
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
    sphereGroup.rotation.y += 0.0025;
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
      const phiDeg = ((phi * 180) / Math.PI).toFixed(0);
      const thetaDeg = ((theta * 180) / Math.PI).toFixed(0);
      katex.render(
        `|\\psi\\rangle = \\cos\\tfrac{\\theta}{2}|0\\rangle + e^{i\\phi}\\sin\\tfrac{\\theta}{2}|1\\rangle \\quad (\\theta=${thetaDeg}^\\circ,\\ \\phi=${phiDeg}^\\circ)`,
        ketEl
      );
    }
    if (coordEl) {
      coordEl.textContent = `c0 = ${fmt(c0)}   c1 = ${fmt(c1Re)} ${c1Im >= 0 ? "+" : "-"} ${fmt(Math.abs(c1Im))}i   (x, y, z) = (${fmt(x)}, ${fmt(y)}, ${fmt(z)})`;
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
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#343c54" stroke-width="1.5" />
      <line x1="${cx}" y1="${cy - r - 10}" x2="${cx}" y2="${cy + r + 10}" stroke="#6b7290" stroke-width="1" />
      <text x="${cx + 4}" y="${cy - r - 14}" fill="#a9aec2" font-size="11" font-family="JetBrains Mono, monospace">|0&#9002;</text>
      <text x="${cx + 4}" y="${cy + r + 22}" fill="#a9aec2" font-size="11" font-family="JetBrains Mono, monospace">|1&#9002;</text>
      <line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#d98e4a" stroke-width="2.5" />
      <circle cx="${px}" cy="${py}" r="4" fill="#d98e4a" />
      <path d="M ${cx} ${cy - 24} A 24 24 0 0 1 ${cx + 24 * Math.sin(theta)} ${cy - 24 * Math.cos(theta)}" fill="none" stroke="#5fd0c7" stroke-width="1.5" />
    `;
  }

  function wireControls() {
    const thetaSlider = document.getElementById("theta-slider");
    const phiSlider = document.getElementById("phi-slider");
    const thetaVal = document.getElementById("theta-val");
    const phiVal = document.getElementById("phi-val");

    thetaSlider.addEventListener("input", (e) => {
      theta = parseFloat(e.target.value);
      thetaVal.textContent = `${((theta * 180) / Math.PI).toFixed(0)}°`;
      updateVector();
    });
    phiSlider.addEventListener("input", (e) => {
      phi = parseFloat(e.target.value);
      phiVal.textContent = `${((phi * 180) / Math.PI).toFixed(0)}°`;
      updateVector();
    });
  }

  function init() {
    if (!document.getElementById("bloch-canvas")) return;
    initThree();
    wireControls();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

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
      status.textContent = "loading python runtime…";
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