(function () {
  let N = 15, a = 7;

  const VALID_A = {
    15: [2, 4, 7, 8, 11, 13, 14],
    21: [2, 4, 5, 8, 10, 11, 13, 16, 17, 19, 20],
    35: [2, 3, 4, 6, 8, 9, 11, 12, 13],
  };

  function gcd(x, y) { while (y) { [x, y] = [y, x % y]; } return x; }
  function findOrder(a, N) { let x = 1; for (let r = 1; r <= N; r++) { x = (x * a) % N; if (x === 1) return r; } return -1; }

  function render() {
    const A = window.QCAlgo;
    const r = findOrder(a, N);

    // sequence panel
    const seq = [];
    let v = 1;
    for (let x = 0; x < Math.min(2 * r + 2, 16); x++) { seq.push(v); v = (v * a) % N; }
    document.getElementById("shor-sequence").innerHTML = seq.map((val, x) => {
      const h = Math.round((val / N) * 130);
      return `<div class="amp-bar-col"><div class="amp-bar-track"><div class="amp-bar-fill${x % r === 0 ? "" : " is-neg"}" style="height:${h}px;"></div></div><div class="amp-bar-label">${val}</div></div>`;
    }).join("");
    document.getElementById("shor-order").textContent = `Order of ${a} mod ${N}: r = ${r}  (the sequence repeats every ${r} steps — blue bars mark each repeat)`;

    // QPE recovers phase 1/r independently
    const t = 8;
    const Nq = 1 << t;
    const phi = 1 / r;
    const ampsQ = new Array(Nq).fill(null).map((_, k) => { const th = 2 * Math.PI * phi * k; return { re: Math.cos(th) / Math.sqrt(Nq), im: Math.sin(th) / Math.sqrt(Nq) }; });
    const result = A.iqft(ampsQ);
    const p = A.probs(result);
    let bestIdx = 0, bestP = 0;
    p.forEach((pr, i) => { if (pr > bestP) { bestP = pr; bestIdx = i; } });
    const recoveredR = Math.round(Nq / bestIdx);
    document.getElementById("shor-qpe").textContent = `Quantum phase estimation (8 bits) independently recovers φ ≈ ${(bestIdx / Nq).toFixed(4)} = 1/${recoveredR} → r = ${recoveredR} ${recoveredR === r ? "(matches!)" : ""}`;

    // factoring outcome
    let html;
    if (r % 2 !== 0) {
      html = `r = ${r} is odd — this attempt fails (Shor's algorithm needs an even order). Try a different a.`;
    } else {
      let half = 1; for (let i = 0; i < r / 2; i++) half = (half * a) % N;
      const p1 = gcd(half - 1, N), p2 = gcd(half + 1, N);
      if (p1 === 1 || p1 === N || p2 === 1 || p2 === N) {
        html = `r = ${r} is even, but gcd(a^(r/2)±1, N) gave a trivial factor — this attempt fails. Try a different a.`;
      } else {
        html = `r = ${r} is even → gcd(${a}^${r / 2}−1, ${N}) = <strong>${p1}</strong>, gcd(${a}^${r / 2}+1, ${N}) = <strong>${p2}</strong>. ${N} = ${p1} × ${p2} ✓`;
      }
    }
    document.getElementById("shor-result").innerHTML = html;
  }

  function rebuildAOptions() {
    const sel = document.getElementById("shor-a-select");
    sel.innerHTML = VALID_A[N].map((v) => `<option value="${v}"${v === a ? " selected" : ""}>${v}</option>`).join("");
  }

  function init() {
    if (!document.getElementById("shor-widget")) return;
    document.getElementById("shor-n-select").addEventListener("change", (e) => {
      N = parseInt(e.target.value, 10);
      a = VALID_A[N][0];
      rebuildAOptions();
      render();
    });
    document.getElementById("shor-a-select").addEventListener("change", (e) => {
      a = parseInt(e.target.value, 10);
      render();
    });
    rebuildAOptions();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();