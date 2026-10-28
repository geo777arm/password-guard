// Проверка сайта и формы перед вводом пароля: поддельные адреса и пароль без шифрования.
// Всё считается на компьютере, никуда не отправляется.

// Настоящие адреса популярных сервисов. Ключ — имя, которое обычно подделывают.
const BRANDS = {
  google: ["google.com", "googleusercontent.com", "gstatic.com", "googleapis.com"],
  gmail: ["gmail.com", "google.com"],
  youtube: ["youtube.com", "google.com"],
  apple: ["apple.com"],
  icloud: ["icloud.com", "apple.com"],
  microsoft: ["microsoft.com", "microsoftonline.com", "live.com"],
  outlook: ["outlook.com", "live.com", "office.com", "microsoft.com"],
  office: ["office.com", "microsoft.com"],
  facebook: ["facebook.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com"],
  tiktok: ["tiktok.com"],
  twitter: ["twitter.com", "x.com"],
  paypal: ["paypal.com"],
  amazon: ["amazon.com"],
  netflix: ["netflix.com"],
  spotify: ["spotify.com"],
  github: ["github.com"],
  linkedin: ["linkedin.com"],
  snapchat: ["snapchat.com"],
  discord: ["discord.com", "discord.gg"],
  steam: ["steampowered.com", "steamcommunity.com"],
  steamcommunity: ["steamcommunity.com"],
  steampowered: ["steampowered.com"],
  roblox: ["roblox.com"],
  epicgames: ["epicgames.com"],
  telegram: ["telegram.org", "t.me"],
  binance: ["binance.com"],
  dropbox: ["dropbox.com"],
  yandex: ["yandex.ru", "ya.ru", "yandex.com"],
  gosuslugi: ["gosuslugi.ru"],
  sberbank: ["sberbank.ru", "sber.ru"],
  tinkoff: ["tinkoff.ru", "tbank.ru"],
  wildberries: ["wildberries.ru"],
  avito: ["avito.ru"],
};

// Цифры и буквы, которыми подменяют настоящие: g00gle, paypa1, rnicrosoft.
const LOOKALIKE = [["rn", "m"], ["vv", "w"], ["0", "o"], ["1", "l"], ["3", "e"], ["4", "a"], ["5", "s"], ["7", "t"], ["8", "b"], ["9", "g"], ["-", ""]];

function skeleton(name) {
  let s = name.toLowerCase();
  for (const [from, to] of LOOKALIKE) s = s.split(from).join(to);
  return s.replace(/i/g, "l");
}

// Сколько букв надо поменять, чтобы из a получить b (расстояние Левенштейна).
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

// Опечатка в одну букву или две соседние буквы переставлены местами (gtihub)
function isTypo(a, b) {
  if (editDistance(a, b) === 1) return true;
  if (a.length !== b.length) return false;
  const diff = [...a].map((c, i) => (c !== b[i] ? i : -1)).filter(i => i >= 0);
  return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]];
}

// Основной домен: login.paypal.com → paypal.com, bbc.co.uk → bbc.co.uk
function baseDomain(host) {
  const parts = host.toLowerCase().replace(/\.$/, "").split(".");
  const n = parts.length;
  if (n >= 3 && parts[n - 1].length === 2 && ["co", "com", "net", "org", "gov", "edu", "ac"].includes(parts[n - 2])) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

function isOfficial(host, domains) {
  host = host.toLowerCase();
  return domains.some(d => host === d || host.endsWith("." + d));
}

// Возвращает список предупреждений о сайте: [{level, key, args}]
function checkSite(host) {
  host = host.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost")) return [];
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) {
    return [{ level: "warn", key: "siteIp", args: [] }];
  }
  const warnings = [];
  if (host.split(".").some(label => label.startsWith("xn--"))) {
    warnings.push({ level: "bad", key: "sitePunycode", args: [] });
  }

  const base = baseDomain(host);
  const name = base.split(".")[0];
  const sub = host.slice(0, Math.max(0, host.length - base.length - 1)).split(".").filter(Boolean);
  const nameSkel = skeleton(name);

  if (Object.values(BRANDS).some(list => isOfficial(host, list))) return warnings;

  const brands = Object.entries(BRANDS).filter(([brand]) => brand !== name); // google.de, amazon.co.uk — свои версии для стран
  // Сначала ищем подделку (g00gle, paypa1, gtihub), потом просто похожие адреса (google-login.com)
  const fake = brands.find(([brand]) => nameSkel === skeleton(brand) || (brand.length >= 5 && name.length >= 5 && isTypo(name, brand)));
  const similar = brands.find(([brand]) => sub.includes(brand) || (brand.length >= 5 && nameSkel.includes(skeleton(brand))));
  if (fake) warnings.push({ level: "bad", key: "siteFake", args: [fake[1][0]] });
  else if (similar) warnings.push({ level: "warn", key: "siteSimilar", args: [similar[1][0]] });
  return warnings;
}

// Проверка страницы и формы, куда уйдёт пароль.
function checkForm(pageUrl, actionUrl) {
  const page = new URL(pageUrl);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(page.hostname);
  const warnings = [];
  if (page.protocol === "http:" && !local) {
    warnings.push({ level: "bad", key: "formHttp", args: [] });
  }
  if (actionUrl) {
    let action;
    try { action = new URL(actionUrl, pageUrl); } catch { return warnings; }
    if (action.protocol === "http:" && page.protocol === "https:") {
      warnings.push({ level: "bad", key: "formActionHttp", args: [] });
    } else if (/^https?:$/.test(action.protocol) && baseDomain(action.hostname) !== baseDomain(page.hostname)) {
      warnings.push({ level: "warn", key: "formOther", args: [action.hostname] });
    }
  }
  return warnings;
}
