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

  const RANK = { info: 0, ok: 1, warn: 2, bad: 3 };
  const escape = s => s.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

  // Поддельный сайт или форма без шифрования (sitecheck.js)
  function pageWarnings(input) {
    const action = input.form ? input.form.getAttribute("action") : null;
    return [...checkSite(location.hostname), ...checkForm(location.href, action)]
      .map(w => ({ level: w.level, text: t(w.key, ...w.args.map(escape)) }));
  }

  function worst(levels) {
    return levels.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "ok");
  }

  // Предупреждаем ещё до того, как человек начал вводить пароль.
  async function warnOnFocus(input) {
    await loadLang();
    const warnings = pageWarnings(input);
    if (warnings.length === 0 || input.value) return;
    show(input, worst(warnings.map(w => w.level)), warnings.map(w => w.text).join("<br>"));
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
      site: location.hostname,
      suspicious: checkSite(location.hostname).some(w => w.level === "bad")
    }).catch(e => ({ ok: false, error: String(e) }));

    if (input.value !== pw) return; // пароль успели поменять
    if (!response || !response.ok) {
      show(input, "info", t("offline"));
      return;
    }

    const warnings = pageWarnings(input);
    const lines = warnings.map(w => w.text);
    let level = worst(warnings.map(w => w.level));
    if (response.leaks > 0) {
      level = "bad";
      lines.push(t("leak", response.leaks));
    }
    const fakeSite = checkSite(location.hostname).some(w => w.level === "bad");
    if (response.otherSites.length > 0 && fakeSite) {
      level = "bad";
      lines.push(t("phished", response.otherSites.slice(0, 3).join(", ")));
    } else if (response.otherSites.length > 0) {
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

  document.addEventListener("focusin", e => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.type === "password") warnOnFocus(el);
  }, true);

  document.addEventListener("focusout", e => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.type === "password") check(el);
  }, true);
})();
