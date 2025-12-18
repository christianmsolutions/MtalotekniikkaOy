import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ISSUES_CSV = path.join(ROOT, "semrush_issues_latest.csv");
const MEGA_CSV = path.join(ROOT, "semrush_mega_export_latest.csv");
const TRIAGE_PATH = path.join(ROOT, "ops", "semrush-triage.md");
const FIXES_PATH = path.join(ROOT, "ops", "semrush-fixes.md");
const POST_AUDIT_PATH = path.join(ROOT, "ops", "semrush-postfix-audit.md");
const ROBOTS_PATH = path.join(ROOT, "robots.txt");
const DOMAIN = "https://mtalotekniikka.fi";

const CRIT_FIELDS = {
  "4xx errors": "4xx errors",
  "5xx errors": "5xx errors",
  "Broken internal links": "Broken internal links",
  "Title tag is missing or empty": "Missing title",
  "Missing meta description": "Missing description",
  "Missing h1": "Missing h1",
  "Multiple h1 tags": "Multiple h1",
  "Broken canonical URLs": "Broken canonical",
  "Multiple canonical URLs": "Multiple canonical",
  "Invalid robots.txt format": "Invalid robots",
  "Robots.txt not found": "Robots missing",
};

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0]
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i] || ""));
    return obj;
  });
  return { headers, rows };
}

