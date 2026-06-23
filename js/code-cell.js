/* ===========================================================
   Shared Pyodide code-cell wiring — runs Python in the browser,
   lazy-loaded only when "Run" is first clicked. Used by any chapter
   with a `.code-cell` element; no dependency on Three.js or KaTeX.
   =========================================================== */
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
          await py.loadPackage("numpy");
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
    if (!runBtn || !textarea) return;
    const original = textarea.value;

    runBtn.addEventListener("click", async () => {
      status.textContent = "loading python runtime + numpy…";
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

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        textarea.value = original;
        output.classList.remove("is-visible");
        status.textContent = "";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".code-cell").forEach(wireCodeCell);
  });
})();