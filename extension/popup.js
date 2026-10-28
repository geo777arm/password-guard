async function renderStats() {
  const { stats = { checked: 0, leaked: 0, reused: 0 } } = await chrome.storage.local.get("stats");
  for (const key of ["checked", "leaked", "reused"]) document.getElementById(key).textContent = stats[key];
  // полоска: какая доля проверенных паролей не нашлась в утечках
  const safe = stats.checked ? (stats.checked - stats.leaked) / stats.checked * 100 : 0;
  document.getElementById("track-fill").style.width = safe + "%";
}

// Вкладка 2FA: сайты, где человек вводил пароль и где можно включить вход по коду.
async function renderTwofa() {
  const { fingerprints = {}, twofaDone = [] } = await chrome.storage.local.get(["fingerprints", "twofaDone"]);
  const sites = [...new Map(Object.keys(fingerprints).map(twofaFor).filter(Boolean).map(x => [x.site, x])).values()];
  const list = document.getElementById("twofa-list");
  list.replaceChildren();
  for (const { site, url } of sites) {
    const done = twofaDone.includes(site);
    const li = document.createElement("li");
    li.classList.toggle("done", done);
    const name = document.createElement("span");
    name.className = "mono";
    name.textContent = site;
    const link = document.createElement("a");
    link.href = url; link.target = "_blank"; link.rel = "noopener";
    link.textContent = t("twofaOpen") + " →";
    const mark = document.createElement("button");
    mark.className = "check";
    mark.setAttribute("aria-pressed", done);
    mark.textContent = done ? "✓ " + t("twofaDone") : t("twofaDone");
    mark.addEventListener("click", async () => {
      const next = done ? twofaDone.filter(s => s !== site) : [...twofaDone, site];
      await chrome.storage.local.set({ twofaDone: next });
      renderTwofa();
    });
    li.append(name, link, mark);
    list.append(li);
  }
  document.getElementById("twofa-empty").hidden = sites.length > 0;
  const doneCount = sites.filter(x => twofaDone.includes(x.site)).length;
  document.getElementById("twofa-count").textContent = sites.length ? t("twofaLeft", doneCount, sites.length) : "";
}

// Подставляем тексты на выбранном языке во все элементы с data-i18n.
function renderTexts() {
  document.documentElement.lang = LANG;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  document.getElementById("generated").placeholder = t("placeholder");
  document.getElementById("check-input").placeholder = t("checkPlaceholder");
  for (const btn of document.querySelectorAll("[data-lang]")) btn.classList.toggle("active", btn.dataset.lang === LANG);
  renderLength();
  renderTwofa();
}

for (const btn of document.querySelectorAll("[data-lang]")) {
  btn.addEventListener("click", async () => {
    LANG = btn.dataset.lang;
    await chrome.storage.local.set({ lang: LANG });
    if (mode === "words") output.value = "";
    renderTexts();
  });
}

const lengthInput = document.getElementById("length");
const output = document.getElementById("generated");

// Два режима: случайные символы (8–32) или случайные слова (3–6).
const MODES = {
  random: { min: 8, max: 32, value: 16 },
  words: { min: 3, max: 6, value: 4 },
};
let mode = "random";

function renderLength() {
  const n = Number(lengthInput.value);
  document.getElementById("length-value").textContent = n;
  document.getElementById("length-unit").textContent = mode === "words" ? t("words", n) : t("chars");
  document.getElementById("generator-hint").textContent = t(mode === "words" ? "hintWords" : "hintRandom");
  for (const btn of document.querySelectorAll("[data-mode]")) btn.classList.toggle("active", btn.dataset.mode === mode);
  // закрашиваем полоску слайдера до текущего значения
  const percent = (n - lengthInput.min) / (lengthInput.max - lengthInput.min) * 100;
  lengthInput.style.backgroundSize = percent + "% 100%, auto";
}

function setMode(next) {
  MODES[mode].value = Number(lengthInput.value);
  mode = next;
  lengthInput.min = MODES[mode].min;
  lengthInput.max = MODES[mode].max;
  lengthInput.value = MODES[mode].value;
  output.value = "";
  renderLength();
  try { localStorage.setItem("pg-mode", mode); } catch {}
}

for (const btn of document.querySelectorAll("[data-mode]")) {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
}
lengthInput.addEventListener("input", renderLength);

// generatePassword и generatePassphrase живут в generator.js
document.getElementById("generate").addEventListener("click", () => {
  const n = Number(lengthInput.value);
  output.value = mode === "words" ? generatePassphrase(n, LANG) : generatePassword(n);
});

document.getElementById("copy").addEventListener("click", async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  const copy = document.getElementById("copy");
  copy.textContent = t("copied");
  setTimeout(() => (copy.textContent = t("copy")), 1200);
});

// Сбрасываем статистику и отпечатки, но оставляем выбранный язык.
document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.clear();
  await chrome.storage.local.set({ lang: LANG });
  renderStats();
  renderTwofa();
});

// Ручная проверка пароля: хэш считается здесь, в базу уходят только первые 5 символов.
async function sha1(text) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

const checkInput = document.getElementById("check-input");
const checkResult = document.getElementById("check-result");

document.getElementById("check-show").addEventListener("click", () => {
  checkInput.type = checkInput.type === "password" ? "text" : "password";
});

document.getElementById("check-form").addEventListener("submit", async event => {
  event.preventDefault();
  const pw = checkInput.value;
  if (!pw) return;
  checkResult.hidden = false;
  checkResult.dataset.level = "info";
  checkResult.textContent = t("checking");
  const response = await chrome.runtime.sendMessage({ type: "leaks", sha1: await sha1(pw) })
    .catch(() => null);
  if (checkInput.value !== pw) return; // пароль успели поменять
  const lines = [];
  let level = "ok";
  if (!response || !response.ok) {
    level = "info";
    lines.push(t("offline"));
  } else if (response.leaks > 0) {
    level = "bad";
    lines.push(t("checkLeaked", response.leaks));
  } else {
    lines.push(t("checkClean"));
  }
  const tips = checkStrength(pw); // checkStrength живёт в strength.js
  if (tips.length > 0) {
    if (level === "ok") level = "warn";
    lines.push(t("howTo") + "<br>• " + tips.join("<br>• "));
  } else if (level !== "bad") {
    lines.push(t("checkStrong"));
  }
  checkResult.dataset.level = level;
  checkResult.innerHTML = lines.join("<br>");
});

// Если поменяли пароль после проверки, старый результат больше не про него.
checkInput.addEventListener("input", () => { checkResult.hidden = true; });

// Вкладки: на экране всегда один раздел, чтобы окошко не было перегружено.
function showTab(name) {
  for (const btn of document.querySelectorAll("[data-tab]")) {
    const active = btn.dataset.tab === name;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active);
  }
  for (const panel of document.querySelectorAll("[data-panel]")) panel.hidden = panel.dataset.panel !== name;
  try { localStorage.setItem("pg-tab", name); } catch {}
}
for (const btn of document.querySelectorAll("[data-tab]")) btn.addEventListener("click", () => showTab(btn.dataset.tab));
let savedTab = "check";
try { savedTab = localStorage.getItem("pg-tab") || "check"; } catch {}
showTab(["check", "generate", "twofa", "about"].includes(savedTab) ? savedTab : "check");

let savedMode = "random";
try { savedMode = localStorage.getItem("pg-mode") || "random"; } catch {}
setMode(MODES[savedMode] ? savedMode : "random");
loadLang().then(renderTexts);
renderStats();
