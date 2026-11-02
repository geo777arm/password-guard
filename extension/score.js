// Балл защиты от 0 до 100: пароли (40), двухфакторка (30), цифровой след (30).
// Возвращает балл и следующий шаг, который добавит больше всего баллов.
function securityScore({ stats, twofaSites, twofaDone, traceIds, traceDone }) {
  const parts = [];

  // Пароли: чем меньше утечек и повторов среди проверенных, тем лучше.
  if (stats.checked === 0) {
    parts.push({ points: 20, max: 40, next: { key: "nextCheck", args: [] } });
  } else {
    const bad = Math.min(1, (stats.leaked + stats.reused) / stats.checked);
    parts.push({ points: 40 * (1 - bad), max: 40, next: { key: "nextPasswords", args: [] } });
  }

  // Двухфакторка на сайтах, где человек вводит пароли.
  if (twofaSites.length === 0) {
    parts.push({ points: 15, max: 30, next: null });
  } else {
    const left = twofaSites.filter(s => !twofaDone.includes(s));
    const gain = Math.round(30 / twofaSites.length);
    parts.push({
      points: 30 * (twofaSites.length - left.length) / twofaSites.length, max: 30,
      next: left.length ? { key: "nextTwofa", args: [left[0]], gain, tab: "twofa" } : null,
    });
  }

  // Шаги вкладки «След».
  const traceLeft = traceIds.filter(id => !traceDone.includes(id));
  parts.push({
    points: 30 * (traceIds.length - traceLeft.length) / traceIds.length, max: 30,
    next: traceLeft.length ? { key: "nextTrace", args: [traceLeft[0]], gain: Math.round(30 / traceIds.length), tab: "trace" } : null,
  });

  const score = Math.round(parts.reduce((sum, p) => sum + p.points, 0));
  // следующий шаг — там, где потеряно больше всего баллов
  // (если ещё ни одного пароля не проверено, начинаем с проверки)
  const best = stats.checked === 0 ? parts[0]
    : parts.filter(p => p.next).sort((a, b) => (b.max - b.points) - (a.max - a.points))[0];
  return { score, next: best ? best.next : null };
}
