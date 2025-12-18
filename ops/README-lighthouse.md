# Lighthouse regression runner

Vaatimukset:
- node + npm
- python3 (lokal serveri: `python3 -m http.server`)
- Chromium (Lighthouse lataa via npx)
- dev-riippuvuudet: `npm i -D lighthouse`

Ajo:
```
node ops/scripts/lighthouse_all_pages.mjs
```

Jatkaminen / runId:
- Skripti luo runId:n (ISO timestamp) ja tallentaa tilan: `ops/lighthouse/report-<runId>/state.json`.
- Jos ajat saman komennon uudelleen, se jatkaa puuttuvat sivut samasta runId:stä.
- Voit pakottaa runId:n: `LH_RUN_ID=20250101T120000 node ops/scripts/lighthouse_all_pages.mjs`

Vain yhteenveto valmiista raporteista:
```
node ops/scripts/lighthouse_all_pages.mjs --summarize
```
(lukee viimeisimmän runId:n tai LH_RUN_ID:n state/raportit ja kirjoittaa summaryn)

Mitä skripti tekee:
- Listaa kaikki *.html (pois: offline.html, *demo*, lvi-section-demo.html).
- Käynnistää python http.server 127.0.0.1:4173.
- Ajaa Lighthouse (preset=desktop, kategoriat perf/a11y/bp/seo) jokaiselle sivulle.
- Tallentaa raportit: `ops/lighthouse/report-YYYYMMDD-HHMM/` (.html + .json per sivu).
- Tuottaa yhteenvedon: `ops/lighthouse/summary-YYYYMMDD-HHMM.md` (taulukko + top10 heikoimmat perf).

Huom:
- Tämä on regressiotesti, ei PageSpeed Insights.
- Jos haluat mobiili-profiilin, muokkaa skriptin Lighthouse-käskyä (preset/flags).
- Jos ajo keskeytyy: sama komento jatkaa state.json:in perusteella.
