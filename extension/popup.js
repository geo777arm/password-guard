async function renderStats() {
  const { stats = { checked: 0, leaked: 0, reused: 0 } } = await chrome.storage.local.get("stats");
  for (const key of ["checked", "leaked", "reused"]) document.getElementById(key).textContent = stats[key];
}

const lengthInput = document.getElementById("length");
const output = document.getElementById("generated");
const hint = document.getElementById("generator-hint");

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
  const password = generatePassword(Number(lengthInput.value));
  output.value = password;
  hint.hidden = Boolean(password);
  hint.textContent = "Генератор пока пустой: допиши функцию generatePassword в generator.js";
});

document.getElementById("copy").addEventListener("click", async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  document.getElementById("copy").textContent = "Готово";
  setTimeout(() => (document.getElementById("copy").textContent = "Копировать"), 1200);
});

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.clear();
  renderStats();
});

renderStats();
