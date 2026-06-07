import { describe, it, expect } from "vitest";
import { isAICrawler, isSearchOrSocialBot, isCrawler } from "./constants";

describe("isSearchOrSocialBot", () => {
  it("detects classic search-engine crawlers", () => {
    expect(isSearchOrSocialBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isSearchOrSocialBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
    expect(isSearchOrSocialBot("DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)")).toBe(true);
    expect(isSearchOrSocialBot("Mozilla/5.0 (compatible; YandexBot/3.0)")).toBe(true);
  });

  it("detects social / messaging unfurlers", () => {
    expect(isSearchOrSocialBot("facebookexternalhit/1.1")).toBe(true);
    expect(isSearchOrSocialBot("Twitterbot/1.0")).toBe(true);
    expect(isSearchOrSocialBot("LinkedInBot/1.0")).toBe(true);
    expect(isSearchOrSocialBot("WhatsApp/2.21")).toBe(true);
  });

  it("does NOT flag real browsers", () => {
    // A German Chrome on Android — the reported visitor profile.
    expect(isSearchOrSocialBot(
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    )).toBe(false);
    // Desktop Safari.
    expect(isSearchOrSocialBot(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    )).toBe(false);
  });

  it("handles empty / missing UA", () => {
    expect(isSearchOrSocialBot(undefined)).toBe(false);
    expect(isSearchOrSocialBot(null)).toBe(false);
    expect(isSearchOrSocialBot("")).toBe(false);
  });
});

describe("isCrawler (AI + search/social union)", () => {
  it("is true for AI crawlers", () => {
    expect(isAICrawler("Mozilla/5.0 (compatible; GPTBot/1.0)")).toBe(true);
    expect(isCrawler("Mozilla/5.0 (compatible; GPTBot/1.0)")).toBe(true);
    expect(isCrawler("Mozilla/5.0 (compatible; ClaudeBot/1.0)")).toBe(true);
  });

  it("is true for search/social bots", () => {
    expect(isCrawler("Googlebot/2.1")).toBe(true);
  });

  it("is false for a real German mobile browser (gets language negotiation)", () => {
    expect(isCrawler(
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    )).toBe(false);
  });
});
