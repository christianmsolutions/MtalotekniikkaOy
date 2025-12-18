# SEMrush pipeline (local)

Tarvittavat tiedostot projektin juureen:
- `semrush_issues_latest.csv`
- `semrush_mega_export_latest.csv`
- (valinnainen) `semrush_compare_audits_latest.csv` (ei vielä käytössä)

Käyttö:
```
node ops/scripts/semrush_pipeline.mjs
```

Mitä skripti tekee:
- Lukee issues- ja mega-export CSV:t (input puuttuessa triage kertoo puutteesta ja prosessi päättyy exit 1).
- Suodattaa kriittiset (4xx/5xx, broken internal links, missing/empty title/description, H1-count ≠ 1, canonical puuttuu/väärä, robots puuttuu/virhe).
- Kirjoittaa triagen: `ops/semrush-triage.md`.
- Tekee automaattikorjaukset (vain yksiselitteiset):
  - Tyhjä logo-href (`href=""`) → `href="index.html"`.
  - Lisää/korjaa robots.txt (Disallow /cdn-cgi/, Sitemap-domain).
  - Lisää puuttuvat title/description (kevyt fallback), canonical (itseensä), H1-count (lisää sr-only tai alentaa ylimääräiset H2:ksi) jos kriittinen.
- Kirjaa korjaukset: `ops/semrush-fixes.md`.
- Kirjoittaa post-audit-muistutuksen: `ops/semrush-postfix-audit.md` (aja teidän master-audit käsin).

Ei korjaa automaattisesti:
- Alt-tekstit, minify, text/HTML, orphan/few links, performance-heuristiikat.
- 4xx `/cdn-cgi/l/email-protection` ellei lähdeviitettä löydy.