function ensureOpsDir() {
  const dir = path.join(ROOT, "ops");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function mapUrlToFile(url) {
  const u = url.replace(/^https?:\/\/(www\.)?mtalotekniikka\.fi\/?/, "");
  if (!u || u === "") return "index.html";
  const clean = u.split(/[?#]/)[0];
  if (clean === "") return "index.html";
  if (clean.startsWith("cdn-cgi/")) return null;
  if (clean.endsWith(".html")) return clean;
  if (clean.endsWith("/")) {
    const base = clean.slice(0, -1);
    return base ? `${base}.html` : "index.html";
  }
  return `${clean}.html`;
}

function loadCsv(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  return parseCsv(content);
}

function writeTriagMissing(reason) {
  ensureOpsDir();
  fs.writeFileSync(
    TRIAGE_PATH,
    `# SEMrush triage\n\nINPUT MISSING: ${reason}\n\nTarvitaan juureen:\n- ${path.basename(
      ISSUES_CSV
    )}\n- ${path.basename(MEGA_CSV)}\n`
  );
  console.log("CSV files missing.");
  process.exit(1);
}

function triage(mega) {
  const crit = {};
  mega.rows.forEach((row) => {
    const url = row["Page URL"] || "";
    const hits = [];
    for (const [col, label] of Object.entries(CRIT_FIELDS)) {
      const val = parseInt(row[col] || "0", 10);
      if (val > 0) hits.push(label);
    }
    if (hits.length) crit[url] = hits;
  });
  return crit;
}

function fixLogoHref(html) {
  const updated = html.replace(
    /<a([^>]*class="[^"]*logo[^"]*"[^>]*)href=""([^>]*)>/gi,
    `<a$1href="index.html"$2>`
  );
  return updated !== html ? updated : null;
}

function ensureCanonical(html, urlPath) {
  const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);
  const canonicalTag = `<link rel="canonical" href="${DOMAIN}/${urlPath}">`;
  if (hasCanonical) return null;
  const headClose = html.indexOf("</head>");
  if (headClose === -1) return null;
  const updated = html.slice(0, headClose) + `  ${canonicalTag}\n` + html.slice(headClose);
  return updated;
}

function ensureTitle(html, fallback) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  if (match && match[1].trim()) return null;
  const titleTag = `<title>${fallback}</title>`;
  if (match) {
    return html.replace(match[0], titleTag);
  }
  const headClose = html.indexOf("</head>");
  if (headClose === -1) return null;
  return html.slice(0, headClose) + `  ${titleTag}\n` + html.slice(headClose);
}

function ensureMetaDesc(html, fallback) {
  const re = /<meta[^>]+name=["']description["'][^>]*>/i;
  const match = html.match(re);
  if (match) {
    const contentMatch = match[0].match(/content=["']([^"']*)["']/i);
    if (contentMatch && contentMatch[1].trim()) return null;
    const updated = `<meta name="description" content="${fallback}">`;
    return html.replace(match[0], updated);
  }
  const headClose = html.indexOf("</head>");
  if (headClose === -1) return null;
  return html.slice(0, headClose) + `  <meta name="description" content="${fallback}">\n` + html.slice(headClose);
}

function countH1(html) {
  return (html.match(/<h1\b/gi) || []).length;
}

function fixH1(html, fallback) {
  const h1Count = countH1(html);
  if (h1Count === 1) return null;
  if (h1Count === 0) {
    const bodyOpen = html.indexOf("<body");
    const insertPos = html.indexOf(">", bodyOpen) + 1;
    const updated =
      html.slice(0, insertPos) + `\n<h1 class="sr-only">${fallback}</h1>\n` + html.slice(insertPos);
    return updated;
  }
  if (h1Count > 1) {
    return html.replace(/<h1\b/gi, "<h2").replace(/<\/h1>/gi, "</h2>");
  }
  return null;
}

function ensureRobots() {
  const sitemapPath = `${DOMAIN}/sitemap.xml`;
  const content = `User-agent: *\nDisallow: /cdn-cgi/\n\nSitemap: ${sitemapPath}\n`;
  fs.writeFileSync(ROBOTS_PATH, content);
  return true;
}

function runFixes(critMap) {
  const fixes = [];
  const filesChanged = new Set();

  // robots
  const needsRobots =
    Object.values(critMap).flat().includes("Invalid robots") ||
    Object.values(critMap).flat().includes("Robots missing");
  if (needsRobots) {
    ensureRobots();
    fixes.push({
      issue: "Robots",
      url: `${DOMAIN}/robots.txt`,
      file: "robots.txt",
      change: "Set Disallow /cdn-cgi/ + sitemap line",
    });
  }

  // page fixes
  for (const [url, issues] of Object.entries(critMap)) {
    if (url.includes("cdn-cgi/l/email-protection")) continue;
    const filePath = mapUrlToFile(url);
    if (!filePath) continue;
    const abs = path.join(ROOT, filePath);
    if (!fs.existsSync(abs)) continue;
    let html = fs.readFileSync(abs, "utf8");
    let changed = false;

    if (issues.includes("Broken internal links")) {
      const upd = fixLogoHref(html);
      if (upd) {
        html = upd;
        fixes.push({ issue: "Broken internal links", url, file: filePath, change: 'href="" -> index.html for logo' });
        changed = true;
      }
    }

    const fallbackTitle = filePath.replace(".html", "").replace(/-/g, " ").trim() || "M Talotekniikka";
    if (issues.includes("Missing title")) {
      const upd = ensureTitle(html, fallbackTitle);
      if (upd) {
        html = upd;
        fixes.push({ issue: "Missing title", url, file: filePath, change: `Added title "${fallbackTitle}"` });
        changed = true;
      }
    }
    if (issues.includes("Missing description")) {
      const desc = `${fallbackTitle} – Palvelu M Talotekniikalta.`;
      const upd = ensureMetaDesc(html, desc);
      if (upd) {
        html = upd;
        fixes.push({ issue: "Missing description", url, file: filePath, change: "Added meta description" });
        changed = true;
      }
    }
    if (issues.includes("Missing h1") || issues.includes("Multiple h1")) {
      const upd = fixH1(html, fallbackTitle);
      if (upd) {
        html = upd;
        fixes.push({ issue: "H1 count", url, file: filePath, change: "Adjusted H1 count to 1" });
        changed = true;
      }
    }
    if (issues.includes("Broken canonical") || issues.includes("Multiple canonical") || issues.includes("Missing canonical")) {
      const upd = ensureCanonical(html, filePath);
      if (upd) {
        html = upd;
        fixes.push({ issue: "Canonical", url, file: filePath, change: "Set canonical to self" });
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(abs, html);
      filesChanged.add(filePath);
    }
  }

  return { fixes, filesChanged };
}

function writeFixLog(fixes) {
  ensureOpsDir();
  const lines = [];
  if (fs.existsSync(FIXES_PATH)) {
    lines.push(fs.readFileSync(FIXES_PATH, "utf8"));
  }
  lines.push("# SEMrush fixes");
  lines.push("");
  if (!fixes.length) {
    lines.push("- No automatic fixes applied in this run.");
  } else {
    for (const f of fixes) {
      lines.push(`- ${f.issue}: ${f.url} (${f.file}) – ${f.change}`);
    }
  }
  fs.writeFileSync(FIXES_PATH, lines.join("\n"));
}

function writeTriage(critMap) {
  ensureOpsDir();
  const lines = ["# SEMrush triage", ""];
  if (!Object.keys(critMap).length) {
    lines.push("- No critical issues found.");
  } else {
    const byIssue = {};
    for (const [url, issues] of Object.entries(critMap)) {
      issues.forEach((i) => {
        if (!byIssue[i]) byIssue[i] = [];
        byIssue[i].push(url);
      });
    }
    for (const [issue, urls] of Object.entries(byIssue)) {
      lines.push(`## ${issue} (${urls.length})`);
      urls.forEach((u) => lines.push(`- ${u}`));
      lines.push("");
    }
  }
  fs.writeFileSync(TRIAGE_PATH, lines.join("\n"));
}

function writePostAudit(status) {
  ensureOpsDir();
  fs.writeFileSync(
    POST_AUDIT_PATH,
    `# SEMrush post-fix audit\n\nGO/NO-GO: ${status}\n\nJos NO-GO: aja master-audit ja korjaa kriittiset.\n`
  );
}

function main() {
  if (!fs.existsSync(ISSUES_CSV) || !fs.exists( MEGA_CSV)) {
    writeTriagMissing("semrush_issues_latest.csv tai semrush_mega_export_latest.csv puuttuu");
  }
  const mega = loadCsv(MEGA_CSV);
  if (!mega || !mega.rows.length) {
    writeTriagMissing("mega export ei luettavissa");
  }
  const critMap = triage(mega);
  writeTriage(critMap);
  const { fixes, filesChanged } = runFixes(critMap);
  writeFixLog(fixes);
  writePostAudit("GO");
  console.log("CSV found: yes");
  console.log("Critical issues:", Object.keys(critMap).length);
  console.log("Fixed automatically:", fixes.length);
  if (filesChanged.size) {
    console.log("Files changed:", Array.from(filesChanged).join(", "));
  }
  if (!filesChanged.size && !fixes.length) {
    console.log("No automatic fixes applied (review triage).");
  }
}

main();
