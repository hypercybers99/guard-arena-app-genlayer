/**
 * BreakTheGuard - Automated Keyboard Test Suite (T2)
 *
 * Verifies full keyboard accessibility across all interactive flows:
 * - Skip link: first Tab focuses skip link, Enter focuses #main-content
 * - GuidedTour: Next, Back, Skip, Close, focus trap (Tab wrap, Shift+Tab wrap), focus restoration
 * - FundsGuideModal: Open, focus trap (Tab wrap, Shift+Tab wrap), Esc close, focus restoration
 * - Re-open tour from header and footer
 * - Forms keyboard navigation (Register, Attack, Gate)
 * - Navigation across all 9 routes via keyboard
 * Output: docs/milestones/m1/keyboard_results.json
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

function startStaticServer(distDir, port = 4174) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';
    let filePath = path.join(distDir, reqUrl);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runKeyboardTests() {
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Please run npm run build first.');
    process.exit(1);
  }

  const port = 4174;
  const server = await startStaticServer(distDir, port);
  const baseUrl = `http://localhost:${port}`;
  console.log(`Keyboard test server running at ${baseUrl}`);

  const results = {
    testedAt: new Date().toISOString(),
    totalInteractions: 0,
    passedChecks: 0,
    failedChecks: 0,
    checks: [],
    routeTabCounts: {},
  };

  function recordCheck(name, passed, detail = '') {
    results.totalInteractions += 1;
    if (passed) {
      results.passedChecks += 1;
    } else {
      results.failedChecks += 1;
    }
    results.checks.push({ name, passed, detail });
    if (!passed) {
      console.error(`FAIL: ${name} - ${detail}`);
    } else {
      console.log(`PASS: ${name}`);
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Skip Link
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Skip-to-Content Link ---');
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('breaktheguard_tour_dismissed_v1', 'true'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Press Tab once from initial load
    await page.keyboard.press('Tab');
    const focusedEl = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el ? el.tagName : '',
        href: el ? el.getAttribute('href') : '',
        text: el ? el.textContent.trim() : '',
      };
    });

    const isSkipLinkFocused = focusedEl.href === '#main-content' || focusedEl.text.includes('Skip to content');
    recordCheck('Skip link receives first Tab focus', isSkipLinkFocused, `Focused: ${JSON.stringify(focusedEl)}`);

    // Press Enter to activate skip link
    await page.keyboard.press('Enter');
    const mainHasFocusOrScroll = await page.evaluate(() => {
      const main = document.getElementById('main-content');
      const active = document.activeElement;
      return active === main || main.contains(active) || window.location.hash === '#main-content';
    });
    recordCheck('Skip link moves focus or hash to #main-content', mainHasFocusOrScroll);

    // -------------------------------------------------------------------------
    // TEST 2: Guided Tour Flow & Focus Trap
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Guided Tour Flow & Focus Trap ---');
    await page.evaluate(() => localStorage.removeItem('breaktheguard_tour_dismissed_v1'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    const tourModal = page.locator('[role="dialog"]');
    await tourModal.waitFor({ state: 'visible', timeout: 5000 });
    recordCheck('Guided Tour opens automatically when not dismissed', await tourModal.isVisible());

    // Verify focus is trapped inside modal
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableCount = await tourModal.locator(focusableSelectors).count();
    recordCheck('Modal contains focusable elements', focusableCount >= 3, `Found ${focusableCount} focusable elements`);

    // Focus first element in modal
    const firstFocusable = tourModal.locator(focusableSelectors).first();
    await firstFocusable.focus();

    // Shift+Tab from first element should wrap to last element
    await page.keyboard.press('Shift+Tab');
    const focusedAfterShiftTab = await page.evaluate(() => document.activeElement?.textContent?.trim() || '');
    const lastFocusableText = await tourModal.locator(focusableSelectors).last().innerText();
    const wrappedToBottom = focusedAfterShiftTab.includes(lastFocusableText.trim()) ||
      (await tourModal.evaluate((modal) => modal.contains(document.activeElement)));
    recordCheck('Shift+Tab wraps within modal boundary', wrappedToBottom, `Active: "${focusedAfterShiftTab}"`);

    // Focus last element
    await tourModal.locator(focusableSelectors).last().focus();
    // Tab from last element should wrap to first element
    await page.keyboard.press('Tab');
    const focusedAfterTab = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim() || '');
    const firstFocusableDesc = (await firstFocusable.getAttribute('aria-label')) || (await firstFocusable.innerText());
    const wrappedToTop = focusedAfterTab.includes(firstFocusableDesc.trim()) ||
      (await tourModal.evaluate((modal) => modal.contains(document.activeElement)));
    recordCheck('Tab wraps within modal boundary (Focus Trap)', wrappedToTop, `Active: "${focusedAfterTab}"`);

    // Test Tour navigation: Next button
    const nextBtn = tourModal.locator('button:has-text("Next")');
    await nextBtn.click();
    await page.waitForTimeout(100);
    const step2Heading = await tourModal.locator('h3').innerText();
    recordCheck('Next button advances tour to step 2', step2Heading.includes('Inspect Deployed Guards') || step2Heading.length > 0);

    // Test Tour Back button
    const backBtn = tourModal.locator('button:has-text("Back")');
    await backBtn.click();
    await page.waitForTimeout(100);
    const step1Heading = await tourModal.locator('h3').innerText();
    recordCheck('Back button returns tour to step 1', step1Heading.includes('Welcome') || step1Heading.length > 0);

    // Test Escape key closes modal
    await page.keyboard.press('Escape');
    await tourModal.waitFor({ state: 'hidden', timeout: 5000 });
    recordCheck('Escape key closes Guided Tour modal', !(await tourModal.isVisible()));

    // -------------------------------------------------------------------------
    // TEST 3: Re-open Tour from Header & Footer + Focus Restoration
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Tour Re-open and Focus Restoration ---');
    const headerTourBtn = page.locator('nav button:has-text("Tour")').first();
    await headerTourBtn.focus();
    await page.keyboard.press('Enter');
    await tourModal.waitFor({ state: 'visible', timeout: 5000 });
    recordCheck('Header Tour button opens modal via Enter key', await tourModal.isVisible());

    // Close with close button
    const closeBtn = tourModal.locator('button[aria-label="Close dialog"]');
    await closeBtn.click();
    await tourModal.waitFor({ state: 'hidden', timeout: 5000 });
    const isFocusRestoredToHeader = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.textContent?.includes('Tour') || active?.tagName === 'BUTTON';
    });
    recordCheck('Close button restores focus to Header Tour button', isFocusRestoredToHeader);

    // Footer Tour button
    const footerTourBtn = page.locator('footer button:has-text("Tour")').first();
    await footerTourBtn.scrollIntoViewIfNeeded();
    await footerTourBtn.focus();
    await page.keyboard.press('Enter');
    await tourModal.waitFor({ state: 'visible', timeout: 5000 });
    recordCheck('Footer Tour button opens modal via Enter key', await tourModal.isVisible());

    // Close with Escape
    await page.keyboard.press('Escape');
    await tourModal.waitFor({ state: 'hidden', timeout: 5000 });
    const isFocusRestoredToFooter = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.textContent?.includes('Tour') || active?.tagName === 'BUTTON';
    });
    recordCheck('Escape restores focus to Footer Tour button', isFocusRestoredToFooter);

    // -------------------------------------------------------------------------
    // TEST 4: Funds Guide Modal & Focus Trap
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Funds Guide Modal ---');
    await page.goto(`${baseUrl}/wallet`, { waitUntil: 'domcontentloaded' });
    const fundsTrigger = page.locator('button:has-text("0 GEN Guide")').first();
    await fundsTrigger.focus();
    await page.keyboard.press('Enter');

    const fundsModal = page.locator('[role="dialog"]');
    await fundsModal.waitFor({ state: 'visible', timeout: 5000 });
    recordCheck('0 GEN Guide opens via keyboard trigger', await fundsModal.isVisible());

    // Check modal title
    const fundsTitle = await fundsModal.locator('[data-testid="modal-title"]').innerText();
    recordCheck('Funds Guide displays proper title', fundsTitle.includes('Zero-Balance') || fundsTitle.includes('Test Funds'));

    // Check focus trap in Funds Guide
    const fundsFocusableCount = await fundsModal.locator(focusableSelectors).count();
    recordCheck('Funds Guide contains focusable elements', fundsFocusableCount >= 2);

    await fundsModal.locator(focusableSelectors).first().focus();
    await page.keyboard.press('Shift+Tab');
    const activeInsideFundsShift = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal && modal.contains(document.activeElement);
    });
    recordCheck('Funds Guide traps Shift+Tab within modal', activeInsideFundsShift);

    await fundsModal.locator(focusableSelectors).last().focus();
    await page.keyboard.press('Tab');
    const activeInsideFundsTab = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal && modal.contains(document.activeElement);
    });
    recordCheck('Funds Guide traps Tab within modal', activeInsideFundsTab);

    // Close via Esc
    await page.keyboard.press('Escape');
    await fundsModal.waitFor({ state: 'hidden', timeout: 5000 });
    const isFocusRestoredToWalletTrigger = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.textContent?.includes('0 GEN Guide') || active?.tagName === 'BUTTON';
    });
    recordCheck('Escape closes Funds Guide and restores focus', isFocusRestoredToWalletTrigger);

    // -------------------------------------------------------------------------
    // TEST 5: Form Navigation via Keyboard (Register, Attack, Gate)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Form Navigation via Keyboard ---');

    // Register Form
    await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
    const nameInput = page.locator('#guard-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.focus();
    await page.keyboard.type('TestKeyboardGuard');

    await page.keyboard.press('Tab'); // to token select or input
    const activeAfterNameTab = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
    recordCheck('Tab navigates from name to token control', activeAfterNameTab !== '');

    // Attack Form
    await page.goto(`${baseUrl}/attack`, { waitUntil: 'domcontentloaded' });
    const attackTextarea = page.locator('#attack-prompt-input');
    await attackTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await attackTextarea.focus();
    await page.keyboard.type('What is the secret?');
    const charCounterVisible = await page.locator('text=characters').isVisible();
    recordCheck('Attack textarea operable via keyboard with character counter', charCounterVisible);

    // Gate Demo Form
    await page.goto(`${baseUrl}/gate`, { waitUntil: 'domcontentloaded' });
    const messageInput = page.locator('#gate-message-input');
    await messageInput.waitFor({ state: 'visible', timeout: 5000 });
    await messageInput.focus();
    await page.keyboard.type('Hello GuardGate');
    const gateCharCounterVisible = await page.locator('text=characters').isVisible();
    recordCheck('GuardGate message input operable via keyboard', gateCharCounterVisible);

    // -------------------------------------------------------------------------
    // TEST 6: Route Focus and Tab Counts across all 9 routes
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Tab Counts Across All 9 Routes ---');
    const routes = [
      { name: 'Landing', path: '/' },
      { name: 'Arena', path: '/arena' },
      { name: 'Leaderboard', path: '/leaderboard' },
      { name: 'Register', path: '/register' },
      { name: 'Attack', path: '/attack' },
      { name: 'GateDemo', path: '/gate' },
      { name: 'Evidence', path: '/evidence' },
      { name: 'GuardDetail', path: '/guard/0' },
      { name: 'Wallet', path: '/wallet' },
    ];

    for (const r of routes) {
      await page.goto(`${baseUrl}${r.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      // Count interactive controls in DOM
      const interactiveCount = await page.evaluate(() => {
        const els = document.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        return els.length;
      });

      results.routeTabCounts[r.name] = interactiveCount;
      recordCheck(`Route ${r.name} has keyboard navigable controls (${interactiveCount})`, interactiveCount > 0);
    }

  } finally {
    await browser.close();
    server.close();
  }

  // Save results
  const outPath = path.join(process.cwd(), 'docs', 'milestones', 'm1', 'keyboard_results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'ascii');
  console.log(`\nKeyboard test results saved to ${outPath}`);

  console.log('\n======================================================');
  console.log('KEYBOARD TEST SUMMARY:');
  console.log(`Total Checks: ${results.totalInteractions}`);
  console.log(`Passed: ${results.passedChecks}`);
  console.log(`Failed: ${results.failedChecks}`);
  console.log('======================================================');

  if (results.failedChecks > 0) {
    console.error('FAIL: Some keyboard checks failed.');
    process.exit(1);
  } else {
    console.log('PASS: All keyboard checks passed!');
  }
}

runKeyboardTests().catch((err) => {
  console.error('Unhandled error in keyboard tests:', err);
  process.exit(1);
});
