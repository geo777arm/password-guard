(() => {
  const checked = new WeakMap();

  async function sha1(text) {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  function badgeFor(input) {
    let badge = input._pgBadge;
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "pg-badge";
      document.body.appendChild(badge);
      input._pgBadge = badge;
    }
    const r = input.getBoundingClientRect();
    badge.style.top = `${window.scrollY + r.bottom + 6}px`;
    badge.style.left = `${window.scrollX + r.left}px`;
    badge.style.maxWidth = `${Math.max(r.width, 260)}px`;
    return badge;
  }

  function show(input, level, html) {
    const badge = badgeFor(input);
    badge.dataset.level = level;
    badge.innerHTML = html;
    badge.hidden = false;
  }

  async function check(input) {
    const pw = input.value;
    if (!pw || pw.length < 4 || checked.get(input) === pw) return;
    checked.set(input, pw);
    await loadLang();
    show(input, "info", t("checking"));

    const response = await chrome.runtime.sendMessage({
      type: "check",
      sha1: await sha1(pw),
      password: pw,
      site: location.hostname
    }).catch(e => ({ ok: false, error: String(e) }));

    if (input.value !== pw) return; // пароль успели поменять
    if (!response || !response.ok) {
      show(input, "info", t("offline"));
      return;
    }

    const lines = [];
    let level = "ok";
    if (response.leaks > 0) {
      level = "bad";
      lines.push(t("leak", response.leaks));
    }
    if (response.otherSites.length > 0) {
      if (level === "ok") level = "warn";
      lines.push(t("reuse", response.otherSites.slice(0, 3).join(", ")));
    }
    // checkStrength живёт в strength.js
    const tips = checkStrength(pw);
    if (tips.length > 0) {
      if (level === "ok") level = "warn";
      lines.push(t("howTo") + "<br>• " + tips.join("<br>• "));
    }
    if (lines.length === 0) lines.push(t("allGood"));
    show(input, level, lines.join("<br>"));
  }

  let timer;
  document.addEventListener("input", e => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || el.type !== "password") return;
    clearTimeout(timer);
    timer = setTimeout(() => check(el), 900);
  }, true);

  document.addEventListener("focusout", e => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.type === "password") check(el);
  }, true);
})();
