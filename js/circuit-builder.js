(function () {
  const SLOT_COUNT = 5;
  let slots = new Array(SLOT_COUNT).fill(null);

  const PY_DEF = {
    I: "I = np.eye(2)",
    X: "X = np.array([[0, 1],\n              [1, 0]])",
    Y: "Y = np.array([[0, -1j],\n              [1j, 0]])",
    Z: "Z = np.array([[1, 0],\n              [0, -1]])",
    H: "H = (1/np.sqrt(2)) * np.array([[1, 1],\n                                [1, -1]])",
    S: "S = np.array([[1, 0],\n              [0, 1j]])",
    T: "T = np.array([[1, 0],\n              [0, np.exp(1j*np.pi/4)]])",
  };

  function activeGates() {
    return slots.filter((g) => g !== null);
  }

  function renderSlots() {
    const rail = document.getElementById("circuit-rail");
    if (!rail) return;
    rail.innerHTML = "";
    slots.forEach((gate, i) => {
      const el = document.createElement("div");
      el.className = "circuit-slot" + (gate ? " is-filled" : "");
      el.dataset.index = i;
      el.textContent = gate || "";
      el.title = gate ? "Click to remove" : "Drop a gate here";

      el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("is-over"); });
      el.addEventListener("dragleave", () => el.classList.remove("is-over"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("is-over");
        const fromPalette = e.dataTransfer.getData("gate");
        const fromSlot = e.dataTransfer.getData("fromSlot");
        if (fromSlot !== "") {
          const fromIdx = parseInt(fromSlot, 10);
          const tmp = slots[i];
          slots[i] = slots[fromIdx];
          slots[fromIdx] = tmp;
        } else if (fromPalette) {
          slots[i] = fromPalette;
        }
        renderSlots();
        recompute();
      });

      if (gate) {
        el.draggable = true;
        el.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("fromSlot", String(i));
        });
        el.addEventListener("click", () => {
          slots[i] = null;
          renderSlots();
          recompute();
        });
      }
      rail.appendChild(el);
    });
  }

  function wirePalette() {
    document.querySelectorAll(".gate-tile").forEach((tile) => {
      tile.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("gate", tile.dataset.gate);
      });
      // Click-to-place fallback for touch / no drag-and-drop
      tile.addEventListener("click", () => {
        const emptyIdx = slots.findIndex((s) => s === null);
        if (emptyIdx === -1) return;
        slots[emptyIdx] = tile.dataset.gate;
        renderSlots();
        recompute();
      });
    });
    const clearBtn = document.getElementById("circuit-clear");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      slots = new Array(SLOT_COUNT).fill(null);
      renderSlots();
      recompute();
    });
  }

  function fmt(n) { return (Math.abs(n) < 1e-6 ? 0 : n).toFixed(3); }

  function recompute() {
    const gates = activeGates();
    renderSteps(gates);
    renderCode(gates);
  }

  function renderSteps(gates) {
    const out = document.getElementById("circuit-steps");
    if (!out) return;
    if (!window.QC) { out.textContent = "Loading…"; return; }

    let theta = 0, phi = 0;
    const lines = [];
    const c0_0 = Math.cos(theta / 2), c1re_0 = Math.sin(theta / 2) * Math.cos(phi), c1im_0 = Math.sin(theta / 2) * Math.sin(phi);
    lines.push(`Start  |0⟩                c0=${fmt(c0_0)}  c1=${fmt(c1re_0)}+${fmt(c1im_0)}i  (θ=0°, φ=0°)`);

    gates.forEach((g, i) => {
      const next = window.QC.computeNewAngles(g, theta, phi);
      theta = next.theta; phi = next.phi;
      const c0 = Math.cos(theta / 2);
      const c1re = Math.sin(theta / 2) * Math.cos(phi);
      const c1im = Math.sin(theta / 2) * Math.sin(phi);
      lines.push(
        `Step ${i + 1}  apply ${g}`.padEnd(24) +
        `c0=${fmt(c0)}  c1=${fmt(c1re)}${c1im >= 0 ? "+" : ""}${fmt(c1im)}i  (θ=${(theta * 180 / Math.PI).toFixed(0)}°, φ=${(((phi % (2*Math.PI))+2*Math.PI)%(2*Math.PI)*180/Math.PI).toFixed(0)}°)`
      );
    });

    if (gates.length === 0) {
      lines.push("(drop or click gates above to build a sequence)");
    } else {
      const finalTheta = theta, finalPhi = phi;
      const p0 = Math.cos(finalTheta / 2) ** 2;
      lines.push("");
      lines.push(`Final measurement odds:  P(0) = ${fmt(p0)}    P(1) = ${fmt(1 - p0)}`);
    }
    out.textContent = lines.join("\n");
  }

  function renderCode(gates) {
    const cell = document.getElementById("circuit-code-cell");
    if (!cell) return;
    const textarea = cell.querySelector("textarea");
    if (!textarea) return;

    if (gates.length === 0) {
      textarea.value = "# Drop or click gates above, then this fills in automatically.\nimport numpy as np\n\nstate = np.array([1, 0], dtype=complex)  # start at |0>\nprint(state)";
      return;
    }

    const used = [...new Set(gates)];
    const defs = used.map((g) => PY_DEF[g]).join("\n");
    const applyLines = gates.map((g) => `state = ${g} @ state\nprint("after ${g}:", state)`).join("\n");

    textarea.value =
      `import numpy as np\n\n${defs}\n\nstate = np.array([1, 0], dtype=complex)  # start at |0>\n\n${applyLines}\n\nprint("P(0) =", abs(state[0])**2, "  P(1) =", abs(state[1])**2)`;
  }

  function wireRun() {
    const runBtn = document.getElementById("circuit-run");
    if (!runBtn) return;
    runBtn.addEventListener("click", async () => {
      const gates = activeGates();
      if (gates.length === 0 || !window.QC) return;
      runBtn.disabled = true;
      runBtn.textContent = "Running…";
      const stepEls = [];
      await window.QC.runSequence(gates, (i) => {
        const slotEls = document.querySelectorAll("#circuit-rail .circuit-slot.is-filled");
        slotEls.forEach((el) => el.classList.remove("is-active"));
        if (slotEls[i]) slotEls[i].classList.add("is-active");
      });
      document.querySelectorAll("#circuit-rail .circuit-slot").forEach((el) => el.classList.remove("is-active"));
      runBtn.disabled = false;
      runBtn.textContent = "Run on Bloch sphere ▸";
    });
  }

  function wireCodeResetOverride() {
    const cell = document.getElementById("circuit-code-cell");
    if (!cell) return;
    const resetBtn = cell.querySelector(".js-reset");
    if (resetBtn) resetBtn.addEventListener("click", () => renderCode(activeGates()));
  }

  function init() {
    if (!document.getElementById("circuit-rail")) return;
    renderSlots();
    wirePalette();
    wireRun();
    wireCodeResetOverride();
    recompute();
  }

  document.addEventListener("DOMContentLoaded", init);
})();