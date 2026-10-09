(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.querySelector(".theme");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  function currentTheme() {
    return root.getAttribute("data-theme") || (systemDark.matches ? "dark" : "light");
  }
  function syncThemeButton() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    themeBtn.setAttribute("aria-label", "Switch to " + next + " theme");
  }
  if (themeBtn) {
    syncThemeButton();
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncThemeButton();
    });
    systemDark.addEventListener && systemDark.addEventListener("change", syncThemeButton);
  }

  /* ---------- App filters ---------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll(".app"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
  var countEl = document.getElementById("filter-count");
  var emptyEl = document.querySelector(".apps__empty");
  var resetBtn = document.querySelector(".chip--reset");
  var state = { company: "all", domain: "all" };
  var labels = {};
  chips.forEach(function (c) { labels[c.dataset.filter + ":" + c.dataset.value] = c.textContent; });

  function apply(animate) {
    var first = new Map();
    if (animate) cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });

    var shown = 0;
    cards.forEach(function (c) {
      var ok = (state.company === "all" || c.dataset.company === state.company) &&
               (state.domain === "all" || c.dataset.domain === state.domain);
      c.hidden = !ok;
      if (ok) shown++;
    });

    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(state[c.dataset.filter] === c.dataset.value));
    });

    var parts = [];
    if (state.company !== "all") parts.push(labels["company:" + state.company]);
    if (state.domain !== "all") parts.push(labels["domain:" + state.domain]);
    countEl.textContent = shown === cards.length
      ? "Showing all " + cards.length + " apps"
      : "Showing " + shown + " of " + cards.length + " apps" + (parts.length ? ": " + parts.join(", ") : "");
    emptyEl.hidden = shown !== 0;

    if (!animate || reduceMotion.matches) return;
    cards.forEach(function (c) {
      if (c.hidden) return;
      var last = c.getBoundingClientRect();
      var f = first.get(c);
      if (f) {
        var dx = f.left - last.left, dy = f.top - last.top;
        if (dx || dy) {
          c.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }],
                    { duration: 320, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
        }
      } else {
        c.animate([{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "none" }],
                  { duration: 260, easing: "ease-out" });
      }
    });
  }

  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      state[c.dataset.filter] = c.dataset.value;
      apply(true);
    });
  });
  if (resetBtn) resetBtn.addEventListener("click", function () {
    state.company = "all"; state.domain = "all"; apply(true);
  });

  /* Timeline "See the N apps" links filter the grid by that company */
  document.querySelectorAll("[data-show-company]").forEach(function (a) {
    a.addEventListener("click", function () {
      state.company = a.dataset.showCompany;
      state.domain = "all";
      apply(false);
    });
  });

})();
