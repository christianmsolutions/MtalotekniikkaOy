# SEMrush fixes

## Kriittiset korjaukset
- Broken internal links (tyhjä logo-linkki):
  - URL: kaikki pää- ja palvelusivut (including -tampere, www-variantit SEMrushissa)
  - Paikalliset tiedostot: 44 HTML-sivua (mm. index.html, lvi.html, lvi-tampere.html, sahkotyot.html, sahkotyot-tampere.html, aurinkopaneelit*.html, putkityot*.html, jne.)
  - Muutos: `<a class="logo" href="">M Talotekniikka</a>` → `<a class="logo" href="index.html">M Talotekniikka</a>`

- Invalid robots.txt format:
  - URL: https://mtalotekniikka.fi/robots.txt
  - Paikallinen tiedosto: uusi robots.txt
  - Muutos: lisätty kelvollinen robots.txt  
    ```
    User-agent: *
    Allow: /
    Sitemap: https://mtalotekniikka.fi/sitemap.xml
    ```

## Ei korjattu (ei yksiselitteistä paikallista muutosta)
- 4xx errors: `/cdn-cgi/l/email-protection` (ja www-versio) – ei viitettä paikallisissa HTML-lähteissä; todennäköisesti Cloudflare email-protectionin placeholder.

## Yhteenveto
- Kriittisiä löydöksiä: 3 kategoriaa (broken internal links, invalid robots, 4xx cdn-cgi)
- Korjattu: 2 kategoriaa (logo-linkki, robots.txt)
- Jäljellä: 4xx cdn-cgi (ei lähdeviitettä paikallisissa tiedostoissa)
- Lisäykset: robots.txt vahvistettu: `Disallow: /cdn-cgi/`; sitemap-rivi tarkistettu (https://mtalotekniikka.fi/sitemap.xml)
