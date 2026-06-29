(function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  const re = (x) => ({ re: x, im: 0 });
  function round3(v) { return Math.round(v * 1000) / 1000; }
  const DIM = 8;

  function applyPairGate(amps, wire, M) {
    const mask = 1 << wire;
    const out = amps.slice();
    for (let i = 0; i < DIM; i++) if ((i & mask) === 0) {
      const j = i | mask, a = amps[i], b = amps[j];
      out[i] = cAdd(cMul(M[0][0], a), cMul(M[0][1], b));
      out[j] = cAdd(cMul(M[1][0], a), cMul(M[1][1], b));
    }
    return out;
  }
  function applyCZ(amps, a, b) {
    return amps.map((amp, i) => (((i >> a) & 1) && ((i >> b) & 1)) ? { re: -amp.re, im: -amp.im } : amp);
  }
  const SQRT1_2 = 1 / Math.sqrt(2);
  const H = [[re(SQRT1_2), re(SQRT1_2)], [re(SQRT1_2), re(-SQRT1_2)]];
  const X = [[re(0), re(1)], [re(1), re(0)]];
  const Z = [[re(1), re(0)], [re(0), re(-1)]];

  const EDGE_KEYS = ["0-1", "1-2", "0-2"];
  let edges = new Set(["0-1", "1-2"]); // default: a 3-node path

  function computeGraphState() {
    let state = new Array(DIM).fill(null).map((_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }));
    [0, 1, 2].forEach((w) => { state = applyPairGate(state, w, H); });
    edges.forEach((key) => {
      const [a, b] = key.split("-").map(Number);
      state = applyCZ(state, a, b);
    });
    return state;
  }

  function neighborsOf(v) {
    const ns = [];
    edges.forEach((key) => {
      const [a, b] = key.split("-").map(Number);
      if (a === v) ns.push(b);
      if (b === v) ns.push(a);
    });
    return ns;
  }

  function applyStabilizer(state, vertex) {
    let s = applyPairGate(state, vertex, X);
    neighborsOf(vertex).forEach((n) => { s = applyPairGate(s, n, Z); });
    return s;
  }

  function statesEqual(a, b) {
    return a.every((z, i) => Math.abs(z.re - b[i].re) < 1e-9 && Math.abs(z.im - b[i].im) < 1e-9);
  }

  function renderGraph() {
    const svg = document.getElementById("graph-svg");
    const positions = { 0: [80, 30], 1: [30, 130], 2: [130, 130] };
    let s = "";
    EDGE_KEYS.forEach((key) => {
      const [a, b] = key.split("-").map(Number);
      const active = edges.has(key);
      s += `<line x1="${positions[a][0]}" y1="${positions[a][1]}" x2="${positions[b][0]}" y2="${positions[b][1]}" class="graph-edge${active ? " is-active" : ""}" data-edge="${key}" />`;
    });
    [0, 1, 2].forEach((v) => {
      s += `<circle cx="${positions[v][0]}" cy="${positions[v][1]}" r="16" class="graph-node" data-node="${v}" />`;
      s += `<text x="${positions[v][0]}" y="${positions[v][1] + 4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="#1c1a16" style="pointer-events:none;">q${v}</text>`;
    });
    svg.innerHTML = s;
    svg.querySelectorAll("[data-edge]").forEach((el) => {
      el.addEventListener("click", () => {
        const key = el.dataset.edge;
        if (edges.has(key)) edges.delete(key); else edges.add(key);
        renderAll();
      });
    });
  }

  function renderAll() {
    renderGraph();
    const state = computeGraphState();
    document.getElementById("graph-state").textContent = state.map((z, i) => Math.abs(z.re) > 1e-6 ? `${z.re > 0 ? "+" : "-"}|${i.toString(2).padStart(3, "0")}⟩` : "").filter(Boolean).join(" ") || "(no edges — product state)";

    const stabResults = [0, 1, 2].map((v) => {
      const ns = neighborsOf(v);
      const label = `X${v}` + ns.map((n) => `Z${n}`).join("");
      const ok = statesEqual(applyStabilizer(computeGraphState(), v), computeGraphState());
      return `${label}: ${ok ? "✓ leaves state unchanged" : "✗ FAILED"}`;
    });
    document.getElementById("graph-stabilizers").innerHTML = stabResults.map((s) => `<div class="vec-readout" style="margin-bottom:6px;">${s}</div>`).join("");
  }

  function init() {
    if (!document.getElementById("graph-widget")) return;
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();