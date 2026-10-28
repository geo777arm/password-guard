// Переводы интерфейса. Язык хранится в chrome.storage.local под ключом "lang".
const STRINGS = {
  ru: {
    subtitle: "Защита паролей включена",
    checked: "Проверено", leaked: "В утечках", reused: "Повторы",
    generator: "Генератор пароля", chars: "символов",
    words: n => (n < 5 ? "слова" : "слов"),
    modeRandom: "Случайный", modeWords: "Из слов",
    hintRandom: "Такой пароль не запомнить: сохрани его в браузере, когда сайт предложит.",
    hintWords: "Легко запомнить. Для надёжности сохрани его и в браузере, когда сайт предложит.",
    placeholder: "Здесь будет пароль",
    copy: "Копировать", copied: "Готово", generate: "Создать пароль",
    privacy: "Пароли не сохраняются и не отправляются. В базу утечек уходят только первые 5 символов хэша.",
    reset: "Сбросить",
    checkTitle: "Проверить пароль",
    tabCheck: "Проверка", tabGenerate: "Генератор", tabAbout: "Защита",
    autoNote: "На сайтах пароли проверяются автоматически, когда ты их вводишь.",
    checkPlaceholder: "Впиши пароль",
    checkBtn: "Проверить",
    checkLeaked: n => `<b>Найден в утечках ${n.toLocaleString("ru-RU")} раз.</b> Не используй его.`,
    checkClean: "<b>В утечках не найден.</b>",
    checkStrong: "Пароль надёжный.",
    whyTitle: "Почему это безопасно?",
    why1: "Пароль не покидает компьютер. В базу утечек уходят только первые 5 символов его хэша, а сравнение идёт у тебя.",
    why2: "Пароли нигде не хранятся. Чтобы заметить повторы, сохраняются только «отпечатки» с секретной солью, из которых пароль не восстановить.",
    why3: "Нет рекламы, аналитики и регистрации. Расширение не читает страницы, только поля для пароля.",
    whyCode: "Открытый код на GitHub →",

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
    words: () => "words",
    modeRandom: "Random", modeWords: "Words",
    hintRandom: "Hard to remember: save it in your browser when the site offers to.",
    hintWords: "Easy to remember. To be safe, also save it in your browser when the site offers to.",
    placeholder: "Your password will appear here",
    copy: "Copy", copied: "Copied", generate: "Generate password",
    privacy: "Passwords are never stored or sent. Only the first 5 characters of the hash go to the breach database.",
    reset: "Reset",
    checkTitle: "Check a password",
    tabCheck: "Check", tabGenerate: "Generate", tabAbout: "Privacy",
    autoNote: "On websites, passwords are checked automatically as you type them.",
    checkPlaceholder: "Type a password",
    checkBtn: "Check",
    checkLeaked: n => `<b>Found in breaches ${n.toLocaleString("en-US")} times.</b> Don't use it.`,
    checkClean: "<b>Not found in breaches.</b>",
    checkStrong: "This password is strong.",
    whyTitle: "Why is this safe?",
    why1: "Your password never leaves your computer. Only the first 5 characters of its hash go to the breach database, and the match happens on your device.",
    why2: "Passwords are never stored. To spot reuse, only salted fingerprints are saved, and a password can't be recovered from them.",
    why3: "No ads, no analytics, no sign-up. The extension doesn't read pages, only password fields.",
    whyCode: "Open source on GitHub →",

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
