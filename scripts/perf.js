#!/usr/bin/env node
const { spawn } = require("child_process");
const http = require("http");
const lighthouseModule = require("lighthouse");
const lighthouse = lighthouseModule.default || lighthouseModule;
const chromeLauncher = require("chrome-launcher");

const MOBILE_SETTINGS = {
  formFactor: "mobile",
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675,
    cpuSlowdownMultiplier: 4
  },
  throttlingMethod: "simulate",
  screenEmulation: {
    mobile: true,
    width: 412,
    height: 823,
    deviceScaleFactor: 1.75,
    disabled: false
  },
  emulatedUserAgent:
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36"
};

const TARGETS = [
  { name: "index", url: "http://localhost:8000/index.html" },
  { name: "lvi", url: "http://localhost:8000/lvi.html" },
  { name: "sahkotyot", url: "http://localhost:8000/sahkotyot.html" }
];

async function waitForServer(url) {
  return new Promise((resolve, reject) => {
    const tryRequest = (attemptsLeft) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", (err) => {
        if (attemptsLeft <= 0) return reject(err);
        setTimeout(() => tryRequest(attemptsLeft - 1), 300);
      });
    };
    tryRequest(10);
  });
}

async function runAudit(url, chrome) {
  const runnerResult = await lighthouse(url, {
    port: chrome.port,
    onlyCategories: ["performance"],
    logLevel: "error",
    ...MOBILE_SETTINGS
  });
  return runnerResult.lhr;
}

function summarize(lhr) {
  const audits = lhr.audits;
  const lcpNode =
    audits["lcp-breakdown-insight"]?.details?.items?.find((item) => item.type === "node") || null;
  return {
    score: Math.round((lhr.categories.performance.score || 0) * 100),
    lcp: audits["largest-contentful-paint"]?.numericValue || 0,
    cls: audits["cumulative-layout-shift"]?.numericValue || 0,
    inp: audits["interaction-to-next-paint"]?.numericValue || null,
    tbt: audits["total-blocking-time"]?.numericValue || 0,
    lcpElement: lcpNode?.selector || lcpNode?.nodeLabel || "n/a",
    longTasks: (audits["long-tasks"]?.details?.items || []).slice(0, 3)
  };
}

function printReport(results) {
  console.log("Lighthouse (mobile) performance report");
  results.forEach(({ target, summary }) => {
    console.log(`\n${target.name}`);
    console.log(`  Performance score: ${summary.score}`);
    console.log(`  LCP: ${(summary.lcp / 1000).toFixed(2)}s (${summary.lcpElement})`);
    console.log(`  CLS: ${summary.cls.toFixed(3)}`);
    console.log(`  TBT: ${Math.round(summary.tbt)}ms`);
    if (summary.inp) console.log(`  INP (lab): ${(summary.inp / 1000).toFixed(2)}s`);
    if (summary.longTasks.length) {
      const tasks = summary.longTasks
        .map((task) => {
          let label = "script";
          if (task.url) {
            try {
              label = new URL(task.url).hostname || task.url;
            } catch (_) {
              label = task.url;
            }
          }
          return `${Math.round(task.duration)}ms ${label}`;
        })
        .join(", ");
      console.log(`  Long tasks: ${tasks}`);
    }
  });
}

async function main() {
  const server = spawn("python3", ["-m", "http.server", "8000"], {
    stdio: "ignore",
    cwd: process.cwd()
  });
  let failed = false;

  try {
    await waitForServer(TARGETS[0].url);
    const results = [];

    for (const target of TARGETS) {
      const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
      try {
        const lhr = await runAudit(target.url, chrome);
        results.push({ target, summary: summarize(lhr) });
      } finally {
        await chrome.kill();
      }
    }

    printReport(results);

    failed = results.some(
      ({ summary }) => summary.score < 90 || summary.lcp > 2500 || summary.cls > 0.1
    );
  } catch (err) {
    failed = true;
    console.error("Perf check failed:", err.message || err);
  } finally {
    server.kill("SIGINT");
    if (failed) process.exit(1);
  }
}

main();
