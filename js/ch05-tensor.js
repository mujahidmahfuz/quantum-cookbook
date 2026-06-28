(function () {
  function round2(v) { return Math.round(v * 100) / 100; }

  // ---------- Fig 5.1: vector tensor product ----------
  function renderVecTensor() {
    const list = document.getElementById("tensor-vec-result");
    if (!list) return;
    const a1 = parseFloat(document.getElementById("tva1").value) || 0;
    const a2 = parseFloat(document.getElementById("tva2").value) || 0;
    const b1 = parseFloat(document.getElementById("tvb1").value) || 0;
    const b2 = parseFloat(document.getElementById("tvb2").value) || 0;
    const terms = [
      { label: "a₁b₁", val: a1 * b1 },
      { label: "a₁b₂", val: a1 * b2 },
      { label: "a₂b₁", val: a2 * b1 },
      { label: "a₂b₂", val: a2 * b2 },
    ];
    list.innerHTML = terms.map((t, i) =>
      `index ${i} (|${(i >> 1) & 1}${i & 1}⟩):  <span class="term">${t.label} =</span> <span class="val">${round2(t.val)}</span>`
    ).join("<br/>");
  }

  function setVecPreset(a1, a2, b1, b2) {
    document.getElementById("tva1").value = a1;
    document.getElementById("tva2").value = a2;
    document.getElementById("tvb1").value = b1;
    document.getElementById("tvb2").value = b2;
    renderVecTensor();
  }

  function wireVecTensor() {
    ["tva1", "tva2", "tvb1", "tvb2"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", renderVecTensor);
    });
    document.querySelectorAll(".tensor-vec-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [a1, a2, b1, b2] = btn.dataset.preset.split(",").map(Number);
        setVecPreset(a1, a2, b1, b2);
      });
    });
  }

  // ---------- Fig 5.2: matrix tensor product ----------
  function readMat(prefix) {
    return [
      [parseFloat(document.getElementById(prefix + "00").value) || 0, parseFloat(document.getElementById(prefix + "01").value) || 0],
      [parseFloat(document.getElementById(prefix + "10").value) || 0, parseFloat(document.getElementById(prefix + "11").value) || 0],
    ];
  }
  function writeMat(prefix, M) {
    document.getElementById(prefix + "00").value = M[0][0];
    document.getElementById(prefix + "01").value = M[0][1];
    document.getElementById(prefix + "10").value = M[1][0];
    document.getElementById(prefix + "11").value = M[1][1];
  }

  function renderMatTensor() {
    const grid = document.getElementById("tensor-mat-result");
    if (!grid) return;
    const A = readMat("tma");
    const B = readMat("tmb");
    const quadClass = ["q-00", "q-01", "q-10", "q-11"];
    let cells = "";
    for (let i = 0; i < 2; i++) {
      for (let p = 0; p < 2; p++) {
        for (let j = 0; j < 2; j++) {
          for (let q = 0; q < 2; q++) {
            const val = round2(A[i][j] * B[p][q]);
            const quad = i * 2 + j; // which A-entry this block came from
            cells += `<div class="tb-cell ${quadClass[quad]}">${val}</div>`;
          }
        }
      }
    }
    grid.innerHTML = cells;
  }

  function wireMatTensor() {
    ["tma00", "tma01", "tma10", "tma11", "tmb00", "tmb01", "tmb10", "tmb11"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", renderMatTensor);
    });
    document.querySelectorAll(".tensor-mat-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const data = JSON.parse(btn.dataset.preset);
        writeMat("tma", data.A);
        writeMat("tmb", data.B);
        renderMatTensor();
      });
    });
  }

  function init() {
    if (document.getElementById("tensor-vec-result")) {
      wireVecTensor();
      renderVecTensor();
    }
    if (document.getElementById("tensor-mat-result")) {
      wireMatTensor();
      renderMatTensor();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();