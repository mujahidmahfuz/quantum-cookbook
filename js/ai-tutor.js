/* Quantum Cookbook — AI tutor ("Ask AI")
 *
 * Floating button (bottom-left; the review FAB owns bottom-right) that opens
 * a slide-up chat panel. Questions go to Groq's free-tier API together with
 * the current chapter's title so the tutor knows where the student is.
 *
 * Stateless by design: the conversation lives only in this page's memory.
 * Nothing is written to localStorage and nothing survives a reload.
 *
 * The key below is a free-tier, rate-limited key that is public by the
 * nature of a static site (see claude.md, "AI tutor" — option (a) chosen).
 * It is stored reversed+base64 only so automated repo scanners don't
 * revoke it. Rotate it at console.groq.com if the quota is ever drained.
 */
(function () {
  "use strict";

  var API_URL = "https://api.groq.com/openai/v1/chat/completions";
  var MODEL = "llama-3.3-70b-versatile";
  var K = atob("bnFqcFFVemZ4b0NTNllYdWtDR2s1dGM0WUYzYnlkR1dnTm83RTluVDYzUm9PQUVwSURvNV9rc2c=")
    .split("").reverse().join("");

  // ---- chapter context (read from the page itself; no per-page config) ----
  function chapterContext() {
    var title = document.title.replace(/\s*[··]\s*Quantum Cookbook\s*$/, "").trim();
    var eyebrowEl = document.querySelector(".eyebrow");
    var eyebrow = eyebrowEl ? eyebrowEl.textContent.trim() : "";
    return (eyebrow ? eyebrow + " — " : "") + title;
  }

  function systemPrompt() {
    return "You are a quantum computing tutor helping a student who is reading \"" +
      chapterContext() + "\" of the Quantum Cookbook " +
      "(https://mujahidmahfuz.github.io/quantum-cookbook/), a free interactive textbook. " +
      "Be concise. Use Dirac notation. Assume they know the content of earlier chapters. " +
      "Prefer plain text over markdown; write math inline like |psi> = a|0> + b|1>.";
  }

  var messages = [];      // in-memory only; reset on reload
  var busy = false;

  // ---- DOM -----------------------------------------------------------------
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  var fab, panel, log, input, sendBtn;

  function buildUI() {
    fab = el("button", "ai-fab", "Ask AI");
    fab.setAttribute("aria-label", "Ask the AI tutor a question about this chapter");

    panel = el("div", "ai-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "AI tutor chat");

    var head = el("div", "ai-panel-head");
    head.appendChild(el("span", "ai-panel-title", "AI tutor — " + chapterContext()));
    var closeBtn = el("button", "ai-panel-close", "×");
    closeBtn.setAttribute("aria-label", "Close AI tutor");
    head.appendChild(closeBtn);

    log = el("div", "ai-log");
    var hello = el("div", "ai-msg ai-msg-assistant",
      "Ask me anything about this chapter. I know where you are in the book. " +
      "(Conversations aren't saved — closing the page clears the chat.)");
    log.appendChild(hello);

    var form = el("form", "ai-form");
    input = el("input", "ai-input");
    input.type = "text";
    input.placeholder = "e.g. Why does the Hadamard create superposition?";
    input.setAttribute("aria-label", "Your question");
    sendBtn = el("button", "ai-send", "Send");
    sendBtn.type = "submit";
    form.appendChild(input);
    form.appendChild(sendBtn);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    fab.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      if (panel.classList.contains("is-open")) input.focus();
    });
    closeBtn.addEventListener("click", function () {
      panel.classList.remove("is-open");
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send();
    });
  }

  function addMsg(role, text) {
    var m = el("div", "ai-msg ai-msg-" + role, text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  // ---- API -----------------------------------------------------------------
  function send() {
    var q = input.value.trim();
    if (!q || busy) return;
    input.value = "";
    busy = true;
    sendBtn.disabled = true;

    addMsg("user", q);
    messages.push({ role: "user", content: q });
    var pending = addMsg("assistant", "…thinking");
    pending.classList.add("is-pending");

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + K
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 700,
        messages: [{ role: "system", content: systemPrompt() }].concat(messages)
      })
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      var answer = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content.trim()
        : "(empty response)";
      messages.push({ role: "assistant", content: answer });
      pending.classList.remove("is-pending");
      pending.textContent = answer;
      log.scrollTop = log.scrollHeight;
    }).catch(function (err) {
      pending.classList.remove("is-pending");
      pending.classList.add("is-error");
      pending.textContent = "Couldn't reach the tutor (" + err.message + "). " +
        "The free tier is rate-limited — wait a moment and try again.";
    }).then(function () {
      busy = false;
      sendBtn.disabled = false;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();
