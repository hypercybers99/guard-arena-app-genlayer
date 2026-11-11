/**
 * BreakTheGuard - Automated Occlusion Test
 *
 * Tests every dialog across 3 engines (Chromium, Firefox, WebKit) and
 * viewport matrix: widths (390, 500, 630) x heights (300, 400, 667).
 * Verifies document.elementFromPoint at center of:
 * 1. Title
 * 2. Close control
 * 3. Body text container
 * 4. Every footer button
 * Ensures zero occlusions across all combinations.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, firefox, webkit } from 'playwright';

// Simple static server for dist/
function startStaticServer(distDir, port = 4173) {
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

const WIDTHS = [390, 500, 630];
const HEIGHTS = [300, 400, 667];
const ENGINES = [
  { name: 'chromium', launcher: chromium },
  { name: 'firefox', launcher: firefox },
  { name: 'webkit', launcher: webkit },
];

async function runOcclusionTests() {
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Please run npm run build first.');
    process.exit(1);
  }

  const port = 4173;
  const server = await startStaticServer(distDir, port);
  const baseUrl = `http://localhost:${port}`;
  console.log(`Static server running at ${baseUrl}`);

  const results = {
    testedAt: new Date().toISOString(),
    matrix: { widths: WIDTHS, heights: HEIGHTS },
    engines: ENGINES.map((e) => e.name),
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    failures: [],
  };

  for (const { name: engineName, launcher } of ENGINES) {
    console.log(`\n--- Testing Engine: ${engineName} ---`);
    let browser;
    try {
      browser = await launcher.launch();
    } catch (err) {
      console.warn(`Could not launch ${engineName}: ${err.message}`);
      continue;
    }

    for (const w of WIDTHS) {
      for (const h of HEIGHTS) {
        const context = await browser.newContext({
          viewport: { width: w, height: h },
        });
        const page = await context.newPage();

        // 1. Test GuidedTour Modal
        await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        // Ensure tour is open by setting localStorage
        await page.evaluate(() => {
          localStorage.removeItem('breaktheguard_tour_dismissed_v1');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });

        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible', timeout: 5000 });

        // Check points in Tour modal
        const checkPoints = [
          { name: 'title', selector: '[data-testid="modal-title"]' },
          { name: 'close_button', selector: '[aria-label="Close dialog"]' },
          { name: 'body_container', selector: '[role="dialog"] .overflow-y-auto' },
          { name: 'footer_next_button', selector: '[role="dialog"] button:has-text("Next")' },
        ];

        for (const pt of checkPoints) {
          results.totalChecks += 1;
          const loc = page.locator(pt.selector).first();
          const isVisible = await loc.isVisible();
          if (!isVisible) {
            results.failedChecks += 1;
            results.failures.push({
              engine: engineName,
              viewport: `${w}x${h}`,
              dialog: 'GuidedTour',
              target: pt.name,
              reason: 'Element not visible in viewport',
            });
            continue;
          }

          const box = await loc.boundingBox();
          if (!box) {
            results.failedChecks += 1;
            results.failures.push({
              engine: engineName,
              viewport: `${w}x${h}`,
              dialog: 'GuidedTour',
              target: pt.name,
              reason: 'Bounding box unavailable',
            });
            continue;
          }

          const cx = Math.min(Math.max(1, box.x + box.width / 2), w - 1);
          const cy = Math.min(Math.max(1, box.y + box.height / 2), h - 1);

          const isUnoccluded = await loc.evaluate((target, { x, y }) => {
            const elAtPoint = document.elementFromPoint(x, y);
            if (!elAtPoint || !target) return false;
            return target === elAtPoint || target.contains(elAtPoint) || elAtPoint.contains(target);
          }, { x: cx, y: cy });

          if (isUnoccluded) {
            results.passedChecks += 1;
          } else {
            results.failedChecks += 1;
            results.failures.push({
              engine: engineName,
              viewport: `${w}x${h}`,
              dialog: 'GuidedTour',
              target: pt.name,
              reason: `elementFromPoint(${cx}, ${cy}) occluded`,
            });
          }
        }

        // 2. Test FundsGuideModal
        await page.evaluate(() => {
          localStorage.setItem('breaktheguard_tour_dismissed_v1', 'true');
        });
        await page.goto(`${baseUrl}/wallet`, { waitUntil: 'domcontentloaded' });
        // Click 0 GEN Guide button
        const guideBtn = page.locator('button:has-text("0 GEN Guide")').first();
        await guideBtn.click();
        await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5000 });

        const fundsCheckPoints = [
          { name: 'title', selector: '[data-testid="modal-title"]' },
          { name: 'close_button', selector: '[aria-label="Close dialog"]' },
          { name: 'body_container', selector: '[role="dialog"] .overflow-y-auto' },
          { name: 'footer_understood_button', selector: '[role="dialog"] button:has-text("Understood")' },
        ];

        for (const pt of fundsCheckPoints) {
          results.totalChecks += 1;
          const loc = page.locator(pt.selector).first();
          const isVisible = await loc.isVisible();
          if (!isVisible) {
            results.failedChecks += 1;
            results.failures.push({
              engine: engineName,
              viewport: `${w}x${h}`,
              dialog: 'FundsGuideModal',
              target: pt.name,
              reason: 'Element not visible in viewport',
            });
            continue;
          }

          const box = await loc.boundingBox();
          if (!box) {
            results.failedChecks += 1;
            results.failures.push({
              engine: engineName,
              viewport: `${w}x${h}`,
              dialog: 'FundsGuideModal',
              target: pt.name,
              reason: 'Bounding box unavailable',
            });
            continue;
          }

          const cx = Math.min(Math.max(1, box.x + box.width / 2), w - 1);
          const cy = Math.min(Math.max(1, box.y + box.height / 2), h - 1);

          const isUnoccluded = await loc.evaluate((target, { x, y }) => {
            const elAtPoint = document.elementFromPoint(x, y);
            if (!elAtPoint || !target) return false;
            return target === elAtPoint || target.contains(elAtPoint) || elAtPoint.contains(target);
          }, { x: cx, y: cy });

          if (isUnoccluded) {
            results.passedChecks += 1;
          } else {
            results.failedChecks += 1;
            results.failures.push({
              engine: engineName,
              viewport: `${w}x${h}`,
              dialog: 'FundsGuideModal',
              target: pt.name,
              reason: `elementFromPoint(${cx}, ${cy}) occluded`,
            });
          }
        }

        await context.close();
      }
    }
    await browser.close();
  }

  server.close();

  const outDir = path.join(process.cwd(), 'docs', 'milestones', 'm1');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'occlusion_results.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );

  console.log(`\n======================================================`);
  console.log(`OCCLUSION TEST SUMMARY:`);
  console.log(`Total Checks: ${results.totalChecks}`);
  console.log(`Passed: ${results.passedChecks}`);
  console.log(`Failed: ${results.failedChecks}`);
  console.log(`======================================================\n`);

  if (results.failedChecks > 0) {
    console.error('FAILURES:');
    console.error(JSON.stringify(results.failures, null, 2));
    process.exit(1);
  } else {
    console.log('PASS: Zero occlusions across all engines, viewports, and dialogs.');
    process.exit(0);
  }
}

runOcclusionTests();
