#!/usr/bin/env node
import { chromium } from 'playwright';

const GTM_ID = 'GTM-M7TR54Z4';
const TARGETS = [
  'https://mtalotekniikka.fi/',
  'https://mtalotekniikka.fi/lvi.html',
  'https://mtalotekniikka.fi/vikapalvelu.html',
];

const GA_COLLECT_REGEX = /https:\/\/([a-z0-9.-]+\.)?google-analytics\.com\/g\/collect/i;
const GA_ALL_REGEX = /https:\/\/([a-z0-9.-]+\.)?google-analytics\.com\//i;
const GA_REGION_REGEX = /https:\/\/([a-z0-9.-]+\.)?region1\.google-analytics\.com\//i;
const GTAG_JS_NET_REGEX = /https:\/\/www\.googletagmanager\.com\/gtag\/js/i;
const DIRECT_GTAG_SCRIPT_REGEX = /<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[^"'>]*["'][^>]*>/i;
const UA_REGEX = /UA-\d{4,}-\d+/i;

const STATUS_OK = (status) => status === 200 || status === 204 || status === 304;

const analyzePage = async (browser, url) => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const requests = [];
  const responses = [];
  const failed = [];
  const blockedUrls = [];
  const gtagNetworkUrls = [];

  page.on('requestfinished', (req) => requests.push(req));
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    const url = req.url();
    failed.push({ url, error: failure });
    if (
      GA_ALL_REGEX.test(url) ||
      GA_REGION_REGEX.test(url) ||
      GTAG_JS_NET_REGEX.test(url) ||
      url.includes('gtag/js')
    ) {
      blockedUrls.push({ url, errorText: failure ? failure.errorText : 'unknown' });
    }
  });
  page.on('response', (res) => responses.push(res));

  const result = {
    url,
    gtmDom: false,
    gtmNoscript: false,
    gtmNetwork: false,
    gtmBlocked: false,
    gaRequests: 0,
    gaBlocked: false,
    duplicateGtag: false,
    uaDetected: false,
    duplicatePageView: false,
    telMailtoClicks: {
      tel: { fired: false, newGa: 0 },
      mailto: { fired: false, newGa: 0 },
    },
  };

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const html = await page.content();

  // DOM checks
  result.gtmDom = html.includes(`gtm.js?id=${GTM_ID}`);
  result.gtmNoscript = html.includes(`ns.html?id=${GTM_ID}`);
  const directScriptMatch = html.match(DIRECT_GTAG_SCRIPT_REGEX);
  const directScriptUrl = directScriptMatch ? directScriptMatch[0] : '';
  result.directGtagSnippet =
    directScriptMatch && !/gtm=/i.test(directScriptUrl); // treat as direct only if no gtm param
  result.uaDetected = UA_REGEX.test(html);

  // Network checks
  const gtmResponse = responses.find((res) => res.url().includes(`googletagmanager.com/gtm.js?id=${GTM_ID}`));
  if (gtmResponse) {
    const status = gtmResponse.status();
    result.gtmNetwork = STATUS_OK(status);
    result.gtmBlocked = !STATUS_OK(status);
  } else if (failed.find((f) => f.url.includes(`gtm.js?id=${GTM_ID}`))) {
    result.gtmBlocked = true;
  }

  const gaCollectResponses = responses.filter((res) => GA_COLLECT_REGEX.test(res.url()));
  result.gaRequests = gaCollectResponses.length;
  result.gaBlocked = gaCollectResponses.some((res) => !STATUS_OK(res.status()));
  result.duplicatePageView = gaCollectResponses.length > 1;
  result.blockedGa = blockedUrls;
  const gtagNet = responses.filter((res) => GTAG_JS_NET_REGEX.test(res.url()));
  result.gtagJsNetworkLoaded = gtagNet.length > 0;
  result.gtagNetworkUrls = gtagNet.slice(0, 3).map((r) => r.url());
  result.gaCollectUrls = gaCollectResponses.slice(0, 3).map((r) => r.url());

  // Tel/Mailto click test
  const gaBefore = result.gaRequests;
  const telHandle = await page.$('a[href^="tel:"]');
  if (telHandle) {
    await telHandle.evaluate((el) => {
      el.addEventListener('click', (e) => e.preventDefault(), { once: true });
      el.click();
    });
    await page.waitForTimeout(2000);
    const newGa = responses.filter((res) => GA_COLLECT_REGEX.test(res.url())).length - gaBefore;
    result.telMailtoClicks.tel = { fired: true, newGa };
  }

  const gaAfterTel = responses.filter((res) => GA_COLLECT_REGEX.test(res.url())).length;
  const mailHandle = await page.$('a[href^="mailto:"]');
  if (mailHandle) {
    await mailHandle.evaluate((el) => {
      el.addEventListener('click', (e) => e.preventDefault(), { once: true });
      el.click();
    });
    await page.waitForTimeout(2000);
    const newGa = responses.filter((res) => GA_COLLECT_REGEX.test(res.url())).length - gaAfterTel;
    result.telMailtoClicks.mailto = { fired: true, newGa };
  }

  await context.close();
  return result;
};

