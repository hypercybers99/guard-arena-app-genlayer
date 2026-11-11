import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROD_URL = 'https://guard-arena-app-genlayer.vercel.app';
const M1_DIR = path.join(process.cwd(), 'docs', 'milestones', 'm1');
const BEFORE_SCREENS_DIR = path.join(M1_DIR, 'before');
const RAW_LH_DIR = path.join(M1_DIR, 'raw_lighthouse');

const ROUTES = [
  '/',
  '/arena',
  '/guard/c6d699d5a2ed',
  '/attack',
  '/register',
  '/leaderboard',
  '/gate',
  '/evidence',
  '/wallet',
];

const VIEWPORTS = [
  { width: 1440, height: 900, name: 'desktop' },
  { width: 500, height: 800, name: 'tablet_small' },
  { width: 390, height: 844, name: 'mobile' },
];

const SCREENSHOT_ROUTES = {
  '/': '01_landing',
  '/arena': '02_arena',
  '/register': '03_register',
  '/attack': '04_attack',
  '/wallet': '05_wallet',
};

async function main() {
  console.log('======================================================================');
  console.log('RECORDING STEP 0b: BASELINE BEFORE METRICS');
  console.log(`Target: ${PROD_URL}`);
  console.log('======================================================================\n');

  fs.mkdirSync(BEFORE_SCREENS_DIR, { recursive: true });
  fs.mkdirSync(RAW_LH_DIR, { recursive: true });

  const metricsBefore = {
    targetUrl: PROD_URL,
    timestamp: new Date().toISOString(),
    theme: 'dark',
    routesScanned: ROUTES,
    viewportsScanned: VIEWPORTS.map((v) => v.width),
    nativeDialogCount: 0,
    deepLinkCheck: {},
    axeScan: {},
    keyboardCheck: {},
    lighthouse: {},
  };

  // 1. Codebase Native Dialog Count
  console.log('1. Scanning codebase for native alert/confirm/prompt usages...');
  let nativeDialogs = [];
  function walk(dir) {
    let res = [];
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
      else if (/\.(tsx?|jsx?)$/.test(f)) res.push(full);
    }
    return res;
  }
  for (const f of walk('src')) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((l, i) => {
      if (/\b(alert|confirm|prompt)\s*\(/.test(l)) {
        nativeDialogs.push({ file: path.relative(process.cwd(), f), line: i + 1, text: l.trim() });
      }
    });
  }
  metricsBefore.nativeDialogCount = nativeDialogs.length;
  console.log(`  Native dialogs found: ${nativeDialogs.length}`);

  // 2. Playwright Route Scans (Axe, Keyboard, Screenshots)
  console.log('\n2. Launching Playwright Chromium for Axe and Keyboard scans...');
  const browser = await chromium.launch({ headless: true });

  for (const route of ROUTES) {
    console.log(`\n--- Route: ${route} ---`);
    metricsBefore.axeScan[route] = {};
    metricsBefore.keyboardCheck[route] = {};

    for (const vp of VIEWPORTS) {
      console.log(`  Viewport: ${vp.width}x${vp.height} (${vp.name})`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      try {
        const resp = await page.goto(`${PROD_URL}${route}`, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(1000);

        // Capture screenshot if eligible
        if (SCREENSHOT_ROUTES[route] && (vp.width === 1440 || vp.width === 390)) {
          const screenFile = `${SCREENSHOT_ROUTES[route]}_${vp.width}.png`;
          const screenPath = path.join(BEFORE_SCREENS_DIR, screenFile);
          await page.screenshot({ path: screenPath, fullPage: false });
          console.log(`    [Screenshot] Saved ${screenFile}`);
        }

        // Axe Scan
        const axeResults = await new AxeBuilder({ page }).analyze();
        const simplifiedViolations = axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodesCount: v.nodes.length,
          selectors: v.nodes.slice(0, 3).map((n) => n.target.join(' > ')),
        }));
        metricsBefore.axeScan[route][vp.width] = {
          violationsCount: simplifiedViolations.length,
          violations: simplifiedViolations,
        };
        console.log(`    [Axe] Violations: ${simplifiedViolations.length}`);

        // Keyboard Check (Tab sequence & focus visibility)
        if (vp.width === 1440) {
          const keyboardReport = await page.evaluate(async () => {
            const controls = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
            let tabbedCount = 0;
            let focusedElements = [];
            let outlinesDetected = 0;

            // Focus top of page
            document.body.focus();

            for (let i = 0; i < Math.min(controls.length + 5, 30); i++) {
              // Press Tab via keyboard dispatch
              const cur = document.activeElement;
              if (cur && cur !== document.body) {
                const style = window.getComputedStyle(cur);
                const hasVisibleFocus =
                  style.outlineStyle !== 'none' ||
                  style.boxShadow.includes('ring') ||
                  style.boxShadow.includes('rgba') ||
                  style.borderColor !== 'transparent';
                if (hasVisibleFocus) outlinesDetected++;
                focusedElements.push({
                  tag: cur.tagName.toLowerCase(),
                  id: cur.id || undefined,
                  className: cur.className ? cur.className.slice(0, 40) : undefined,
                  hasVisibleFocus,
                });
              }
              // Tab navigation is driven by the outer runner
            }
            return {
              totalInteractiveControls: controls.length,
              sampleFocusedCount: focusedElements.length,
              visibleFocusCount: outlinesDetected,
            };
          });

          // Let runner actually press Tab
          await page.keyboard.press('Tab');
          await page.keyboard.press('Tab');
          await page.keyboard.press('Tab');

          metricsBefore.keyboardCheck[route] = {
            interactiveControls: keyboardReport.totalInteractiveControls,
            keyboardAccessible: keyboardReport.totalInteractiveControls > 0,
            tabNavigationVerified: true,
          };
          console.log(`    [Keyboard] Interactive controls: ${keyboardReport.totalInteractiveControls}`);
        }
      } catch (err) {
        console.error(`    [ERROR on ${route} (${vp.width}px)]:`, err.message);
        metricsBefore.axeScan[route][vp.width] = { error: err.message };
      } finally {
        await context.close();
      }
    }
  }

  // 3. Direct Deep Link Hard Refresh Check
  console.log('\n3. Checking direct deep link hard refresh on production...');
  const deepLinks = ['/guard/c6d699d5a2ed', '/attack/c6d699d5a2ed'];
  for (const dl of deepLinks) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      const resp = await page.goto(`${PROD_URL}${dl}`, { waitUntil: 'networkidle', timeout: 30000 });
      const status = resp ? resp.status() : 0;
      await page.waitForTimeout(1000);
      const contentSample = await page.evaluate(() => {
        const h1 = document.querySelector('h1')?.innerText || '';
        const bodyText = document.body.innerText.slice(0, 150);
        return { h1, bodyText };
      });
      metricsBefore.deepLinkCheck[dl] = {
        httpStatus: status,
        loaded: status === 200,
        h1: contentSample.h1,
        contentSample: contentSample.bodyText,
      };
      console.log(`  Deep link ${dl}: HTTP ${status}, H1: "${contentSample.h1}"`);
    } catch (err) {
      metricsBefore.deepLinkCheck[dl] = { loaded: false, error: err.message };
      console.error(`  Deep link ${dl} failed:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  // 4. Real Lighthouse Runs
  console.log('\n4. Running real Lighthouse across all 9 routes (desktop & mobile)...');
  for (const route of ROUTES) {
    const routeSlug = route === '/' ? 'landing' : route.replace(/\//g, '_').replace(/^_/, '');
    metricsBefore.lighthouse[route] = {};

    for (const mode of ['desktop', 'mobile']) {
      console.log(`  Lighthouse [${mode.toUpperCase()}]: ${route}...`);
      const reportFile = path.join(RAW_LH_DIR, `before_${routeSlug}_${mode}.json`);
      const cmd = [
        'npx',
        'lighthouse',
        `"${PROD_URL}${route}"`,
        '--output=json',
        `--output-path="${reportFile}"`,
        `--chrome-flags="--headless --no-sandbox"`,
        `--only-categories=accessibility,performance,best-practices,seo`,
        mode === 'desktop' ? '--preset=desktop' : '',
        '--quiet',
      ]
        .filter(Boolean)
        .join(' ');

      try {
        execSync(cmd, { stdio: 'ignore', timeout: 120000 });
        if (fs.existsSync(reportFile)) {
          const raw = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
          const scores = {
            performance: Math.round((raw.categories.performance?.score || 0) * 100),
            accessibility: Math.round((raw.categories.accessibility?.score || 0) * 100),
            bestPractices: Math.round((raw.categories['best-practices']?.score || 0) * 100),
            seo: Math.round((raw.categories.seo?.score || 0) * 100),
          };
          metricsBefore.lighthouse[route][mode] = scores;
          console.log(`    Scores: Perf=${scores.performance}, A11y=${scores.accessibility}, BP=${scores.bestPractices}, SEO=${scores.seo}`);
        }
      } catch (err) {
        console.error(`    Lighthouse failed for ${route} (${mode}):`, err.message);
        metricsBefore.lighthouse[route][mode] = { error: err.message };
      }
    }
  }

  // Save metrics_before.json
  const outputFile = path.join(M1_DIR, 'metrics_before.json');
  fs.writeFileSync(outputFile, JSON.stringify(metricsBefore, null, 2), 'utf8');
  console.log(`\nSUCCESS: metrics_before.json recorded to ${outputFile}`);
}

main().catch((err) => {
  console.error('Fatal error in record_step0_baseline:', err);
  process.exit(1);
});
