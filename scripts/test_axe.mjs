/**
 * BreakTheGuard - Automated Axe Accessibility Matrix Test (T3)
 *
 * Scans all 9 routes at viewports [1440, 500, 390],
 * plus GuidedTour modal and FundsGuideModal across all viewports.
 * Asserts 0 violations across every route and modal state.
 * Output: docs/milestones/m1/axe_matrix.json
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

function startStaticServer(distDir, port = 4175) {
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

const VIEWPORTS = [
  { width: 1440, height: 900, name: 'desktop' },
  { width: 500, height: 800, name: 'tablet_small' },
  { width: 390, height: 844, name: 'mobile' },
];

const ROUTES = [
  { name: 'Landing', path: '/' },
  { name: 'Arena', path: '/arena' },
  { name: 'GuardDetail', path: '/guard/0' },
  { name: 'Attack', path: '/attack' },
  { name: 'Register', path: '/register' },
  { name: 'Leaderboard', path: '/leaderboard' },
  { name: 'GateDemo', path: '/gate' },
  { name: 'Evidence', path: '/evidence' },
  { name: 'Wallet', path: '/wallet' },
];

async function runAxeMatrix() {
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Please run npm run build first.');
    process.exit(1);
  }

  const port = 4175;
  const server = await startStaticServer(distDir, port);
  const baseUrl = `http://localhost:${port}`;
  console.log(`Axe test server running at ${baseUrl}`);

  const matrix = {
    testedAt: new Date().toISOString(),
    viewports: VIEWPORTS.map((v) => v.width),
    totalScans: 0,
    totalViolations: 0,
    routes: {},
    modals: {},
  };

  const browser = await chromium.launch();

  try {
    // 1. Scan Routes across viewports
    console.log('\n--- 1. Scanning All 9 Routes ---');
    for (const r of ROUTES) {
      matrix.routes[r.name] = {};
      for (const vp of VIEWPORTS) {
        matrix.totalScans += 1;
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await context.newPage();

        // Dismiss tour so it doesn't block route content
        await page.goto(`${baseUrl}${r.path}`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => localStorage.setItem('breaktheguard_tour_dismissed_v1', 'true'));
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(200);

        const axe = new AxeBuilder({ page });
        const results = await axe.analyze();

        const simplified = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
          selectors: v.nodes.slice(0, 3).map((n) => n.target.join(' > ')),
        }));

        matrix.totalViolations += simplified.length;
        matrix.routes[r.name][vp.width] = {
          violationsCount: simplified.length,
          violations: simplified,
        };

        if (simplified.length > 0) {
          console.error(`FAIL: ${r.name} @ ${vp.width}px - ${simplified.length} violations:`, simplified);
        } else {
          console.log(`PASS: ${r.name} @ ${vp.width}px - 0 violations`);
        }

        await context.close();
      }
    }

    // 2. Scan GuidedTour Modal
    console.log('\n--- 2. Scanning GuidedTour Modal ---');
    matrix.modals['GuidedTour'] = {};
    for (const vp of VIEWPORTS) {
      matrix.totalScans += 1;
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.removeItem('breaktheguard_tour_dismissed_v1'));
      await page.reload({ waitUntil: 'domcontentloaded' });

      await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5000 });

      const axe = new AxeBuilder({ page });
      const results = await axe.analyze();

      const simplified = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        selectors: v.nodes.slice(0, 3).map((n) => n.target.join(' > ')),
      }));

      matrix.totalViolations += simplified.length;
      matrix.modals['GuidedTour'][vp.width] = {
        violationsCount: simplified.length,
        violations: simplified,
      };

      if (simplified.length > 0) {
        console.error(`FAIL: GuidedTour @ ${vp.width}px - ${simplified.length} violations:`, simplified);
      } else {
        console.log(`PASS: GuidedTour @ ${vp.width}px - 0 violations`);
      }

      await context.close();
    }

    // 3. Scan FundsGuide Modal
    console.log('\n--- 3. Scanning FundsGuide Modal ---');
    matrix.modals['FundsGuide'] = {};
    for (const vp of VIEWPORTS) {
      matrix.totalScans += 1;
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      await page.goto(`${baseUrl}/wallet`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.setItem('breaktheguard_tour_dismissed_v1', 'true'));
      await page.reload({ waitUntil: 'domcontentloaded' });

      const guideBtn = page.locator('button:has-text("0 GEN Guide")').first();
      await guideBtn.click();
      await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5000 });

      const axe = new AxeBuilder({ page });
      const results = await axe.analyze();

      const simplified = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        selectors: v.nodes.slice(0, 3).map((n) => n.target.join(' > ')),
      }));

      matrix.totalViolations += simplified.length;
      matrix.modals['FundsGuide'][vp.width] = {
        violationsCount: simplified.length,
        violations: simplified,
      };

      if (simplified.length > 0) {
        console.error(`FAIL: FundsGuide @ ${vp.width}px - ${simplified.length} violations:`, simplified);
      } else {
        console.log(`PASS: FundsGuide @ ${vp.width}px - 0 violations`);
      }

      await context.close();
    }

  } finally {
    await browser.close();
    server.close();
  }

  // Save matrix output
  const outPath = path.join(process.cwd(), 'docs', 'milestones', 'm1', 'axe_matrix.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(matrix, null, 2), 'ascii');
  console.log(`\nAxe matrix saved to ${outPath}`);

  console.log('\n======================================================');
  console.log('AXE MATRIX TEST SUMMARY:');
  console.log(`Total Scans: ${matrix.totalScans}`);
  console.log(`Total Violations: ${matrix.totalViolations}`);
  console.log('======================================================');

  if (matrix.totalViolations > 0) {
    console.error(`FAIL: Found ${matrix.totalViolations} accessibility violations across matrix.`);
    process.exit(1);
  } else {
    console.log('PASS: 0 violations across all routes and modal states!');
  }
}

runAxeMatrix().catch((err) => {
  console.error('Unhandled error running axe matrix:', err);
  process.exit(1);
});
