(function () {
  const NQ = 4;
  const DIM = 1 << NQ; // 16
  const NUM_COLS = 10;
  const ROW_H = 44, CELL_W = 46, LABEL_W = 38;

  let grid = Array.from({ length: NQ }, () => new Array(NUM_COLS).fill(null));
  let twoQ = {}; // col -> { type, a, b, control?, target? }
  let selectedEmpty = null; // { wire, col }
  let selectedGate = null;  // { col, wire?, kind: 'single'|'measure'|'two' }

  const SQRT1_2 = 1 / Math.sqrt(2);
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }

  const GATE_MATS = {
    I: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 1, im: 0 }]],
    X: [[{ re: 0, im: 0 }, { re: 1, im: 0 }], [{ re: 1, im: 0 }, { re: 0, im: 0 }]],
    Y: [[{ re: 0, im: 0 }, { re: 0, im: -1 }], [{ re: 0, im: 1 }, { re: 0, im: 0 }]],
    Z: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: -1, im: 0 }]],
    H: [[{ re: SQRT1_2, im: 0 }, { re: SQRT1_2, im: 0 }], [{ re: SQRT1_2, im: 0 }, { re: -SQRT1_2, im: 0 }]],
    S: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 0, im: 1 }]],
    Sdg: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 0, im: -1 }]],
    T: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }]],
    Tdg: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: Math.cos(Math.PI / 4), im: -Math.sin(Math.PI / 4) }]],
  };

  const GATE_INFO = {
    H: { latex: "H=\\tfrac{1}{\\sqrt2}\\begin{bmatrix}1&1\\\\1&-1\\end{bmatrix}", desc: "Creates superposition: sends |0⟩ to the equal-weight state, and back." },
    I: { latex: "I=\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}", desc: "Does nothing — useful as a deliberate no-op placeholder in a column." },
    X: { latex: "X=\\begin{bmatrix}0&1\\\\1&0\\end{bmatrix}", desc: "Bit flip — the quantum NOT." },
    Y: { latex: "Y=\\begin{bmatrix}0&-i\\\\i&0\\end{bmatrix}", desc: "Bit flip + phase flip together." },
    Z: { latex: "Z=\\begin{bmatrix}1&0\\\\0&-1\\end{bmatrix}", desc: "Phase flip — leaves |0⟩, |1⟩ alone, flips the sign of |1⟩'s amplitude." },
    S: { latex: "S=\\begin{bmatrix}1&0\\\\0&i\\end{bmatrix}", desc: "Quarter-turn phase gate (√Z)." },
    Sdg: { latex: "S^\\dagger=\\begin{bmatrix}1&0\\\\0&-i\\end{bmatrix}", desc: "Inverse of S — undoes its phase rotation." },
    T: { latex: "T=\\begin{bmatrix}1&0\\\\0&e^{i\\pi/4}\\end{bmatrix}", desc: "Eighth-turn phase gate (√S). Common in fault-tolerant gate sets." },
    Tdg: { latex: "T^\\dagger=\\begin{bmatrix}1&0\\\\0&e^{-i\\pi/4}\\end{bmatrix}", desc: "Inverse of T." },
    CNOT: { latex: "\\text{CNOT}=\\begin{bmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&0&1\\\\0&0&1&0\\end{bmatrix}", desc: "Shown for control = top wire, target = bottom wire of this gate. Flips the target exactly when the control is |1⟩ — the source of entanglement." },
    CZ: { latex: "CZ=\\begin{bmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&1&0\\\\0&0&0&-1\\end{bmatrix}", desc: "Symmetric in both wires — flips the sign only when both qubits are |1⟩." },
    SWAP: { latex: "\\text{SWAP}=\\begin{bmatrix}1&0&0&0\\\\0&0&1&0\\\\0&1&0&0\\\\0&0&0&1\\end{bmatrix}", desc: "Exchanges the states of the two wires entirely." },
    Measure: { latex: null, desc: "Not a unitary gate — collapses the qubit to 0 or 1 according to the Born rule. Shown here for circuit-reading practice; probabilities below are always the exact (unmeasured) statevector result." },
  };

  // ---------- N-qubit simulation ----------
  function applyPairGate(amps, wire, M) {
    const mask = 1 << wire;
    const out = amps.slice();
    for (let i = 0; i < DIM; i++) {
      if ((i & mask) === 0) {
        const j = i | mask, a = amps[i], b = amps[j];
        out[i] = cAdd(cMul(M[0][0], a), cMul(M[0][1], b));
        out[j] = cAdd(cMul(M[1][0], a), cMul(M[1][1], b));
      }
    }
    return out;
  }
  function applyCNOT(amps, control, target) {
    const out = new Array(DIM).fill(null);
    for (let i = 0; i < DIM; i++) {
      let j = i;
      if ((i >> control) & 1) j = i ^ (1 << target);
      out[j] = amps[i];
    }
    return out;
  }
  function applyCZ(amps, a, b) {
    return amps.map((amp, i) => (((i >> a) & 1) && ((i >> b) & 1)) ? { re: -amp.re, im: -amp.im } : amp);
  }
  function applySwap(amps, a, b) {
    const out = new Array(DIM).fill(null);
    for (let i = 0; i < DIM; i++) {
      const ba = (i >> a) & 1, bb = (i >> b) & 1;
      let j = i;
      if (ba !== bb) { j = i ^ (1 << a) ^ (1 << b); }
      out[j] = amps[i];
    }
    return out;
  }

  function columnHasOp(col) {
    return !!twoQ[col] || grid.some((row) => row[col] && row[col] !== "Measure");
  }

  function applyColumnOp(amps, col) {
    if (twoQ[col]) {
      const g = twoQ[col];
      if (g.type === "CNOT") return applyCNOT(amps, g.control, g.target);
      if (g.type === "CZ") return applyCZ(amps, g.a, g.b);
      if (g.type === "SWAP") return applySwap(amps, g.a, g.b);
    }
    let out = amps;
    for (let w = 0; w < NQ; w++) {
      const gate = grid[w][col];
      if (gate && gate !== "Measure") out = applyPairGate(out, w, GATE_MATS[gate]);
    }
    return out;
  }

  function simulate() {
    let amps = new Array(DIM).fill(null).map((_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }));
    for (let col = 0; col < NUM_COLS; col++) amps = applyColumnOp(amps, col);
    return amps;
  }

  // ---------- Placement helpers ----------
  function neighborWire(w) { return w < NQ - 1 ? w + 1 : w - 1; }
  function cellFree(w, col) {
    return grid[w][col] === null && !(twoQ[col] && (twoQ[col].a === w || twoQ[col].b === w));
  }

  function placeTile(tile, wire, col) {
    if (tile === "CNOT" || tile === "CZ" || tile === "SWAP") {
      const other = neighborWire(wire);
      if (!cellFree(wire, col) || !cellFree(other, col)) return false;
      if (tile === "CNOT") twoQ[col] = { type: "CNOT", a: wire, b: other, control: wire, target: other };
      else twoQ[col] = { type: tile, a: Math.min(wire, other), b: Math.max(wire, other) };
      return true;
    }
    if (!cellFree(wire, col)) return false;
    grid[wire][col] = tile;
    return true;
  }

  // ---------- Rendering ----------
  function renderWires() {
    const wrap = document.getElementById("qc-wires");
    wrap.innerHTML = "";
    for (let w = 0; w < NQ; w++) {
      const row = document.createElement("div");
      row.className = "wire-row";
      const label = document.createElement("div");
      label.className = "wire-label";
      label.textContent = `q${w}`;
      row.appendChild(label);

      for (let col = 0; col < NUM_COLS; col++) {
        const cell = document.createElement("div");
        cell.className = "wire-cell";
        cell.dataset.wire = w; cell.dataset.col = col;

        if (twoQ[col] && (twoQ[col].a === w || twoQ[col].b === w)) {
          const g = twoQ[col];
          if (g.type === "CNOT") {
            cell.classList.add(w === g.control ? "is-two-a" : "is-two-b");
            cell.textContent = w === g.control ? "●" : "⊕";
          } else if (g.type === "CZ") {
            cell.classList.add("is-two-a");
            cell.textContent = "●";
          } else {
            cell.classList.add("is-two-a");
            cell.textContent = "✕";
          }
        } else if (grid[w][col] === "Measure") {
          cell.classList.add("is-measure");
          cell.textContent = "📏";
        } else if (grid[w][col]) {
          cell.classList.add("is-filled");
          cell.textContent = grid[w][col];
        }
        if (selectedEmpty && selectedEmpty.wire === w && selectedEmpty.col === col) cell.classList.add("is-selected");

        cell.addEventListener("dragover", (e) => { e.preventDefault(); cell.classList.add("is-over"); });
        cell.addEventListener("dragleave", () => cell.classList.remove("is-over"));
        cell.addEventListener("drop", (e) => {
          e.preventDefault();
          cell.classList.remove("is-over");
          const tile = e.dataTransfer.getData("gate");
          if (tile && placeTile(tile, w, col)) { selectedEmpty = null; renderAll(); }
        });
        cell.addEventListener("click", () => onCellClick(w, col));
        row.appendChild(cell);
      }
      wrap.appendChild(row);
    }
    renderConnectors();
  }

  function renderConnectors() {
    const layer = document.getElementById("qc-connectors");
    layer.innerHTML = "";
    Object.keys(twoQ).forEach((colStr) => {
      const col = parseInt(colStr, 10);
      const g = twoQ[col];
      const top = ROW_H / 2 + Math.min(g.a, g.b) * ROW_H;
      const height = Math.abs(g.a - g.b) * ROW_H;
      const left = LABEL_W + col * CELL_W + 21 - 1;
      const line = document.createElement("div");
      line.className = "two-q-line";
      line.style.left = left + "px";
      line.style.top = top + "px";
      line.style.height = height + "px";
      layer.appendChild(line);
    });
  }

  function onCellClick(wire, col) {
    if (twoQ[col] && (twoQ[col].a === wire || twoQ[col].b === wire)) {
      selectedGate = { col, kind: "two", info: twoQ[col] };
      selectedEmpty = null;
      renderInspector();
      return;
    }
    if (grid[wire][col]) {
      selectedGate = { col, wire, kind: grid[wire][col] === "Measure" ? "measure" : "single", name: grid[wire][col] };
      selectedEmpty = null;
      renderInspector();
      return;
    }
    selectedEmpty = (selectedEmpty && selectedEmpty.wire === wire && selectedEmpty.col === col) ? null : { wire, col };
    selectedGate = null;
    renderWires();
    renderInspector();
  }

  function renderInspector() {
    const el = document.getElementById("qc-inspector");
    if (!selectedGate) {
      el.innerHTML = `<p class="inspector-empty">Click any gate on the circuit to see its matrix and a short explanation here — this is the panel IBM's composer doesn't have.</p>`;
      return;
    }
    let name, info;
    if (selectedGate.kind === "two") { name = selectedGate.info.type; info = GATE_INFO[name]; }
    else { name = selectedGate.name; info = GATE_INFO[name]; }

    const matrixHtml = info.latex ? `<div class="inspector-matrix">$$${info.latex}$$</div>` : "";
    el.innerHTML = `
      <div class="inspector-name">${name}</div>
      ${matrixHtml}
      <p class="inspector-desc">${info.desc}</p>
      <button class="inspector-remove" id="qc-remove">✕ Remove this gate</button>
    `;
    if (window.renderMathInElement) {
      renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }] });
    }
    document.getElementById("qc-remove").addEventListener("click", () => {
      if (selectedGate.kind === "two") delete twoQ[selectedGate.col];
      else grid[selectedGate.wire][selectedGate.col] = null;
      selectedGate = null;
      renderAll();
    });
  }

  function wirePalette() {
    document.querySelectorAll(".pal-tile").forEach((tile) => {
      tile.addEventListener("dragstart", (e) => e.dataTransfer.setData("gate", tile.dataset.gate));
      tile.addEventListener("click", () => {
        if (!selectedEmpty) return;
        if (placeTile(tile.dataset.gate, selectedEmpty.wire, selectedEmpty.col)) {
          selectedEmpty = null;
          renderAll();
        }
      });
    });
    document.getElementById("qc-clear").addEventListener("click", () => {
      grid = Array.from({ length: NQ }, () => new Array(NUM_COLS).fill(null));
      twoQ = {};
      selectedEmpty = null;
      selectedGate = null;
      renderAll();
    });
    document.getElementById("qc-run").addEventListener("click", renderAll);
  }

  // ---------- OpenQASM ----------
  const QASM_NAME = { H: "h", I: "id", X: "x", Y: "y", Z: "z", S: "s", Sdg: "sdg", T: "t", Tdg: "tdg" };
  function renderQASM() {
    const lines = ['OPENQASM 2.0;', 'include "qelib1.inc";', "", `qreg q[${NQ}];`, `creg c[${NQ}];`, ""];
    const measures = [];
    for (let col = 0; col < NUM_COLS; col++) {
      if (twoQ[col]) {
        const g = twoQ[col];
        if (g.type === "CNOT") lines.push(`cx q[${g.control}],q[${g.target}];`);
        if (g.type === "CZ") lines.push(`cz q[${g.a}],q[${g.b}];`);
        if (g.type === "SWAP") lines.push(`swap q[${g.a}],q[${g.b}];`);
      }
      for (let w = 0; w < NQ; w++) {
        const gate = grid[w][col];
        if (!gate) continue;
        if (gate === "Measure") measures.push(w);
        else lines.push(`${QASM_NAME[gate]} q[${w}];`);
      }
    }
    measures.forEach((w) => lines.push(`measure q[${w}] -> c[${w}];`));
    document.getElementById("qc-qasm").textContent = lines.join("\n");
  }

  // ---------- Probabilities ----------
  function renderProbChart(amps) {
    const chart = document.getElementById("qc-probchart");
    chart.innerHTML = "";
    for (let i = 0; i < DIM; i++) {
      const prob = amps[i].re * amps[i].re + amps[i].im * amps[i].im;
      const col = document.createElement("div");
      col.className = "prob-bar-col";
      const track = document.createElement("div");
      track.className = "prob-bar-track";
      const bar = document.createElement("div");
      bar.className = "prob-bar";
      track.appendChild(bar);
      col.appendChild(track);
      const tick = document.createElement("div");
      tick.className = "prob-tick";
      tick.textContent = i.toString(2).padStart(NQ, "0");
      col.appendChild(tick);
      chart.appendChild(col);
      requestAnimationFrame(() => { bar.style.height = (prob * 100) + "%"; });
    }
  }

  // ---------- Q-sphere ----------
  let qsScene, qsCamera, qsRenderer, qsGroup;
  function initQSphere() {
    const canvas = document.getElementById("qsphere-canvas");
    const w = canvas.clientWidth || 320, h = 300;
    canvas.width = w; canvas.height = h;
    qsScene = new THREE.Scene();
    qsCamera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    qsCamera.position.set(2.0, 1.4, 2.2);
    qsCamera.lookAt(0, 0, 0);
    qsRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    qsRenderer.setSize(w, h);
    qsRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true, transparent: true, opacity: 0.35 });
    qsScene.add(new THREE.Mesh(sphereGeo, sphereMat));

    qsGroup = new THREE.Group();
    qsScene.add(qsGroup);
    qsRenderer.render(qsScene, qsCamera);
  }

  function popcount(x) { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return new THREE.Color(f(0), f(8), f(4));
  }

  function renderQSphere(amps) {
    while (qsGroup.children.length) qsGroup.remove(qsGroup.children[0]);
    const byWeight = {};
    for (let i = 0; i < DIM; i++) {
      const w = popcount(i);
      (byWeight[w] = byWeight[w] || []).push(i);
    }
    const labelsLayer = document.getElementById("qsphere-labels");
    labelsLayer.innerHTML = "";
    labelsLayer.style.position = "absolute";
    labelsLayer.style.top = "0"; labelsLayer.style.left = "0";
    labelsLayer.style.width = "100%"; labelsLayer.style.height = "300px";
    labelsLayer.style.pointerEvents = "none";

    Object.keys(byWeight).forEach((wStr) => {
      const weight = parseInt(wStr, 10);
      const group = byWeight[weight];
      const theta = Math.PI * (weight / NQ);
      group.forEach((i, k) => {
        const phi = group.length > 1 ? (2 * Math.PI * k) / group.length : 0;
        const prob = amps[i].re * amps[i].re + amps[i].im * amps[i].im;
        if (prob < 1e-4) return;
        const x = Math.sin(theta) * Math.cos(phi);
        const z = Math.sin(theta) * Math.sin(phi);
        const y = Math.cos(theta);
        const phase = Math.atan2(amps[i].im, amps[i].re);
        const hue = ((((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI)) * 360;
        const color = hslToHex(hue, 80, 55);

        const r = 0.045 + Math.sqrt(prob) * 0.16;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshBasicMaterial({ color }));
        dot.position.set(x, y, z);
        qsGroup.add(dot);

        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
        qsGroup.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })));

        const proj = new THREE.Vector3(x * 1.15, y * 1.15, z * 1.15).project(qsCamera);
        const sx = (proj.x * 0.5 + 0.5) * qsRenderer.domElement.width / window.devicePixelRatio;
        const sy = (1 - (proj.y * 0.5 + 0.5)) * qsRenderer.domElement.height / window.devicePixelRatio;
        const lbl = document.createElement("div");
        lbl.className = "qsphere-label";
        lbl.style.left = sx + "px";
        lbl.style.top = sy + "px";
        lbl.textContent = `|${i.toString(2).padStart(NQ, "0")}⟩`;
        labelsLayer.appendChild(lbl);
      });
    });
    qsRenderer.render(qsScene, qsCamera);
  }

  // ---------- Orchestration ----------
  function renderAll() {
    renderWires();
    renderInspector();
    renderQASM();
    const amps = simulate();
    renderProbChart(amps);
    renderQSphere(amps);
  }

  function init() {
    if (!document.getElementById("qc-wires")) return;
    wirePalette();
    initQSphere();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();