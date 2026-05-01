/**
 * Browser-based extractor using puppeteer-core + @sparticuz/chromium-min
 * Used as fallback when the simple fetch-based extractor fails (e.g., Cloudflare protection)
 * Compatible with Vercel serverless (uses chromium-min which downloads Chromium on demand)
 */

// Dynamic imports to avoid bundling issues in Next.js
async function getBrowser() {
  const chromium = (await import('@sparticuz/chromium-min')).default;
  const puppeteer = (await import('puppeteer-core')).default;

  // In production (Vercel), use the remote Chromium binary
  // In development, use local Chrome if available
  let executablePath: string;

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    // Download Chromium from the sparticuz CDN
    executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar'
    );
  } else {
    // Local development: try common Chrome paths
    const localPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ];
    const fs = await import('fs');
    executablePath = localPaths.find((p) => {
      try { return fs.existsSync(p); } catch { return false; }
    }) || await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar'
    );
  }

  const browser = await puppeteer.launch({
    args: [
      ...((await import('@sparticuz/chromium-min')).default.args),
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: true,
  });

  return browser;
}

export async function fetchPageWithBrowser(url: string): Promise<{ html: string; finalUrl: string }> {
  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    // Set realistic browser headers
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    });

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 25000,
    });

    // Wait a bit for any JS-rendered content
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const html = await page.content();
    const finalUrl = page.url();

    return { html, finalUrl };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
