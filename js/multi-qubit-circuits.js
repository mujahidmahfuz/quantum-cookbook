(function () {
  const NUM_COLS = 6;
  const SHOTS = 1024;

  let grid = [new Array(NUM_COLS).fill(null), new Array(NUM_COLS).fill(null)]; // grid[wire][col] = gate name
  let cnotMap = {}; // col -> { control, target }
  let selected = null; // { wire, col }

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
    T: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }]],
  };

  function applyPairGate(amps, wire, M) {
    const mask = 1 << wire;
    const out = amps.slice();
    for (let i = 0; i < 4; i++) {
      if ((i & mask) === 0) {
        const j = i | mask, a = amps[i], b = amps[j];
        out[i] = cAdd(cMul(M[0][0], a), cMul(M[0][1], b));
        out[j] = cAdd(cMul(M[1][0], a), cMul(M[1][1], b));
      }
    }
    return out;
  }

  function applyCNOT(amps, control, target) {
    const out = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      let j = i;
      if ((i >> control) & 1) j = i ^ (1 << target);
      out[j] = amps[i];
    }
    return out;
  }

  function applyColumnOp(amps, col) {
    if (cnotMap[col]) return applyCNOT(amps, cnotMap[col].control, cnotMap[col].target);
    let result = amps;
    for (let w = 0; w < 2; w++) {
      if (grid[w][col]) result = applyPairGate(result, w, GATE_MATS[grid[w][col]]);
    }
    return result;
  }

  function columnIsEmpty(col) {
    return !cnotMap[col] && grid[0][col] === null && grid[1][col] === null;
  }

  // ---------- Rendering the circuit ----------
  function renderCircuit() {
    const wrap = document.getElementById("mq-rows");
    if (!wrap) return;
    wrap.innerHTML = "";

    [0, 1].forEach((wire) => {
      const row = document.createElement("div");
      row.className = "qubit-row";

      const label = document.createElement("div");
      label.className = "qubit-label";
      label.textContent = `q${wire}`;
      row.appendChild(label);

      for (let col = 0; col < NUM_COLS; col++) {
        const cell = document.createElement("div");
        cell.className = "q-cell";
        cell.dataset.wire = wire;
        cell.dataset.col = col;

        if (cnotMap[col]) {
          if (cnotMap[col].control === wire) { cell.classList.add("is-cnot-ctrl"); cell.textContent = "●"; }
          else { cell.classList.add("is-cnot-targ"); cell.textContent = "⊕"; }
        } else if (grid[wire][col]) {
          cell.classList.add("is-filled");
          cell.textContent = grid[wire][col];
        }
        if (selected && selected.wire === wire && selected.col === col) cell.classList.add("is-selected");

        cell.addEventListener("click", () => onCellClick(wire, col));
        cell.addEventListener("dragover", (e) => { e.preventDefault(); cell.classList.add("is-over"); });
        cell.addEventListener("dragleave", () => cell.classList.remove("is-over"));
        cell.addEventListener("drop", (e) => {
          e.preventDefault();
          cell.classList.remove("is-over");
          const tile = e.dataTransfer.getData("tile");
          if (tile) placeTile(tile, wire, col);
        });
        row.appendChild(cell);
      }

      const meter = document.createElement("div");
      meter.className = "q-meter";
      meter.textContent = "M";
      row.appendChild(meter);

      wrap.appendChild(row);
    });

    renderConnectors();
  }

  function renderConnectors() {
    const layer = document.getElementById("mq-connectors");
    if (!layer) return;
    layer.innerHTML = "";
    const CELL = 44, GAP = 5, LABEL_W = 30;
    Object.keys(cnotMap).forEach((colStr) => {
      const col = parseInt(colStr, 10);
      const left = LABEL_W + col * (CELL + GAP) + CELL / 2 - 1;
      const line = document.createElement("div");
      line.className = "cnot-connector";
      line.style.left = left + "px";
      layer.appendChild(line);
    });
  }

  function onCellClick(wire, col) {
    if (cnotMap[col]) { delete cnotMap[col]; selected = null; renderCircuit(); recompute(); return; }
    if (grid[wire][col]) { grid[wire][col] = null; selected = null; renderCircuit(); recompute(); return; }
    selected = (selected && selected.wire === wire && selected.col === col) ? null : { wire, col };
    renderCircuit();
  }

  function placeTile(tile, wire, col) {
    if (tile === "CNOT") {
      if (!columnIsEmpty(col)) return;
      cnotMap[col] = { control: wire, target: 1 - wire };
    } else {
      if (cnotMap[col]) return;
      grid[wire][col] = tile;
    }
    selected = null;
    renderCircuit();
    recompute();
  }

  function wirePalette() {
    document.querySelectorAll(".mq-tile").forEach((tile) => {
      tile.addEventListener("dragstart", (e) => e.dataTransfer.setData("tile", tile.dataset.tile));
      tile.addEventListener("click", () => {
        if (!selected) return;
        placeTile(tile.dataset.tile, selected.wire, selected.col);
      });
    });
    const clearBtn = document.getElementById("mq-clear");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      grid = [new Array(NUM_COLS).fill(null), new Array(NUM_COLS).fill(null)];
      cnotMap = {};
      selected = null;
      renderCircuit();
      recompute();
    });
  }

  // ---------- Simulation, step list, code generation ----------
  function fmtC(a) {
    const re = Math.abs(a.re) < 1e-6 ? 0 : a.re;
    const im = Math.abs(a.im) < 1e-6 ? 0 : a.im;
    return `${re.toFixed(2)}${im >= 0 ? "+" : ""}${im.toFixed(2)}i`;
  }

  function simulate() {
    let amps = [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }];
    const history = [{ label: "Start  |00⟩", amps: amps.slice() }];
    for (let col = 0; col < NUM_COLS; col++) {
      if (columnIsEmpty(col)) continue;
      amps = applyColumnOp(amps, col);
      const desc = cnotMap[col]
        ? `CNOT (ctrl q${cnotMap[col].control} → targ q${cnotMap[col].target})`
        : [0, 1].filter((w) => grid[w][col]).map((w) => `${grid[w][col]} on q${w}`).join(", ");
      history.push({ label: `Col ${col + 1}  ${desc}`, amps: amps.slice() });
    }
    return history;
  }

  function renderSteps(history) {
    const out = document.getElementById("mq-steps");
    if (!out) return;
    const labels = ["00", "01", "10", "11"];
    const lines = history.map((h) => {
      const parts = labels.map((l, i) => `${l}:${fmtC(h.amps[i])}`).join("  ");
      return `${h.label.padEnd(28)}${parts}`;
    });
    const finalAmps = history[history.length - 1].amps;
    const probs = finalAmps.map((a) => a.re * a.re + a.im * a.im);
    lines.push("");
    lines.push(`Exact probabilities:  00:${(probs[0] * 100).toFixed(1)}%  01:${(probs[1] * 100).toFixed(1)}%  10:${(probs[2] * 100).toFixed(1)}%  11:${(probs[3] * 100).toFixed(1)}%`);
    out.textContent = lines.join("\n");
    return probs;
  }

  // Derive the explicit 4x4 matrix for a column by applying it to each basis vector —
  // guarantees the generated code matches the simulator exactly.
  function columnMatrix(col) {
    const cols = [];
    for (let b = 0; b < 4; b++) {
      const basis = [0, 1, 2, 3].map((i) => ({ re: i === b ? 1 : 0, im: 0 }));
      cols.push(applyColumnOp(basis, col));
    }
    // cols[b][r] is row r, column b
    const M = [[], [], [], []];
    for (let r = 0; r < 4; r++) for (let b = 0; b < 4; b++) M[r][b] = cols[b][r];
    return M;
  }

  function fmtPy(a) {
    const re = Math.abs(a.re) < 1e-9 ? 0 : Math.round(a.re * 1000) / 1000;
    const im = Math.abs(a.im) < 1e-9 ? 0 : Math.round(a.im * 1000) / 1000;
    if (im === 0) return `${re}`;
    if (re === 0) return `${im}j`;
    return `${re}${im >= 0 ? "+" : ""}${im}j`;
  }

  function renderCode() {
    const cell = document.getElementById("mq-code-cell");
    if (!cell) return;
    const textarea = cell.querySelector("textarea");
    if (!textarea) return;

    const activeCols = [];
    for (let col = 0; col < NUM_COLS; col++) if (!columnIsEmpty(col)) activeCols.push(col);

    if (activeCols.length === 0) {
      textarea.value = "# Place gates on the circuit above, then this fills in automatically.\nimport numpy as np\n\nstate = np.array([1, 0, 0, 0], dtype=complex)  # |00>, ordered [00, 01, 10, 11]\nprint(state)";
      return;
    }

    const blocks = activeCols.map((col) => {
      const M = columnMatrix(col);
      const rows = M.map((row) => "[" + row.map(fmtPy).join(", ") + "]").join(",\n              ");
      const comment = cnotMap[col]
        ? `# CNOT, control=q${cnotMap[col].control}, target=q${cnotMap[col].target}`
        : `# ${[0, 1].filter((w) => grid[w][col]).map((w) => `${grid[w][col]} on q${w}`).join(", ")} (identity on the other qubit — a tensor/Kronecker product, see Ch. 5)`;
      return `${comment}\nop_col${col} = np.array([${rows}], dtype=complex)\nstate = op_col${col} @ state\nprint("after col ${col + 1}:", state)`;
    });

    textarea.value =
      `import numpy as np\n\n# Basis order is [|00>, |01>, |10>, |11>]\nstate = np.array([1, 0, 0, 0], dtype=complex)\n\n${blocks.join("\n\n")}\n\nprobs = np.abs(state) ** 2\nprint("P(00,01,10,11) =", probs)`;
  }

  // ---------- Measurement histogram (the "gamified" results panel) ----------
  function runShots(probs) {
    const counts = [0, 0, 0, 0];
    for (let s = 0; s < SHOTS; s++) {
      const r = Math.random();
      let cum = 0, picked = 3;
      for (let i = 0; i < 4; i++) { cum += probs[i]; if (r <= cum) { picked = i; break; } }
      counts[picked]++;
    }
    return counts;
  }

  function renderHistogram(counts) {
    const labels = ["00", "01", "10", "11"];
    const max = Math.max(...counts, 1);
    labels.forEach((l, i) => {
      const bar = document.getElementById("hist-bar-" + l);
      const val = document.getElementById("hist-val-" + l);
      if (!bar || !val) return;
      bar.style.height = "0%";
      val.textContent = "0";
      setTimeout(() => {
        bar.style.height = (counts[i] / max * 100) + "%";
        val.textContent = `${counts[i]} (${(counts[i] / SHOTS * 100).toFixed(1)}%)`;
      }, 30);
    });
  }

  function recompute() {
    const history = simulate();
    const probs = renderSteps(history);
    renderCode();
    renderHistogram([0, 0, 0, 0]);
    window.__mqProbs = probs;
  }

  function wireRun() {
    const btn = document.getElementById("mq-run");
    if (!btn) return;
    btn.addEventListener("click", () => {
      btn.disabled = true;
      btn.textContent = "Running 1024 shots…";
      setTimeout(() => {
        const counts = runShots(window.__mqProbs || [1, 0, 0, 0]);
        renderHistogram(counts);
        btn.disabled = false;
        btn.textContent = "Run on simulator ▸";
      }, 350);
    });
  }

  function wireCodeResetOverride() {
    const cell = document.getElementById("mq-code-cell");
    if (!cell) return;
    const resetBtn = cell.querySelector(".js-reset");
    if (resetBtn) resetBtn.addEventListener("click", () => renderCode());
  }

  function init() {
    if (!document.getElementById("mq-rows")) return;
    wirePalette();
    wireRun();
    wireCodeResetOverride();
    renderCircuit();
    recompute();
  }

  document.addEventListener("DOMContentLoaded", init);
})();