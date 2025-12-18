import { execFileSync, execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const OUT_ROOT = path.join(ROOT, "ops", "lighthouse");
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MAX_RETRIES = 3;
const LH_TIMEOUT = 90_000;

function listHtml() {
  const cmd =
    "find . -type f -name \"*.html\" -not -path \"./node_modules/*\" -not -path \"./.git/*\" -not -path \"./SITE/*\"";
  const res = execSync(cmd, { cwd: ROOT }).toString().trim().split("\n").filter(Boolean);
  return res
    .map((p) => p.replace(/^.\//, ""))
    .filter(
      (p) =>
        !p.includes("offline.html") &&
        !/demo/i.test(p) &&
        !p.includes("lvi-section-demo.html")
    );
}

function startServer() {
  return spawn("python3", ["-m", "http.server", `${PORT}`, "--bind", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore",
  });
}

function safeName(rel) {
  return rel.replace(/\//g, "_").replace(/\.html$/, "");
}

function runLighthouse(url, outBase) {
  const jsonPath = `${outBase}.report.json`;
  if (fs.existsSync(jsonPath)) return jsonPath;
  const args = [
    "lighthouse",
    url,
    "--output",
    "html",
    "--output",
    "json",
    `--output-path=${outBase}`,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--preset=desktop",
    `--chrome-flags=--headless=new`,
    "--quiet",
    `--max-wait-for-load=${LH_TIMEOUT}`,
  ];
  execFileSync("npx", args, { stdio: "ignore", cwd: ROOT, timeout: LH_TIMEOUT + 15000 });
  return jsonPath;
}

function parseResult(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const cat = data.categories || {};
  const audits = data.audits || {};
  const metric = (id) => (audits[id] && audits[id].numericValue) || null;
  return {
    url: data.requestedUrl,
    performance: cat.performance ? cat.performance.score : null,
    accessibility: cat.accessibility ? cat.accessibility.score : null,
    bestPractices: cat["best-practices"] ? cat["best-practices"].score : null,
    seo: cat.seo ? cat.seo.score : null,
    fcp: metric("first-contentful-paint"),
    lcp: metric("largest-contentful-paint"),
    cls: metric("cumulative-layout-shift"),
    tbt: metric("total-blocking-time"),
    si: metric("speed-index"),
  };
}

function formatScore(s) {
  return s == null ? "n/a" : (s * 100).toFixed(0);
}

function writeSummary(results, outDir, timestamp) {
  const lines = [];
  lines.push(`# Lighthouse summary (${timestamp})`, "");
  lines.push("| Sivu | Perf | A11y | BP | SEO | LCP (ms) | TBT (ms) | CLS |");
  lines.push("|---|---|---|---|---|---|---|---|");
  results.forEach((r) => {
    lines.push(
      `| ${r.path} | ${formatScore(r.performance)} | ${formatScore(r.accessibility)} | ${formatScore(
        r.bestPractices
      )} | ${formatScore(r.seo)} | ${r.lcp ? r.lcp.toFixed(0) : "n/a"} | ${
        r.tbt ? r.tbt.toFixed(0) : "n/a"
      } | ${r.cls != null ? r.cls.toFixed(3) : "n/a"} |`
    );
  });
  const worst = [...results]
    .filter((r) => r.performance != null)
    .sort((a, b) => a.performance - b.performance)
    .slice(0, 10);
  lines.push("", "## Heikoimmat (performance)", "");
  worst.forEach((r) => lines.push(`- ${r.path}: ${formatScore(r.performance)}`));
  const summaryPath = path.join(outDir, `summary-${timestamp}.md`);
  fs.writeFileSync(summaryPath, lines.join("\n"));
  return summaryPath;
}

function loadState(runId, pages) {
  const outDir = path.join(OUT_ROOT, `report-${runId}`);
  fs.mkdirSync(outDir, { recursive: true });
  const statePath = path.join(outDir, "state.json");
  if (fs.existsSync(statePath)) {
    return { outDir, statePath, state: JSON.parse(fs.readFileSync(statePath, "utf8")) };
  }
  const state = {
    pages,
    done: {},
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  return { outDir, statePath, state };
}

function saveState(statePath, state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function summarizeOnly(runId) {
  const outDir = path.join(OUT_ROOT, `report-${runId}`);
  if (!fs.existsSync(outDir)) {
    console.error(`Report dir not found: ${outDir}`);
    process.exit(1);
  }
  const jsons = fs.readdirSync(outDir).filter((f) => f.endsWith(".json"));
  const results = [];
  for (const file of jsons) {
    const data = parseResult(path.join(outDir, file));
    results.push({ ...data, path: file.replace(".report.json", "").replace(/_/g, "/").replace(".report", "") });
  }
  const timestamp = runId;
  const summaryPath = writeSummary(results, outDir, timestamp);
  console.log(`Summary written: ${summaryPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const summarizeFlag = args.includes("--summarize");
  const runId = process.env.LH_RUN_ID || new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
  if (summarizeFlag) {
    summarizeOnly(runId);
    return;
  }

  const pages = listHtml();
  const { outDir, statePath, state } = loadState(runId, pages);

  const pending = state.pages.filter((p) => !state.done[p]);
  if (!pending.length && !state.finishedAt) {
    state.finishedAt = new Date().toISOString();
    saveState(statePath, state);
  }
  if (!pending.length) {
    console.log("Nothing to do, all pages done.");
    const summaryPath = writeSummary(
      state.pages
        .map((p) => {
          const jsonPath = path.join(outDir, `${safeName(p)}.report.json`);
          if (!fs.existsSync(jsonPath)) return null;
          const data = parseResult(jsonPath);
          return { ...data, path: p };
        })
        .filter(Boolean),
      outDir,
      runId
    );
    console.log(`Summary: ${summaryPath}`);
    return;
  }

  const server = startServer();
  await new Promise((res) => setTimeout(res, 1000));

  try {
    for (const rel of pending) {
      let success = false;
      let attempts = 0;
      while (!success && attempts < MAX_RETRIES) {
        attempts += 1;
        try {
          const url = `${BASE_URL}/${rel}`;
          const base = path.join(outDir, safeName(rel));
          const jsonPath = runLighthouse(url, base);
          const data = parseResult(jsonPath);
          state.done[rel] = { ok: true, attempts, report: path.basename(jsonPath) };
          success = true;
          console.log(`Audited: ${rel}`);
        } catch (err) {
          console.warn(`Retry ${attempts} for ${rel}: ${err.message}`);
          if (attempts >= MAX_RETRIES) {
            state.done[rel] = { ok: false, error: err.message };
          }
        }
        saveState(statePath, state);
      }
    }
  } finally {
    server.kill("SIGTERM");
  }

  const complete = state.pages.every((p) => state.done[p] && state.done[p].ok);
  if (complete && !state.finishedAt) {
    state.finishedAt = new Date().toISOString();
    saveState(statePath, state);
  }

  const results = state.pages
    .map((p) => {
      const jp = path.join(outDir, `${safeName(p)}.report.json`);
      if (!fs.existsSync(jp)) return null;
      const data = parseResult(jp);
      return { ...data, path: p };
    })
    .filter(Boolean);

  const summaryPath = writeSummary(results, outDir, runId);
  console.log(`Auditoitu sivuja: ${results.length}/${state.pages.length}`);
  console.log(`Raporttikansio: ${outDir}`);
  const worst = [...results].filter((r) => r.performance != null).sort((a, b) => a.performance - b.performance).slice(0, 5);
  console.log("5 huonointa (perf):");
  worst.forEach((r) => console.log(`- ${r.path}: ${formatScore(r.performance)}`));
  if (!complete) {
    const missing = state.pages.filter((p) => !state.done[p] || !state.done[p].ok);
    console.log("INCOMPLETE:", missing.join(", "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
