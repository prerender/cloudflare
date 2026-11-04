// User agents handled by Prerender. Matched as lowercase substrings of the
// User-Agent, so keep every entry lowercase.
const BOT_AGENTS = [
  // Search Engines
  "googlebot", "adsbot-google", "apis-google", "mediapartners-google",
  "google-safety", "feedfetcher-google", "googleproducer", "google-site-verification",
  "bingbot", "yandexbot", "yahoo", "baiduspider", "naver",
  "seznambot", "qwantbot", "ecosia", "duckduckbot",
  "duckassistbot", "applebot",
  // Social Media
  "facebookexternalhit", "facebookcatalog", "facebookbot", "meta-externalagent",
  "twitterbot", "linkedinbot", "whatsapp", "slackbot", "pinterest", "pinterestbot",
  "tiktok", "tiktokspider", "bytespider", "discordbot",
  // SEO Tools
  "semrushbot", "ahrefsbot", "chrome-lighthouse", "screaming-frog",
  "oncrawlbot", "botifybot", "deepcrawl", "lumar", "rogerbot", "dotbot",
  // AI Bots
  "gptbot", "chatgpt", "oai-searchbot", "chatgpt-user", "claudebot",
  "perplexitybot", "perplexity-user", "youbot",
  "amazonbot", "anthropic-ai", "claude-web", "claude-user", "ccbot", "mistralai-user",
  // Other Known Bots & Crawlers
  "embedly", "quora link preview", "showyoubot", "outbrain", "pinterest/0.",
  "developers.google.com/+/web/snippet", "vkshare", "w3c_validator", "redditbot",
  "flipboard", "tumblr", "bitlybot", "skypeuripreview", "nuzzel",
  "google page speed", "qwantify", "bitrix link preview", "xing-contenttabreceiver",
  "google-inspectiontool", "telegrambot",
  // Testing
  "integration-test",
  "iframely",
];

const IGNORE_EXTENSIONS = [
  ".js", ".css", ".xml", ".less", ".png", ".jpg", ".jpeg", ".gif", ".pdf",
  ".doc", ".txt", ".ico", ".rss", ".zip", ".mp3", ".rar", ".exe", ".wmv",
  ".avi", ".ppt", ".mpg", ".mpeg", ".tif", ".wav", ".mov", ".psd",
  ".ai", ".xls", ".mp4", ".m4a", ".swf", ".dat", ".dmg", ".iso", ".flv",
  ".m4v", ".torrent", ".woff", ".woff2", ".ttf", ".otf", ".eot", ".svg",
  ".webp", ".avif", ".webmanifest",
];

export default {
  async fetch(request, env, ctx) {
    // Safety net for anything thrown outside the try below - Cloudflare serves the
    // origin response instead of its own error page.
    ctx.passThroughOnException();

    if (!shouldPrerender(request)) {
      return fetch(request);
    }

    // Fail open: a Prerender failure must never take the site down for crawlers.
    // Only the Prerender call is guarded, so a failed origin request is never sent twice.
    try {
      const prerendered = await fetch(prerenderRequest(request, env));
      if (prerendered.status >= 500) {
        return fetch(request);
      }
      return prerendered;
    } catch (err) {
      console.error(err);
      return fetch(request);
    }
  },
};

function shouldPrerender(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent")?.toLowerCase() || "";
  const isPrerender = request.headers.get("X-Prerender");
  const pathName = url.pathname.toLowerCase();
  const lastDot = pathName.lastIndexOf(".");
  const extension = lastDot > -1 ? pathName.substring(lastDot) : "";

  return (
    !isPrerender &&
    BOT_AGENTS.some((bot) => userAgent.includes(bot)) &&
    !(extension.length && IGNORE_EXTENSIONS.includes(extension))
  );
}

function prerenderRequest(request, env) {
  const newURL = `https://service.prerender.io/${request.url}`;

  // Forward only an allowlist. Copying every inbound header lets a caller inject
  // Prerender's own control headers - e.g. X-Prerender-Url makes the service
  // render an attacker-chosen URL on your token (open proxy / SSRF). Never
  // forward client X-Prerender-* headers; the worker sets the trusted ones below.
  const newHeaders = new Headers();
  for (const name of ["user-agent", "accept", "accept-language"]) {
    const value = request.headers.get(name);
    if (value) newHeaders.set(name, value);
  }

  newHeaders.set("X-Prerender-Token", env.PRERENDER_TOKEN);
  newHeaders.set("X-Prerender-Int-Type", "CloudFlare");

  return new Request(newURL, {
    headers: newHeaders,
    redirect: "manual",
  });
}
