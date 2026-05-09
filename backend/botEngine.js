/**
 * botEngine.js — Playwright Automation Engine
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runBot(config, onLog) {
  const { url, username, password, jobId } = config;
  const logs = [];
  const screenshots = [];

  const log = (message, type = 'info') => {
    const entry = { time: new Date().toISOString(), message, type };
    logs.push(entry);
    if (onLog) onLog(entry);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  let browser = null;

  try {
    // ── Step 1: Launch browser ──────────────────────────────────────
    log('🚀 Launching browser...', 'step');
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    log('✅ Browser launched successfully', 'success');

    // ── Step 2: Navigate ────────────────────────────────────────────
    log(`🌐 Navigating to: ${url}`, 'step');
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      log(`✅ Page loaded: ${title}`, 'success');
    } catch (navError) {
      throw new Error(`Navigation failed: ${navError.message}`);
    }

    // ── Step 3: Login if credentials provided ──────────────────────
    if (username && password) {
      log('🔐 Attempting login...', 'step');

      const usernameSelectors = [
        'input[name="username"]', 'input[name="email"]', 'input[type="email"]',
        'input[id="username"]', 'input[id="email"]',
        'input[placeholder*="email" i]', 'input[placeholder*="username" i]',
        'input[autocomplete="username"]', 'input[autocomplete="email"]'
      ];

      const passwordSelectors = [
        'input[name="password"]', 'input[type="password"]',
        'input[id="password"]', 'input[placeholder*="password" i]'
      ];

      let userFilled = false;
      for (const sel of usernameSelectors) {
        const el = await page.$(sel);
        if (el) { await el.fill(username); log(`✅ Username entered`, 'success'); userFilled = true; break; }
      }
      if (!userFilled) log('⚠️ Username field not found', 'error');

      let passFilled = false;
      for (const sel of passwordSelectors) {
        const el = await page.$(sel);
        if (el) { await el.fill(password); log(`✅ Password entered`, 'success'); passFilled = true; break; }
      }
      if (!passFilled) log('⚠️ Password field not found', 'error');

      const submitSelectors = [
        'button[type="submit"]', 'input[type="submit"]',
        'button:has-text("Login")', 'button:has-text("Sign In")',
        'button:has-text("Log In")', 'button:has-text("Submit")'
      ];

      let submitted = false;
      for (const sel of submitSelectors) {
        try {
          const el = await page.$(sel);
          if (el) { await el.click(); log(`✅ Login submitted`, 'success'); submitted = true; break; }
        } catch {}
      }
      if (!submitted) { await page.keyboard.press('Enter'); log('✅ Pressed Enter to submit', 'info'); }

      await page.waitForTimeout(2000);
      log('⏳ Waiting for page response...', 'info');
    }

    // ── Step 4: Extract page info ───────────────────────────────────
    log('🔍 Extracting page information...', 'step');
    const title = await page.title();
    const currentUrl = page.url();
    const linkCount = await page.$$eval('a', links => links.length);
    const buttonCount = await page.$$eval('button', btns => btns.length);
    log(`📄 Page title: ${title}`, 'info');
    log(`🔗 Current URL: ${currentUrl}`, 'info');
    log(`🔗 Links found: ${linkCount} | 🔘 Buttons found: ${buttonCount}`, 'info');

    // ── Step 5: ONE final screenshot ────────────────────────────────
    const filename = `${jobId}_final.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
    screenshots.push({ label: 'Final State', file: filename });
    log('📸 Screenshot captured', 'success');

    log('🎉 Bot completed successfully!', 'success');

    return { success: true, logs, screenshots, summary: { pageTitle: title, finalUrl: currentUrl, linksFound: linkCount, buttonsFound: buttonCount } };

  } catch (error) {
    log(`💥 Error: ${error.message}`, 'error');

    // Try error screenshot
    if (browser) {
      try {
        const pages = browser.contexts()[0]?.pages();
        if (pages?.length > 0) {
          const filename = `${jobId}_error.png`;
          await pages[0].screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
          screenshots.push({ label: 'Error State', file: filename });
        }
      } catch {}
    }

    return { success: false, error: error.message, logs, screenshots };

  } finally {
    if (browser) { await browser.close(); log('🔒 Browser closed', 'info'); }
  }
}

module.exports = { runBot };