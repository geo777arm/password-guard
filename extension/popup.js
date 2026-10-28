async function renderStats() {
  const { stats = { checked: 0, leaked: 0, reused: 0 } } = await chrome.storage.local.get("stats");
  for (const key of ["checked", "leaked", "reused"]) document.getElementById(key).textContent = stats[key];
}

// Подставляем тексты на выбранном языке во все элементы с data-i18n.
function renderTexts() {
  document.documentElement.lang = LANG;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  document.getElementById("generated").placeholder = t("placeholder");
  for (const btn of document.querySelectorAll("[data-lang]")) btn.classList.toggle("active", btn.dataset.lang === LANG);
  renderLength();
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
});

let savedMode = "random";
try { savedMode = localStorage.getItem("pg-mode") || "random"; } catch {}
setMode(MODES[savedMode] ? savedMode : "random");
loadLang().then(renderTexts);
renderStats();
