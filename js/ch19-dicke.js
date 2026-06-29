(function () {
  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    let r = 1;
    for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
    return Math.round(r);
  }

  function bitstringsOfWeight(n, k) {
    const results = [];
    for (let x = 0; x < (1 << n); x++) {
      let w = 0, t = x;
      while (t) { w += t & 1; t >>= 1; }
      if (w === k) results.push(x);
    }
    return results;
  }

  let n = 4, k = 2;

  function render() {
    const count = binom(n, k);
    const coeff = count > 0 ? 1 / Math.sqrt(count) : 0;
    const terms = bitstringsOfWeight(n, k);

    document.getElementById("dicke-n-val").textContent = n;
    document.getElementById("dicke-k-val").textContent = k;
    document.getElementById("dicke-binom").textContent = `C(${n},${k}) = ${count} terms, each with coefficient 1/√${count} ≈ ${coeff.toFixed(3)}`;

    const list = document.getElementById("dicke-terms");
    list.innerHTML = terms.map((x) => `|${x.toString(2).padStart(n, "0")}⟩`).join("  +  ");

    const normCheck = count * (coeff * coeff);
    document.getElementById("dicke-norm").textContent = `Normalization check: ${count} × (1/√${count})² = ${normCheck.toFixed(3)} (should be 1)`;

    const special = document.getElementById("dicke-special");
    if (k === 1) special.textContent = "This is exactly the W state for n qubits — W is the k=1 Dicke state, nothing more exotic.";
    else if (k === 0) special.textContent = "This is just |00...0⟩ — the trivial, fully product k=0 case.";
    else if (k === n) special.textContent = "This is just |11...1⟩ — the trivial, fully product k=n case.";
    else special.textContent = `This is a genuinely entangled Dicke state with ${count} equally-weighted terms.`;
  }

  function init() {
    if (!document.getElementById("dicke-widget")) return;
    document.getElementById("dicke-n-slider").addEventListener("input", (e) => {
      n = parseInt(e.target.value, 10);
      k = Math.min(k, n);
      document.getElementById("dicke-k-slider").max = n;
      document.getElementById("dicke-k-slider").value = k;
      render();
    });
    document.getElementById("dicke-k-slider").addEventListener("input", (e) => {
      k = parseInt(e.target.value, 10);
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();