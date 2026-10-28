// Сайты, где можно включить двухфакторную защиту (вход по коду с телефона), и где это сделать.
const TWOFA = {
  "google.com": "https://myaccount.google.com/signinoptions/two-step-verification",
  "youtube.com": "https://myaccount.google.com/signinoptions/two-step-verification",
  "instagram.com": "https://accountscenter.instagram.com/password_and_security/two_factor/",
  "facebook.com": "https://accountscenter.facebook.com/password_and_security/two_factor/",
  "microsoft.com": "https://account.microsoft.com/security",
  "live.com": "https://account.microsoft.com/security",
  "github.com": "https://github.com/settings/security",
  "steampowered.com": "https://store.steampowered.com/twofactor/manage",
  "steamcommunity.com": "https://store.steampowered.com/twofactor/manage",
  "x.com": "https://x.com/settings/account/login_verification",
  "twitter.com": "https://x.com/settings/account/login_verification",
  "amazon.com": "https://www.amazon.com/a/settings/approval",
  "paypal.com": "https://www.paypal.com/myaccount/security",
  "discord.com": "https://support.discord.com/hc/articles/219576828",
  "tiktok.com": "https://support.tiktok.com/en/account-and-privacy/account-information/2-step-verification",
  "roblox.com": "https://www.roblox.com/my/account#!/security",
  "epicgames.com": "https://www.epicgames.com/account/password",
  "twitch.tv": "https://www.twitch.tv/settings/security",
  "reddit.com": "https://www.reddit.com/settings/privacy",
  "dropbox.com": "https://www.dropbox.com/account/security",
  "linkedin.com": "https://www.linkedin.com/mypreferences/d/two-step-verification",
  "yandex.ru": "https://id.yandex.ru/security",
  "mail.ru": "https://id.mail.ru/security",
  "vk.com": "https://id.vk.com/account/#/security",
  "gosuslugi.ru": "https://www.gosuslugi.ru/profile/security",
};

// accounts.google.com → { site: "google.com", url: "…" }
function twofaFor(host) {
  host = host.toLowerCase();
  const site = Object.keys(TWOFA).find(d => host === d || host.endsWith("." + d));
  return site ? { site, url: TWOFA[site] } : null;
}
