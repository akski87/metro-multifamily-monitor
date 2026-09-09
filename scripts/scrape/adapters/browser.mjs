/**
 * Shared Playwright Chromium for DOM extractors (Rose, Modern Spaces, custom).
 * SightMap stays HTTP-only and does not need this.
 */
let _pw = null;
let _browser = null;

export async function withPage(fn, { settleMs = 8000 } = {}) {
  const { chromium } = await loadPlaywright();
  if (!_browser) {
    _browser = await chromium.launch({ headless: true });
  }
  const page = await _browser.newPage({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  });
  try {
    return await fn(page, { settleMs });
  } finally {
    await page.close().catch(() => {});
  }
}

export async function gotoSettle(page, url, settleMs = 8000) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch {
    await page.goto(url, { waitUntil: "commit", timeout: 45000 });
  }
  await page.waitForTimeout(settleMs);
}

export async function evaluateJson(page, expression) {
  const raw = await page.evaluate(expression);
  if (typeof raw === "string") return JSON.parse(raw);
  return raw;
}

async function loadPlaywright() {
  if (_pw) return _pw;
  try {
    _pw = await import("playwright");
    return _pw;
  } catch (err) {
    throw new Error(
      `Playwright is required for DOM/Rose/Modern Spaces scrapes. Run: npx playwright install chromium\n${err.message}`,
    );
  }
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}
