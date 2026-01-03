# Google Ads Readiness Audit — MTalotekniikka

Scope (pages checked):
- `index.html` (home)
- `sahkotyot.html`
- `lvi.html`
- `lampopumppu-asennus.html`
- `vikapalvelu.html`
- `vikapalvelu-tampere.html`
- `yhteystiedot.html`
- `kiitos.html`
- `assets/js/main.js`

## 1) Executive Summary
**Status: NOT READY for full-scale lead-gen ads.**

Critical blockers (must-fix before ads):
- **Consent not enforced for analytics**: cookie banner does not control GA/GTM. For EU lead-gen, consent-mode or proper gating is required.
- **Conversion tracking not reliably tied to successful submit**: only `index.html` redirects to `kiitos.html`. Other forms do not redirect and there is no visible generate_lead guard.

High-impact fixes:
- Add redirect + botcheck to **all lead forms** (LVI + Yhteystiedot) to ensure consistent conversions.
- Add phone/email click tracking (via GTM or dataLayer) to capture primary lead actions.
- Remove invalid HTML `</footer>r&gt;` artifacts in multiple pages (validity/hygiene).

Nice-to-haves:
- Add smaller responsive variants for homepage service card images (reduce wasted bytes).
- Normalize conversion flow (thank-you page with query param + GTM trigger guard).


## 2) Scores (0–100)
| Category | Score | Notes |
|---|---:|---|
| A) Tracking & Measurement | **55** | GTM present, no duplicate gtag. Missing form_submit/generate_lead rules and no consent gating. |
| B) Conversion UX | **65** | Strong phone CTAs, but only one form redirects to thank-you. Some landings lack forms. |
| C) Mobile UX & Layout | **75** | Header/hero fixes in place. No obvious horizontal scroll in audited pages. |
| D) Page Speed / Performance | **70** | LCP hero optimized, but large card images (900w/1800w) used at ~320px. |
| E) Landing Relevance & Message Match | **70** | H1s match services with Pirkanmaa/Tampere. Some hubs lack explicit lead form. |
| F) Compliance & Trust | **55** | Privacy policy exists, but consent does not gate analytics. |
| G) Technical Hygiene | **60** | Canonicals consistent (clean URLs). Invalid `</footer>r&gt;` present in multiple files. |

**Total readiness score:** **64/100**


## 3) Findings by Category (with evidence)

### A) Tracking & Measurement
**PASS**
- GTM is present once per page (head + noscript).
  - Example: `index.html` lines 5–13 and 110–113.

**GAPS**
- No visible `dataLayer.push` events for `generate_lead`, `form_submit`, `form_start`.
- No evidence of click tracking for `tel:` / `mailto:`.
- Consent banner only sets localStorage (`assets/js/main.js`), but does not gate GA/GTM.

**Evidence:**
- Cookie banner logic: `assets/js/main.js` lines ~203–232.

### B) Conversion UX
- `index.html` form uses Web3Forms and **redirects to `kiitos.html`** (good).
- `lvi.html` and `yhteystiedot.html` forms **do not redirect**, so conversion is harder to measure.
- Several landing pages rely on “Ota yhteyttä” or phone CTA; this is acceptable but lowers form conversion rate.

**Evidence:**
- `index.html` form includes `redirect` + `botcheck`.
- `lvi.html` form has no `redirect`, no `botcheck`.
- `yhteystiedot.html` form has no `redirect`, no `botcheck`.

### C) Mobile UX & Layout
- Header, hero, and overflow fixes exist in CSS; no immediate overflow in audited pages.
- Some pages still contain inline layout changes but not blockers.

### D) Performance
- Hero images use responsive sources (good).
- Homepage service card images use **900w hero assets** for ~320px cards, causing wasted bytes.
  - Example from `index.html`: LVI card uses `/images/optimized/lvi/hero/lvi-hero-mobile-900.webp` with `sizes="320px"` (still loads 900w).

### E) Landing Relevance & Message Match
- H1s match service + location (Pirkanmaa/Tampere).
  - `sahkotyot.html`: “Sähkötyöt… Pirkanmaalla”
  - `lvi.html`: “LVI-palvelut… Pirkanmaalla”
  - `lampopumppu-asennus.html`: “Lämpöpumput… Pirkanmaalla”
- Some hub pages lack inline form; consider adding a short form or above-the-fold lead module for ads.

### F) Compliance & Trust
- Privacy policy present (`tietosuoja.html`).
- Cookie banner **does not gate analytics**; no consent mode.

### G) Technical Hygiene
- Canonicals are consistent (clean URLs) across key pages.
- Invalid HTML trailing fragment appears after `</footer>`:
  - `</footer>r&gt;` found in multiple audited pages.


## 4) Recommended Changes (ordered by impact)

