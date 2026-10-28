# Password Guard — Privacy Policy / Политика конфиденциальности

_Last updated: October 28, 2026_

## English

Password Guard does not collect, sell or share any personal data.

**What happens when you type a password**
- The extension computes a SHA-1 hash of the password on your device.
- Only the first 5 characters of that hash are sent to the Have I Been Pwned "Pwned Passwords" API (`api.pwnedpasswords.com`). The service returns hundreds of matching hash suffixes, and the comparison happens locally. The password itself and its full hash never leave your device. This method is called k-anonymity.

**What is stored on your device** (in the browser's local extension storage, never uploaded)
- A random salt and a salted SHA-256 fingerprint of the password for each site, used only to warn you when the same password is used on several sites. Passwords themselves are never stored.
- Counters shown in the popup (passwords checked, found in leaks, reused).

You can erase all of this at any time with the "Сбросить" (Reset) button in the popup, or by removing the extension.

**No analytics, no ads, no accounts.** The only network request the extension makes is the hash-prefix lookup described above.

Contact: open an issue at https://github.com/geo777arm/password-guard/issues

## Русский

Password Guard не собирает, не продаёт и никому не передаёт персональные данные.

- Пароль хэшируется (SHA-1) прямо на устройстве. В сервис Have I Been Pwned уходят только первые 5 символов хэша, сравнение идёт локально. Сам пароль и полный хэш никогда не покидают устройство.
- На устройстве хранятся только «отпечатки» паролей с секретной солью (чтобы заметить один пароль на разных сайтах) и счётчики для окошка расширения. Сами пароли не хранятся.
- Всё можно стереть кнопкой «Сбросить» в окошке расширения или удалив расширение.
- Нет аналитики, рекламы и аккаунтов.

Связаться: https://github.com/geo777arm/password-guard/issues
