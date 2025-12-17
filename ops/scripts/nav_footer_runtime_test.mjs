import { chromium } from "playwright";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const serverPort = 4173;
const baseURL = `http://127.0.0.1:${serverPort}`;

async function listHtmlFiles() {
  const { spawnSync } = await import("child_process");
  const res = spawnSync("find", [
    ".",
    "-type",
    "f",
    "-name",
    "*.html",
    "-not",
    "-path",
    "./node_modules/*",
    "-not",
    "-path",
    "./.git/*",
    "-not",
    "-path",
    "./SITE/*",
  ]);
  return res.stdout
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((p) => p.replace(/^\.\//, ""));
}

function startServer() {
  const proc = spawn("python3", ["-m", "http.server", `${serverPort}`, "--bind", "127.0.0.1"], {
    cwd: root,
    stdio: "ignore",
  });
  return proc;
}

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function isInternalHref(href) {
  return (
    href &&
    !href.startsWith("http") &&
    !href.startsWith("mailto:") &&
    !href.startsWith("tel:") &&
    !href.startsWith("javascript:")
  );
}

async function checkFooterLinks(context, pageUrl, hrefs) {
  const request = context.request;
  const internal = hrefs.filter((h) => isInternalHref(h) && !h.startsWith("#") && h.endsWith(".html"));
  const results = [];
  for (const href of internal.slice(0, 5)) {
    const target = new URL(href, pageUrl).toString();
    try {
      const res = await request.get(target);
      if (!res.ok()) {
        results.push(`footer link 404: ${href} (${res.status()})`);
      }
    } catch (e) {
      results.push(`footer link error: ${href} (${e.message})`);
    }
  }
  return results;
}

async function run() {
  const report = [];
  const htmlFiles = await listHtmlFiles();
  const server = startServer();
  await wait(1000);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  for (const relPath of htmlFiles) {
    const url = `${baseURL}/${relPath}`;
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const result = { page: relPath, status: "PASS", details: [], skip: false };

    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (!resp || !resp.ok()) {
        result.status = "FAIL";
        result.details.push(`page load failed (${resp ? resp.status() : "no response"})`);
      }

      const headerEl = await page.$("header");
      const footerEl = await page.$("footer");
      const navContainer = await page.$("header nav, header .nav");
      const isStandard = !!headerEl && !!footerEl && !!navContainer;

      if (!isStandard) {
        result.status = "SKIP";
        const reasons = [];
        if (!headerEl) reasons.push("missing header");
        if (!footerEl) reasons.push("missing footer");
        if (headerEl && !navContainer) reasons.push("nav container missing");
        result.details.push(`non-standard layout (${reasons.join(", ") || "unknown"})`);
      } else {
        const navLinks = await page.$$("header a");
        if (!navLinks.length) {
          result.status = "FAIL";
          result.details.push("nav missing");
        }

        const vik = await page.$("header a:has-text('Vikapalvelu')");
        if (vik) {
          const href = await vik.getAttribute("href");
          if (!href || !href.endsWith("sahkotyot.html")) {
            result.status = "FAIL";
            result.details.push(`Vikapalvelu href not hub (${href || "missing"})`);
          }
        } else {
          result.status = "FAIL";
          result.details.push("Vikapalvelu link missing");
        }

        const dropdownContainer = await page.$(
          "header [class*='dropdown'], header [data-dropdown], header [aria-haspopup='true']"
        );
        if (dropdownContainer) {
          const dropdownLinks = await page.$$eval(
            "header [class*='dropdown'] a, header [data-dropdown] a, header [aria-haspopup='true'] a",
            (els) => els.map((a) => a.getAttribute("href") || "")
          );
          if (!dropdownLinks.length) {
            result.status = "FAIL";
            result.details.push("dropdown present but links missing");
          }
        } else {
          result.details.push("dropdown: not present");
        }

        if (!footerEl) {
          result.status = "FAIL";
          result.details.push("footer missing");
        } else {
          const footerLinks = await page.$$eval("footer a", (els) =>
            els.map((a) => a.getAttribute("href") || "")
          );
          const footerIssues = await checkFooterLinks(context, url, footerLinks);
          if (footerIssues.length) {
            result.status = "FAIL";
            result.details.push(...footerIssues);
          }
        }

        if (consoleErrors.length) {
          result.status = "FAIL";
          result.details.push(`console errors: ${consoleErrors.join(" | ")}`);
        }
      }
    } catch (err) {
      result.status = "FAIL";
      result.details.push(`exception: ${err.message}`);
    } finally {
      await page.close();
    }
    report.push(result);
  }

  await browser.close();
  server.kill("SIGTERM");

  const lines = ["# Nav & footer runtime test (Playwright)", ""];
  lines.push("| Sivu | Status | Huomiot |");
  lines.push("|---|---|---|");
  for (const r of report) {
    lines.push(`| ${r.page} | ${r.status} | ${r.details.join("; ") || ""} |`);
  }

  const passCount = report.filter((r) => r.status === "PASS").length;
  const failCount = report.filter((r) => r.status === "FAIL").length;
  const skipCount = report.filter((r) => r.status === "SKIP").length;

  const failGroups = {};
  for (const r of report.filter((r) => r.status === "FAIL")) {
    for (const d of r.details) {
      const key = d.split(":")[0];
      if (!failGroups[key]) failGroups[key] = [];
      failGroups[key].push(r.page);
    }
  }

  lines.push("", "## Yhteenveto");
  lines.push(`- Sivut yhteensä: ${report.length}`);
  lines.push(`- PASS: ${passCount}`);
  lines.push(`- FAIL: ${failCount}`);
  lines.push(`- SKIP: ${skipCount}`);

  if (failCount) {
    lines.push("", "### Fail-sivut syittäin");
    for (const [reason, pages] of Object.entries(failGroups)) {
      lines.push(`- ${reason}: ${pages.join(", ")}`);
    }
  }

  if (skipCount) {
    lines.push("", "### Skip-sivut");
    for (const r of report.filter((r) => r.status === "SKIP")) {
      lines.push(`- ${r.page}: ${r.details.join("; ")}`);
    }
  }

  await fs.writeFile(path.join(root, "ops", "nav-footer-runtime-report.md"), lines.join("\n"));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
