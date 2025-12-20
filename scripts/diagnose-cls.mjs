#!/usr/bin/env node
import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = 'https://mtalotekniikka.fi/';
const reportDir = join(process.cwd(), 'reports');
const outPath = join(reportDir, 'cls-diagnose.json');
const observeMs = 20000;
const device = devices['Pixel 5'];

const slow4G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8, // ~1.6 Mbps
  uploadThroughput: (0.75 * 1024 * 1024) / 8, // ~0.75 Mbps
  latency: 150,
};

const initScript = `
(() => {
  window.__clsDiag = {
    entries: [],
    mutations: [],
    bannerDetected: false,
    headerHeights: { start: null, after: null },
    startTime: performance.now(),
  };
  try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}

  const describeNode = (node) => {
    if (!node || node.nodeType !== 1) return null;
    const el = node;
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const classes = (el.className || '').toString().split(/\\s+/).filter(Boolean).slice(0,3);
    const selector = [
      el.tagName.toLowerCase(),
      el.id ? '#' + el.id : '',
      classes.length ? '.' + classes.join('.') : ''
    ].join('');
    let text = '';
    if (el.childNodes && el.childNodes.length === 1 && el.textContent) {
      text = el.textContent.trim().slice(0, 30);
    }
    return {
      selector,
      text,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      styles: {
        position: cs.position,
        display: cs.display,
        height: cs.height,
        minHeight: cs.minHeight,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
      },
    };
  };

  const header = document.querySelector('header');
  if (header) {
    const r = header.getBoundingClientRect();
    window.__clsDiag.headerHeights.start = r.height;
  }

  const clsEntries = [];
  const po = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      const sources = (entry.sources || []).map((s) => describeNode(s.node)).filter(Boolean).slice(0,3);
      clsEntries.push({
        value: entry.value,
        startTime: entry.startTime,
        sources,
      });
    }
  });
  po.observe({ type: 'layout-shift', buffered: true });

  const mo = new MutationObserver((mutationList) => {
    const now = performance.now();
    mutationList.forEach((m) => {
      if (m.type === 'childList') {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const info = describeNode(node);
            if (info) {
              window.__clsDiag.mutations.push({ time: now, type: 'added', node: info });
              const cls = (info.selector || '').toLowerCase();
              if (cls.includes('cookie') || cls.includes('consent') || cls.includes('banner')) {
                window.__clsDiag.bannerDetected = true;
              }
            }
          }
        });
      }
    });
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

  window.__clsDiag.__po = po;
  window.__clsDiag.__mo = mo;
})();
`;

const run = async () => {
  mkdirSync(reportDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    ...device,
    viewport: { width: 393, height: 851 },
    locale: 'fi-FI',
  });
  const page = await context.newPage();

  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  await client.send('Network.emulateNetworkConditions', slow4G);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await context.clearCookies();
  await page.addInitScript(initScript);

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(observeMs);

  const data = await page.evaluate(() => {
    const d = window.__clsDiag || {};
    if (d.__po) d.__po.disconnect();
    if (d.__mo) d.__mo.disconnect();
    const header = document.querySelector('header');
    if (header) {
      const r = header.getBoundingClientRect();
      d.headerHeights.after = r.height;
    }
    const totalCLS = (d.entries || []).reduce((sum, e) => sum + (e.value || 0), 0);
    d.totalCLS = totalCLS;
    // shrink entries to top 10
    d.entries = (d.entries || []).sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 10);
    // shrink mutations
    d.mutations = (d.mutations || []).slice(0, 20);
    return d;
  });

  await browser.close();
  writeFileSync(outPath, JSON.stringify(data, null, 2));

  console.log('CLS diagnose summary:');
  console.log(` totalCLS: ${data.totalCLS}`);
  if (data.headerHeights) {
    console.log(` header height start/after: ${data.headerHeights.start} / ${data.headerHeights.after}`);
  }
  if (data.bannerDetected) console.log(' banner detected via mutations');
  if (data.entries && data.entries.length) {
    console.log(' top entries:');
    data.entries.slice(0, 5).forEach((e, i) => {
      const src = (e.sources && e.sources[0]) || {};
      console.log(`  ${i + 1}. t=${(e.startTime || 0).toFixed(1)}ms v=${e.value} src=${src.selector || '-'}`);
    });
  } else {
    console.log(' no layout-shift entries captured');
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
