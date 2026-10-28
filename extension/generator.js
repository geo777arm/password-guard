// Генератор надёжного пароля.
// Кнопка «Создать пароль» в окошке расширения вызывает эту функцию.

function generatePassword(length) {
  const lower = "abcdefghijkmnopqrstuvwxyz";   // без l, чтобы не путать с 1
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";    // без I и O, чтобы не путать с 1 и 0
  const digits = "23456789";
  const symbols = "!@#$%^&*-_=+?";
  const all = lower + upper + digits + symbols;

  // Случайное число от 0 до max-1. crypto.getRandomValues надёжнее Math.random:
  // его нельзя предсказать, поэтому им пользуются для паролей и ключей.
  function randomIndex(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  function randomChar(from) {
    return from[randomIndex(from.length)];
  }

  // Гарантируем хотя бы один символ каждого типа...
  const chars = [randomChar(lower), randomChar(upper), randomChar(digits), randomChar(symbols)];
  // ...а остальное добираем из всех символов сразу.
  while (chars.length < length) {
    chars.push(randomChar(all));
  }

  // Перемешиваем, чтобы обязательные символы не стояли всегда в начале.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
