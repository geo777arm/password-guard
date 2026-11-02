// Работает в мире страницы (world: MAIN): замечает, когда сайт сам кладёт текст в буфер обмена.
// Так устроена атака ClickFix: «Вы не робот? Нажмите Win+R и вставьте» — а в буфере вредная команда.
// Здесь только наблюдаем и сообщаем content.js через событие, ничего не блокируем и не отправляем.
(() => {
  const report = text => {
    if (typeof text === "string" && text.trim()) {
      window.dispatchEvent(new CustomEvent("pg-clipboard", { detail: text.slice(0, 2000) }));
    }
  };

  const clip = navigator.clipboard;
  if (clip && clip.writeText) {
    const writeText = clip.writeText.bind(clip);
    clip.writeText = text => { report(text); return writeText(text); };
  }

  const setData = DataTransfer.prototype.setData;
  DataTransfer.prototype.setData = function (type, value) {
    if (/text/i.test(type)) report(value);
    return setData.call(this, type, value);
  };

  const execCommand = Document.prototype.execCommand;
  Document.prototype.execCommand = function (command, ...rest) {
    if (String(command).toLowerCase() === "copy") {
      const el = document.activeElement;
      report(el && "value" in el && el.value ? el.value : String(document.getSelection()));
    }
    return execCommand.call(this, command, ...rest);
  };
})();
