(function () {
  let bits = [1, 1, 0]; // a, b, c (controls a,b; target c)

  function toffoli(a, b, c) { return [a, b, c ^ (a & b)]; }

  function render() {
    const [a, b, c] = bits;
    const [, , outC] = toffoli(a, b, c);

    document.querySelectorAll(".toff-bit-btn").forEach((btn) => {
      const i = parseInt(btn.dataset.bit, 10);
      btn.textContent = bits[i];
      btn.classList.toggle("is-active", bits[i] === 1);
    });

    document.getElementById("toff-result").innerHTML =
      `<strong>${a}</strong>, <strong>${b}</strong>, <strong>${c}</strong> → <strong>${a}</strong>, <strong>${b}</strong>, <strong>${outC}</strong>` +
      (outC !== c ? `  (target flipped — both controls were 1)` : `  (target unchanged — at least one control was 0)`);

    const rows = [];
    for (let i = 0; i < 8; i++) {
      const ia = (i >> 2) & 1, ib = (i >> 1) & 1, ic = i & 1;
      const [, , oc] = toffoli(ia, ib, ic);
      const isCurrent = ia === a && ib === b && ic === c;
      rows.push(`<div class="tt-cell${isCurrent ? " is-toggle" : ""}">${ia}${ib}${ic}</div><div class="tt-cell${isCurrent ? " is-toggle" : ""}">${ia}${ib}${oc}</div>`);
    }
    const grid = document.getElementById("toff-table");
    grid.style.gridTemplateColumns = "repeat(2, auto)";
    grid.innerHTML = `<div class="tt-cell is-header">abc (in)</div><div class="tt-cell is-header">abc' (out)</div>` + rows.join("");
  }

  function init() {
    if (!document.getElementById("toff-widget")) return;
    document.querySelectorAll(".toff-bit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.bit, 10);
        bits[i] = 1 - bits[i];
        render();
      });
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();