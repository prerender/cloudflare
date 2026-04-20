// User agents handled by Prerender
const BOT_AGENTS = [
  // Search Engines
  "googlebot", "adsbot-google", "apis-google", "mediapartners-google",
  "google-safety", "feedfetcher-google", "googleproducer", "google-site-verification",
  "bingbot", "yandexbot", "yabrowser", "yahoo", "baiduspider", "naver",
  "seznambot", "sznprohlizec", "qwantbot", "ecosia", "duckduckbot",
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
  "google-extended", "perplexitybot", "perplexity-user", "youbot",
  "amazonbot", "anthropic-ai", "claude-web", "claude-user", "ccbot", "mistralai-user",
  // Other Known Bots & Crawlers
  "embedly", "quora link preview", "showyoubot", "outbrain", "pinterest/0.",
  "developers.google.com/+/web/snippet", "vkshare", "w3c_validator", "redditbot",
  "flipboard", "tumblr", "bitlybot", "skypeuripreview", "nuzzel",
  "google page speed", "qwantify", "bitrix link preview", "xing-contenttabreceiver",
  "google-inspectiontool", "telegrambot",
  // Testing
  "integration-test",
];

const IGNORE_EXTENSIONS = [
  ".js", ".css", ".xml", ".less", ".png", ".jpg", ".jpeg", ".gif", ".pdf",
  ".doc", ".txt", ".ico", ".rss", ".zip", ".mp3", ".rar", ".exe", ".wmv",
  ".doc", ".avi", ".ppt", ".mpg", ".mpeg", ".tif", ".wav", ".mov", ".psd",
  ".ai", ".xls", ".mp4", ".m4a", ".swf", ".dat", ".dmg", ".iso", ".flv",
  ".m4v", ".torrent", ".woff", ".ttf", ".svg", ".webmanifest",
];

export default {
  async fetch(request, env) {
    return await handleRequest(request, env).catch(
      (err) => new Response(err.stack, { status: 500 })
    );
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent")?.toLowerCase() || "";
  const isPrerender = request.headers.get("X-Prerender");
  const pathName = url.pathname.toLowerCase();
  const lastDot = pathName.lastIndexOf(".");
  const extension = lastDot > -1 ? pathName.substring(lastDot).toLowerCase() : "";

  if (
    isPrerender ||
    !BOT_AGENTS.some((bot) => userAgent.includes(bot.toLowerCase())) ||
    (extension.length && IGNORE_EXTENSIONS.includes(extension))
  ) {
    return fetch(request);
  }

  const newURL = `https://service.prerender.io/${request.url}`;
  const newHeaders = new Headers(request.headers);

  newHeaders.set("X-Prerender-Token", env.PRERENDER_TOKEN);
  newHeaders.set("X-Prerender-Int-Type", "CloudFlare");

  return fetch(new Request(newURL, {
    headers: newHeaders,
    redirect: "manual",
  }));
}
