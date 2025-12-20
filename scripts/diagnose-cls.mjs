#!/usr/bin/env node
import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = 'https://mtalotekniikka.fi/';
const reportDir = join(process.cwd(), 'reports');
const outPath = join(reportDir, 'cls-diagnose.json');

const device = devices['Pixel 5'];

const run = async () => {
  mkdirSync(reportDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    ...device,
    viewport: { width: 393, height: 851 },
    locale: 'fi-FI',
  });
  const page = await context.newPage();

  await page.route('**/*', (route) => {
    // Simulate Slow 4G-ish throttling by delaying responses slightly (lightweight)
    setTimeout(() => route.continue(), 200);
  });

  const data = await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 })
    .then(() => page.evaluate(() => {
      return new Promise((resolve) => {
        const result = {
          totalCLS: 0,
          entries: [],
          mutations: [],
          bannerDetected: false,
          headerHeights: { start: null, after: null },
          observedForMs: 5000,
        };

        const start = performance.now();

        const describeNode = (node) => {
          if (!node || node.nodeType !== 1) return null;
          const el = node;
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            classes: el.className || null,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          };
        };

        const header = document.querySelector('header');
        if (header) {
          const r = header.getBoundingClientRect();
          result.headerHeights.start = r.height;
        }

        const clsEntries = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;
            const sources = (entry.sources || []).map((s) => describeNode(s.node)).filter(Boolean);
            clsEntries.push({
              value: entry.value,
              time: entry.startTime,
              sources,
            });
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });

        const mutationObserver = new MutationObserver((mutationList) => {
          const now = performance.now();
          if (now - start > result.observedForMs) return;
          mutationList.forEach((m) => {
            if (m.type === 'childList') {
              m.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                  const el = node;
                  const info = describeNode(el);
                  if (info) {
                    result.mutations.push({ time: now, type: 'added', node: info });
                    const cls = (info.classes || '').toLowerCase();
                    if (cls.includes('cookie') || cls.includes('consent') || cls.includes('banner')) {
                      result.bannerDetected = true;
                    }
                  }
                }
              });
            }
          });
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
          observer.disconnect();
          mutationObserver.disconnect();
          result.totalCLS = clsEntries.reduce((sum, e) => sum + e.value, 0);
          result.entries = clsEntries.sort((a, b) => b.value - a.value).slice(0, 10);
          const headerAfter = document.querySelector('header');
          if (headerAfter) {
            const r = headerAfter.getBoundingClientRect();
            result.headerHeights.after = r.height;
          }
          resolve(result);
        }, 5200);
      });
    }));

  await browser.close();
  writeFileSync(outPath, JSON.stringify(data, null, 2));

  console.log('CLS diagnose summary:');
  console.log(` totalCLS: ${data.totalCLS}`);
  if (data.headerHeights) {
    console.log(` header height start/after: ${data.headerHeights.start} / ${data.headerHeights.after}`);
  }
  if (data.bannerDetected) {
    console.log(' banner detected in mutations');
  }
  if (data.entries && data.entries.length) {
    console.log(' top shifting nodes:');
    data.entries.slice(0, 5).forEach((e, i) => {
      const src = (e.sources && e.sources[0]) || {};
      console.log(`  ${i + 1}. value=${e.value} tag=${src.tag || '-'} id=${src.id || ''} classes=${src.classes || ''}`);
    });
  } else {
    console.log(' no layout-shift entries captured');
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