**Critical**
1) Implement GDPR consent gating for analytics (GTM Consent Mode). Ensure GA4 only fires after consent.
2) Standardize conversion tracking on **successful submit** using `kiitos.html` + query param + GTM trigger.

**High-impact**
3) Add `redirect` + `botcheck` to all lead forms.
4) Add tel/mailto click tracking (via GTM or a minimal dataLayer push in JS).
5) Remove invalid `</footer>r&gt;` fragments.

**Nice-to-have**
6) Generate smaller card image variants (320/480/640) and update srcset to reduce wasted bytes.


## 5) Diffs (proposed — NOT applied)

### A) Add redirect + botcheck to LVI form (`lvi.html`)
```diff
diff --git a/lvi.html b/lvi.html
@@
-<form action="https://api.web3forms.com/submit" class="form" method="POST">
-<input name="access_key" type="hidden" value="e5f42baa-7adc-4683-8973-83de632ee3b1"/>
+<form action="https://api.web3forms.com/submit" class="form" method="POST">
+<input name="access_key" type="hidden" value="e5f42baa-7adc-4683-8973-83de632ee3b1"/>
+<input name="redirect" type="hidden" value="https://mtalotekniikka.fi/kiitos.html?src=form"/>
+<input autocomplete="off" class="sr-only" name="botcheck" tabindex="-1" type="checkbox"/>
```

### B) Add redirect + botcheck to Contact form (`yhteystiedot.html`)
```diff
diff --git a/yhteystiedot.html b/yhteystiedot.html
@@
-<form action="https://api.web3forms.com/submit" class="form" method="POST">
-<input name="access_key" type="hidden" value="e5f42baa-7adc-4683-8973-83de632ee3b1"/>
-<input name="subject" type="hidden" value="Yhteydenotto verkkosivuilta"/>
+<form action="https://api.web3forms.com/submit" class="form" method="POST">
+<input name="access_key" type="hidden" value="e5f42baa-7adc-4683-8973-83de632ee3b1"/>
+<input name="subject" type="hidden" value="Yhteydenotto verkkosivuilta"/>
+<input name="redirect" type="hidden" value="https://mtalotekniikka.fi/kiitos.html?src=form"/>
+<input autocomplete="off" class="sr-only" name="botcheck" tabindex="-1" type="checkbox"/>
```

### C) Add tel/mailto click tracking (`assets/js/main.js`)
```diff
diff --git a/assets/js/main.js b/assets/js/main.js
@@
   function initCookieBanner() {
@@
   }
+
+  function initClickTracking() {
+    if (!window.dataLayer) window.dataLayer = [];
+
+    const track = (type, value) => {
+      window.dataLayer.push({
+        event: "contact_click",
+        contact_type: type,
+        contact_value: value,
+      });
+    };
+
+    qsa("a[href^='tel:']").forEach((link) => {
+      link.addEventListener("click", () => {
+        track("tel", link.getAttribute("href").replace("tel:", ""));
+      });
+    });
+
+    qsa("a[href^='mailto:']").forEach((link) => {
+      link.addEventListener("click", () => {
+        track("mailto", link.getAttribute("href").replace("mailto:", ""));
+      });
+    });
+  }
@@
-  initCookieBanner();
+  initCookieBanner();
+  initClickTracking();
```

### D) Remove invalid HTML trailing fragment (`</footer>r&gt;`) in audited pages
```diff
diff --git a/sahkotyot.html b/sahkotyot.html
@@
-</footer>r&gt;
+</footer>
```
```diff
diff --git a/lvi.html b/lvi.html
@@
-</footer>r&gt;
+</footer>
```
```diff
diff --git a/lampopumppu-asennus.html b/lampopumppu-asennus.html
@@
-</footer>r&gt;
+</footer>
```
```diff
diff --git a/vikapalvelu-tampere.html b/vikapalvelu-tampere.html
@@
-</footer>r&gt;
+</footer>
```
```diff
diff --git a/yhteystiedot.html b/yhteystiedot.html
@@
-</footer>r&gt;
+</footer>
```
```diff
diff --git a/kiitos.html b/kiitos.html
@@
-</footer>r&gt;
+</footer>
```


## 6) Next Best Steps Checklist (Ads Launch)
- [ ] Implement Consent Mode in GTM (analytics_storage/ads_storage gating).
- [ ] Configure GA4 conversion: `generate_lead` fires ONLY on `/kiitos.html?src=form`.
- [ ] Add redirects + botcheck on all Web3Forms.
- [ ] Add tel/mailto click tracking (GTM trigger or dataLayer script).
- [ ] Remove `</footer>r&gt;` from all pages.
- [ ] Optional: add compact lead form to `sahkotyot.html` and `lampopumppu-asennus.html` for higher conversion.

