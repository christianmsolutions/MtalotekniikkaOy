#!/usr/bin/env node
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const URL = 'https://mtalotekniikka.fi/';
const reportDir = join(process.cwd(), 'reports');
const outPath = join(reportDir, 'lighthouse-home.json');
const beforePath = join(reportDir, 'lighthouse-home.before.json');

const opts = {
  logLevel: 'info',
  output: 'json',
  onlyCategories: ['performance'],
  throttlingMethod: 'devtools',
  throttling: {
    rttMs: 300,
    throughputKbps: 700,
    cpuSlowdownMultiplier: 4,
  },
  formFactor: 'mobile',
  screenEmulation: {
    mobile: true,
    width: 360,
    height: 640,
    deviceScaleFactor: 3,
    disabled: false,
  },
  port: 0,
  disableFullPageScreenshot: true,
};

const ensureDir = (dir) => mkdirSync(dir, { recursive: true });

const metricsFrom = (lhr) => ({
  performance: Math.round((lhr.categories.performance.score || 0) * 100),
  fcp: lhr.audits['first-contentful-paint'].displayValue,
  lcp: lhr.audits['largest-contentful-paint'].displayValue,
  tbt: lhr.audits['total-blocking-time'].displayValue,
  cls: lhr.audits['cumulative-layout-shift'].displayValue,
  si: lhr.audits['speed-index'].displayValue,
});

const printMetrics = (label, m) => {
  console.log(`${label}: Perf ${m.performance} | FCP ${m.fcp} | LCP ${m.lcp} | TBT ${m.tbt} | CLS ${m.cls} | SI ${m.si}`);
};

const run = async () => {
  ensureDir(reportDir);

  // keep previous as "before" if present
  let beforeMetrics = null;
  if (existsSync(outPath) && !existsSync(beforePath)) {
    // preserve last run as before
    const prev = readFileSync(outPath, 'utf8');
    writeFileSync(beforePath, prev);
  }
  if (existsSync(beforePath)) {
    try {
      const beforeJson = JSON.parse(readFileSync(beforePath, 'utf8'));
      beforeMetrics = metricsFrom(beforeJson);
    } catch {
      beforeMetrics = null;
    }
  }

  const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  opts.port = chrome.port;

  const runnerResult = await lighthouse(URL, opts);
  const reportJson = runnerResult.report;
  const lhr = runnerResult.lhr;
  writeFileSync(outPath, reportJson);

  const currentMetrics = metricsFrom(lhr);

  console.log('\nLighthouse (mobile, slow 4G-ish)');
  printMetrics('Current', currentMetrics);
  if (beforeMetrics) {
    printMetrics('Before ', beforeMetrics);
  }

  await chrome.kill();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
