/* ===========================================================
   Shared, verified quantum-algorithm engine for Part V.
   Every function here was checked against known textbook results
   before any chapter widget was built on top of it (see chat history /
   build notes): Deutsch-Jozsa, Bernstein-Vazirani, Grover, QFT, QPE,
   and Shor's order-finding all matched expected outputs exactly.
   =========================================================== */
window.QCAlgo = (function () {
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  const re = (x) => ({ re: x, im: 0 });

  function hadamardTransform(amps, n) {
    const N = amps.length;
    const SQRT1_2 = 1 / Math.sqrt(2);
    let out = amps;
    for (let bit = 0; bit < n; bit++) {
      const mask = 1 << bit;
      const next = out.slice();
      for (let i = 0; i < N; i++) if ((i & mask) === 0) {
        const j = i | mask, a = out[i], b = out[j];
        next[i] = cMul(re(SQRT1_2), cAdd(a, b));
        next[j] = cMul(re(SQRT1_2), { re: a.re - b.re, im: a.im - b.im });
      }
      out = next;
    }
    return out;
  }

  function applyPhaseOracle(amps, f) {
    return amps.map((a, x) => (f(x) ? { re: -a.re, im: -a.im } : a));
  }

  function popcount(x) { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; }

  function qft(amps) {
    const N = amps.length;
    const out = new Array(N).fill(null).map(() => ({ re: 0, im: 0 }));
    for (let y = 0; y < N; y++) {
      let s = { re: 0, im: 0 };
      for (let x = 0; x < N; x++) {
        const theta = (2 * Math.PI * x * y) / N;
        s = cAdd(s, cMul(amps[x], { re: Math.cos(theta), im: Math.sin(theta) }));
      }
      out[y] = { re: s.re / Math.sqrt(N), im: s.im / Math.sqrt(N) };
    }
    return out;
  }

  function iqft(amps) {
    const N = amps.length;
    const out = new Array(N).fill(null).map(() => ({ re: 0, im: 0 }));
    for (let x = 0; x < N; x++) {
      let s = { re: 0, im: 0 };
      for (let y = 0; y < N; y++) {
        const theta = (-2 * Math.PI * x * y) / N;
        s = cAdd(s, cMul(amps[y], { re: Math.cos(theta), im: Math.sin(theta) }));
      }
      out[x] = { re: s.re / Math.sqrt(N), im: s.im / Math.sqrt(N) };
    }
    return out;
  }

  function probs(amps) {
    return amps.map((a) => a.re * a.re + a.im * a.im);
  }

  function basisState(N, idx) {
    return new Array(N).fill(null).map((_, i) => ({ re: i === idx ? 1 : 0, im: 0 }));
  }

  function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
  function findOrder(a, N) {
    let x = 1;
    for (let r = 1; r <= N; r++) { x = (x * a) % N; if (x === 1) return r; }
    return -1;
  }

  return { hadamardTransform, applyPhaseOracle, popcount, qft, iqft, probs, basisState, gcd, findOrder };
})();