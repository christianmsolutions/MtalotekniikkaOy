# Robots.txt live diagnosis

## 1) Lokaali tarkistus
- robots.txt on projektin juuressa.
- Sisältö:
  ```
  User-agent: *
  Disallow: /cdn-cgi/

  Sitemap: https://mtalotekniikka.fi/sitemap.xml
  ```
- Formaatti validi (plaintext, ei HTML).

## 2) Tuotannossa tarkistettavat kohdat
- Avaa: https://mtalotekniikka.fi/robots.txt
- Varmista:
  - Status code: 200
  - Content-Type: text/plain (ei text/html)
  - Palautuva sisältö vastaa yllä olevaa, ilman HTML-runkoa.
- Jos hostaa sekä apex että www:
  - Testaa myös https://www.mtalotekniikka.fi/robots.txt
  - Varmista ettei ohjaudu index.html:ään eikä palaudu HTML.

## 3) Yleisimmät syyt HTML:n palautumiseen
1. SPA/404 fallback rewrittaa kaikki pyynnöt index.html:ään.
2. Cloudflare Page Rule / Transform Rule / Workers ylikirjoittaa robots.txt-reitin.
3. Origin ei palvele .txt-tiedostoja oikein (MIME tai fallback).
4. Redirect chain (301/302) vie HTML-sivulle (esim. http→https, www→apex väärin konffattu).
5. Välimuisti/caching toimittaa robots.txt:n HTML:n sisällöllä (väärä cache key/content-type).

## 4) FIX PLAN (Cloudflare + static hosting)
- Varmista että robots.txt on julkaistu juureen (build artefaktissa).
- Cloudflare Pages:
  - Pages project → Build output: sisältää robots.txt.
  - Poista/rajaa mahdolliset Page Rulet/Workers, jotka rewrittaavat kaikki polut (erityisesti `*mtalotekniikka.fi/*` → index.html).
  - Transform Rules: älä muuta Accept/Content-Type robots.txt-pyynnöille.
  - Cache Rules: varmista että robots.txt cache key perustuu oikeaan polkuun ja toimittaa `text/plain`.
- Jos fallback on pakollinen SPA: lisää poikkeus rewritelle:
  - Älä rewrittaa `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/manifest.webmanifest`, `/cdn-cgi/*`.
- Tarkista www/apex ohjaukset:
  - Yksi 301 → oikeaan hostiin → robots.txt palautuu 200 text/plain.
- Huoltotoimenpide:
  - Curl-prod: `curl -I https://mtalotekniikka.fi/robots.txt` ja `curl https://mtalotekniikka.fi/robots.txt` ja vertaile payloadin ensimmäisiä rivejä.
