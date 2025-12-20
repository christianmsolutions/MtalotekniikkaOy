#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const URL = 'https://mtalotekniikka.fi/';
const reportDir = join(process.cwd(), 'reports');
const outPath = join(reportDir, 'lighthouse-home.desktop.json');

const opts = {
  logLevel: 'info',
  output: 'json',
  onlyCategories: ['performance'],
  formFactor: 'desktop',
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1,
  },
  screenEmulation: {
    mobile: false,
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    disabled: false,
  },
  disableFullPageScreenshot: true,
};

const metricsFrom = (lhr) => ({
  performance: Math.round((lhr.categories.performance.score || 0) * 100),
  fcp: lhr.audits['first-contentful-paint'].displayValue,
  lcp: lhr.audits['largest-contentful-paint'].displayValue,
  tbt: lhr.audits['total-blocking-time'].displayValue,
  cls: lhr.audits['cumulative-layout-shift'].displayValue,
  si: lhr.audits['speed-index'].displayValue,
});

const printMetrics = (label, m) => {
  console.log(
    `${label}: Perf ${m.performance} | FCP ${m.fcp} | LCP ${m.lcp} | TBT ${m.tbt} | CLS ${m.cls} | SI ${m.si}`,
  );
};

const run = async () => {
  mkdirSync(reportDir, { recursive: true });

  const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  opts.port = chrome.port;

  const runnerResult = await lighthouse(URL, opts);
  const lhr = runnerResult.lhr;
  writeFileSync(outPath, runnerResult.report);
  const currentMetrics = metricsFrom(lhr);

  console.log('\nLighthouse Desktop');
  printMetrics('Current', currentMetrics);

  await chrome.kill();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
