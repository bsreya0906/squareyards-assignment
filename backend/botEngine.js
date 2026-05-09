const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const USERNAME_SELECTORS = [
  'input[name="username"]',
  'input[name="email"]',
  'input[type="email"]',
  'input[id="username"]',
  'input[id="email"]',
  'input[placeholder*="email" i]',
  'input[placeholder*="username" i]',
  'input[autocomplete="username"]',
  'input[autocomplete="email"]',
];

const PASSWORD_SELECTORS = [
  'input[name="password"]',
  'input[type="password"]',
  'input[id="password"]',
  'input[placeholder*="password" i]',
];

const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Login")',
  'button:has-text("Sign In")',
  'button:has-text("Log In")',
  'button:has-text("Submit")',
]

async function fillFirstMatch(page, selectors, value) {
  for (const selector of selectors) {
    const el = await page.$(selector);
    if (el) {
      await el.fill(value);
      return true;
    }
  }
  return false;
}

async function clickFirstMatch(page, selectors) {
  for (const selector of selectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.click();
        return true;
      }
    } catch {
      
    }
  }
  return false;
}

async function runBot(config, onLog) {
  const { url, username, password, jobId } = config;

  const logs = [];
  const screenshots = [];

  function log(message, type = "info") {
    const entry = { time: new Date().toISOString(), message, type };
    logs.push(entry);
    if (onLog) onLog(entry);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  let browser = null;

  try {
    log("🚀 Launching browser...", "step");

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    log("✅ Browser launched", "success")
    log(`🌐 Going to: ${url}`, "step");

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      const title = await page.title();
      log(`✅ Page loaded — "${title}"`, "success");
    } catch (navError) {
      throw new Error(`Navigation failed: ${navError.message}`);
    }
    if (username && password) {
      log("🔐 Credentials found — attempting login...", "step");

      // Fill username
      const userFilled = await fillFirstMatch(page, USERNAME_SELECTORS, username);
      if (userFilled) {
        log("✅ Username entered", "success");
      } else {
        log("⚠️ Couldn't find a username field", "error");
      }

      // Fill password
      const passFilled = await fillFirstMatch(page, PASSWORD_SELECTORS, password);
      if (passFilled) {
        log("✅ Password entered", "success");
      } else {
        log("⚠️ Couldn't find a password field", "error");
      }

      // Click submit button 
      const submitted = await clickFirstMatch(page, SUBMIT_SELECTORS);
      if (submitted) {
        log("✅ Submit button clicked", "success");
      } else {
        await page.keyboard.press("Enter");
        log("✅ Pressed Enter to submit (no button found)", "info");
      }

      log("⏳ Waiting for page to respond...", "info");
      await page.waitForTimeout(2000);
    }

    log("🔍 Extracting page info...", "step");

    const pageTitle = await page.title();
    const currentUrl = page.url();
    const linkCount = await page.$$eval("a", (links) => links.length);
    const buttonCount = await page.$$eval("button", (btns) => btns.length);

    log(`📄 Title: ${pageTitle}`, "info");
    log(`🔗 URL: ${currentUrl}`, "info");
    log(`🔗 Links: ${linkCount}  |  🔘 Buttons: ${buttonCount}`, "info");

    const filename = `${jobId}_final.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    await page.screenshot({ path: filepath, fullPage: true });
    screenshots.push({ label: "Final State", file: filename });

    log("📸 Screenshot saved", "success");
    log("🎉 Bot finished successfully!", "success");

    return {
      success: true,
      logs,
      screenshots,
      summary: {
        pageTitle,
        finalUrl: currentUrl,
        linksFound: linkCount,
        buttonsFound: buttonCount,
      },
    };

  } catch (error) {
    log(`💥 Error: ${error.message}`, "error");

    if (browser) {
      try {
        const pages = browser.contexts()[0]?.pages();
        if (pages?.length > 0) {
          const filename = `${jobId}_error.png`;
          await pages[0].screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
          screenshots.push({ label: "Error State", file: filename });
          log("📸 Error screenshot saved", "info");
        }
      } catch {
      }
    }

    return {
      success: false,
      error: error.message,
      logs,
      screenshots,
    };

  } finally {
    if (browser) {
      await browser.close();
      log("🔒 Browser closed", "info");
    }
  }
}

module.exports = { runBot };