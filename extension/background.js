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
async function checkReuse(password, site) {
  const fingerprint = await sha256((await getSalt()) + password);
  const { fingerprints = {} } = await chrome.storage.local.get("fingerprints");
  const otherSites = Object.entries(fingerprints)
    .filter(([s, fp]) => s !== site && fp === fingerprint)
    .map(([s]) => s);
  fingerprints[site] = fingerprint;
  await chrome.storage.local.set({ fingerprints });
  return otherSites;
}

async function bumpStats(leaked, reused) {
  const { stats = { checked: 0, leaked: 0, reused: 0 } } = await chrome.storage.local.get("stats");
  stats.checked++;
  if (leaked) stats.leaked++;
  if (reused) stats.reused++;
  await chrome.storage.local.set({ stats });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "check") return;
  (async () => {
    try {
      const [leaks, otherSites] = await Promise.all([
        countLeaks(msg.sha1),
        checkReuse(msg.password, msg.site)
      ]);
      await bumpStats(leaks > 0, otherSites.length > 0);
      sendResponse({ ok: true, leaks, otherSites });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true;
});
