// Проверка силы пароля.
// Возвращает массив советов на текущем языке (t из i18n.js). Пустой массив значит «пароль сильный».

const COMMON_PASSWORDS = [
  "123456", "password", "qwerty", "111111", "iloveyou", "admin", "welcome",
  "monkey", "dragon", "football", "letmein", "abc123", "пароль", "привет",
];

const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890", "йцукенгшщзхъ", "фывапролджэ", "ячсмитьбю"];

function checkStrength(password) {
  const tips = [];
  const lower = password.toLowerCase();

  if (password.length < 12) {
    tips.push(t("tipLength"));
  }
  if (!/\d/.test(password)) {
    tips.push(t("tipDigits"));
  }
  if (!/[A-ZА-ЯЁ]/.test(password) || !/[a-zа-яё]/.test(password)) {
    tips.push(t("tipCase"));
  }
  if (!/[^A-Za-zА-Яа-яЁё0-9]/.test(password)) {
    tips.push(t("tipSymbol"));
  }

  // Популярные пароли хакеры пробуют первыми.
  for (const common of COMMON_PASSWORDS) {
    if (lower.includes(common)) {
      tips.push(t("tipCommon", common));
      break;
    }
  }

  // Клавиатурные дорожки: 4 подряд идущие клавиши, например «asdf» или «1234».
  outer: for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i + 4 <= row.length; i++) {
      if (lower.includes(row.slice(i, i + 4))) {
        tips.push(t("tipKeyboard"));
        break outer;
      }
    }
  }

  // Один символ 4 раза подряд: «aaaa», «1111».
  if (/(.)\1{3,}/.test(password)) {
    tips.push(t("tipRepeat"));
  }

  // Похоже на год или дату рождения: 1950–2029.
  if (/(19[5-9]\d|20[0-2]\d)/.test(password)) {
    tips.push(t("tipYear"));
  }

  return tips;
}
