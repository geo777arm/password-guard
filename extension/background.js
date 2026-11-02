// Ходит в базу утечек Have I Been Pwned.
// Отправляем только первые 5 символов SHA-1 хэша пароля (k-анонимность):
// сам пароль и даже полный хэш никогда не покидают компьютер.
async function countLeaks(sha1) {
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  for (const line of text.split("\n")) {
    const [hashSuffix, count] = line.trim().split(":");
    if (hashSuffix === suffix) return parseInt(count, 10);
  }
  return 0;
}

// Соль хранится локально, чтобы отпечатки паролей нельзя было подобрать по готовым таблицам.
async function getSalt() {
  const { salt } = await chrome.storage.local.get("salt");
  if (salt) return salt;
  const fresh = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
  await chrome.storage.local.set({ salt: fresh });
  return fresh;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
}

// Запоминаем отпечаток пароля для сайта и возвращаем другие сайты с тем же паролем.
async function checkReuse(password, site, save = true) {
  const fingerprint = await sha256((await getSalt()) + password);
  const { fingerprints = {} } = await chrome.storage.local.get("fingerprints");
  const otherSites = Object.entries(fingerprints)
    .filter(([s, fp]) => s !== site && fp === fingerprint)
    .map(([s]) => s);
  if (save) { // поддельные сайты не запоминаем, чтобы они не попадали в список повторов
    fingerprints[site] = fingerprint;
    await chrome.storage.local.set({ fingerprints });
  }
  return otherSites;
}

// Журнал отправок: что именно ушло в интернет (только префиксы хэша), последние 5 штук.
async function logSent(prefix) {
  const { sentLog = [] } = await chrome.storage.local.get("sentLog");
  sentLog.unshift({ prefix, time: Date.now() });
  await chrome.storage.local.set({ sentLog: sentLog.slice(0, 5) });
}

async function bumpStats(leaked, reused) {
  const { stats = { checked: 0, leaked: 0, reused: 0 } } = await chrome.storage.local.get("stats");
  stats.checked++;
  if (leaked) stats.leaked++;
  if (reused) stats.reused++;
  await chrome.storage.local.set({ stats });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Ручная проверка из окошка: только база утечек, без отпечатков и статистики.
  if (msg.type === "leaks") {
    countLeaks(msg.sha1)
      .then(async leaks => { await logSent(msg.sha1.slice(0, 5)); sendResponse({ ok: true, leaks, sent: msg.sha1.slice(0, 5) }); })
      .catch(e => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type !== "check") return;
  (async () => {
    try {
      const [leaks, otherSites] = await Promise.all([
        countLeaks(msg.sha1),
        checkReuse(msg.password, msg.site, !msg.suspicious)
      ]);
      await bumpStats(leaks > 0, otherSites.length > 0);
      await logSent(msg.sha1.slice(0, 5));
      sendResponse({ ok: true, leaks, otherSites, sent: msg.sha1.slice(0, 5) });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true;
});

// Пункт «Проверить ссылку» в меню правого клика. Сама проверка идёт на странице (sitecheck.js).
const MENU_TITLE = { ru: "Проверить ссылку (Password Guard)", en: "Check this link (Password Guard)" };

async function setupMenu() {
  const { lang } = await chrome.storage.local.get("lang");
  const l = lang || (navigator.language.startsWith("ru") ? "ru" : "en");
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "check-link", title: MENU_TITLE[l], contexts: ["link"] });
  });
}
chrome.runtime.onInstalled.addListener(setupMenu);
chrome.runtime.onStartup.addListener(setupMenu);
chrome.storage.onChanged.addListener(changes => { if (changes.lang) setupMenu(); });

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "check-link" || !tab) return;
  chrome.tabs.sendMessage(tab.id, { type: "checkLink", url: info.linkUrl }, { frameId: 0 }).catch(() => {});
});
