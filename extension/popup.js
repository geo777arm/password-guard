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
}

for (const btn of document.querySelectorAll("[data-lang]")) {
  btn.addEventListener("click", async () => {
    LANG = btn.dataset.lang;
    await chrome.storage.local.set({ lang: LANG });
    renderTexts();
  });
}

const lengthInput = document.getElementById("length");
const output = document.getElementById("generated");

// закрашиваем полоску слайдера до текущего значения
function paintSlider() {
  const percent = (lengthInput.value - lengthInput.min) / (lengthInput.max - lengthInput.min) * 100;
  lengthInput.style.backgroundSize = percent + "% 100%, auto";
}

lengthInput.addEventListener("input", () => {
  document.getElementById("length-value").textContent = lengthInput.value;
  paintSlider();
});
paintSlider();

// generatePassword живёт в generator.js
document.getElementById("generate").addEventListener("click", () => {
  output.value = generatePassword(Number(lengthInput.value));
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

loadLang().then(renderTexts);
renderStats();
