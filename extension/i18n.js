// Переводы интерфейса. Язык хранится в chrome.storage.local под ключом "lang".
const STRINGS = {
  ru: {
    subtitle: "Защита паролей включена",
    checked: "Проверено", leaked: "В утечках", reused: "Повторы",
    generator: "Генератор пароля", chars: "символов",
    placeholder: "Здесь будет пароль",
    copy: "Копировать", copied: "Готово", generate: "Создать пароль",
    privacy: "Пароли не сохраняются и не отправляются. В базу утечек уходят только первые 5 символов хэша.",
    reset: "Сбросить",
    checking: "Проверяю пароль…",
    offline: "Не получилось проверить (нет интернета?)",
    leak: n => `<b>Этот пароль найден в утечках ${n.toLocaleString("ru-RU")} раз.</b> Хакеры пробуют такие пароли первыми, поменяй его.`,
    reuse: sites => `Такой же пароль уже стоит на: <b>${sites}</b>. Если взломают один сайт, взломают и остальные.`,
    howTo: "Как усилить пароль:",
    allGood: "В утечках не найден, на других сайтах не повторяется. Отлично!",
    tipLength: "Сделай пароль длиннее, хотя бы 12 символов.",
    tipDigits: "Добавь цифры.",
    tipCase: "Используй и большие, и маленькие буквы.",
    tipSymbol: "Добавь спецсимвол, например ! или #.",
    tipCommon: w => `«${w}» — один из самых популярных паролей, его подберут первым.`,
    tipKeyboard: "Не используй подряд идущие клавиши вроде «qwer» или «1234».",
    tipRepeat: "Не повторяй один символ много раз подряд.",
    tipYear: "Не используй год рождения или дату: их легко угадать.",
  },
  en: {
    subtitle: "Password protection is on",
    checked: "Checked", leaked: "Leaked", reused: "Reused",
    generator: "Password generator", chars: "characters",
    placeholder: "Your password will appear here",
    copy: "Copy", copied: "Copied", generate: "Generate password",
    privacy: "Passwords are never stored or sent. Only the first 5 characters of the hash go to the breach database.",
    reset: "Reset",
    checking: "Checking password…",
    offline: "Couldn't check (no internet?)",
    leak: n => `<b>This password appeared in data breaches ${n.toLocaleString("en-US")} times.</b> Attackers try these first, change it.`,
    reuse: sites => `You already use this password on: <b>${sites}</b>. If one site gets hacked, the others are at risk too.`,
    howTo: "How to make it stronger:",
    allGood: "Not found in breaches and not reused on other sites. Nice!",
    tipLength: "Make it longer, at least 12 characters.",
    tipDigits: "Add some digits.",
    tipCase: "Mix uppercase and lowercase letters.",
    tipSymbol: "Add a special character, like ! or #.",
    tipCommon: w => `“${w}” is one of the most common passwords and gets guessed first.`,
    tipKeyboard: "Avoid keyboard runs like “qwer” or “1234”.",
    tipRepeat: "Don't repeat the same character many times in a row.",
    tipYear: "Avoid birth years and dates: they're easy to guess.",
  },
};

let LANG = navigator.language.startsWith("ru") ? "ru" : "en";

function t(key, ...args) {
  const value = STRINGS[LANG][key];
  return typeof value === "function" ? value(...args) : value;
}

async function loadLang() {
  if (typeof chrome === "undefined" || !chrome.storage) return LANG;
  const { lang } = await chrome.storage.local.get("lang");
  if (lang === "ru" || lang === "en") LANG = lang;
  return LANG;
}

// Если язык переключили в окошке, страницы сразу подхватят его.
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.onChanged.addListener(changes => {
    if (changes.lang && changes.lang.newValue) LANG = changes.lang.newValue;
  });
}