const statusLabel = (flag, warn = false) => {
  if (flag === true) return 'PASS';
  if (warn) return 'WARN';
  return 'FAIL';
};

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const url of TARGETS) {
    try {
      results.push(await analyzePage(browser, url));
    } catch (e) {
      results.push({ url, error: e.message || String(e) });
    }
  }
  await browser.close();

  for (const r of results) {
    if (r.error) {
      console.log(`\n${r.url}\n  ERROR: ${r.error}`);
      continue;
    }
    console.log(`\n${r.url}`);
    console.log(`  GTM DOM snippet: ${statusLabel(r.gtmDom)}`);
    console.log(`  GTM noscript:    ${statusLabel(r.gtmNoscript)}`);
    console.log(`  GTM network:     ${r.gtmBlocked ? 'FAIL' : r.gtmNetwork ? 'PASS' : 'FAIL'}`);
    console.log(`  GA4 collect:     ${r.gaRequests > 0 && !r.gaBlocked ? 'PASS' : 'FAIL'} (count=${r.gaRequests})`);
    if (r.gaCollectUrls && r.gaCollectUrls.length) {
      r.gaCollectUrls.forEach((u) => console.log(`    ga4 collect: ${u}`));
    }
    console.log(`  Duplicate page_view suspect: ${r.duplicatePageView ? 'WARN' : 'PASS'}`);
    console.log(`  directGtagSnippetInHtml: ${r.directGtagSnippet ? 'FAIL' : 'PASS'}`);
    if (r.gtagJsNetworkLoaded && !r.directGtagSnippet) {
      console.log('  gtagJsNetworkLoaded:     PASS (via GTM-managed Google tag expected)');
    } else if (r.gtagJsNetworkLoaded && r.directGtagSnippet) {
      console.log('  gtagJsNetworkLoaded:     FAIL (network + direct snippet = duplicate risk)');
    } else {
      console.log('  gtagJsNetworkLoaded:     PASS (not seen)');
    }
    if (r.gtagNetworkUrls && r.gtagNetworkUrls.length) {
      r.gtagNetworkUrls.forEach((u) => console.log(`    gtag url: ${u}`));
    }
    console.log(`  UA detected:     ${r.uaDetected ? 'WARN' : 'PASS'}`);
    if (r.blockedGa && r.blockedGa.length) {
      console.log(`  GA blocked?:     FAIL (possible)`);
      r.blockedGa.forEach((b) => console.log(`    - ${b.url} (${b.errorText || 'blocked'})`));
    }
    console.log(
      `  Tel click GA:    ${
        r.telMailtoClicks.tel.fired
          ? r.telMailtoClicks.tel.newGa > 0
            ? 'PASS'
            : 'WARN'
          : 'WARN'
      }`,
    );
    console.log(
      `  Mailto click GA: ${
        r.telMailtoClicks.mailto.fired
          ? r.telMailtoClicks.mailto.newGa > 0
            ? 'PASS'
            : 'WARN'
          : 'WARN'
      }`,
    );
  }

  const summary = {
    gtmInstalled: results.every((r) => r.error || (r.gtmDom && r.gtmNoscript)),
    gtmNetwork: results.every((r) => r.error || (r.gtmNetwork && !r.gtmBlocked)),
    gaObserved: results.every((r) => r.error || r.gaRequests > 0),
    directSnippet: results.some((r) => r.directGtagSnippet),
    ua: results.some((r) => r.uaDetected),
  };

  console.log('\n=== SUMMARY ===');
  console.log(`GTM installed (DOM + noscript): ${summary.gtmInstalled ? 'PASS' : 'FAIL'}`);
  console.log(`GTM network OK:                 ${summary.gtmNetwork ? 'PASS' : 'FAIL'}`);
  console.log(`GA4 collect observed:           ${summary.gaObserved ? 'PASS' : 'FAIL'}`);
  console.log(`Direct gtag snippet detected:   ${summary.directSnippet ? 'FAIL' : 'PASS'}`);
  console.log(`UA detected:                    ${summary.ua ? 'WARN' : 'PASS'}`);
  console.log('================\n');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
