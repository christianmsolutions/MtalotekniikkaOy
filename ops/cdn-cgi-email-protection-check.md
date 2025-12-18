# Cloudflare email-protection check

- Haettu merkkijonot:
  - "/cdn-cgi/l/email-protection"
  - "data-cfemail"
  - "email-protection"

- Tulokset:
  - Löydökset vain raporteissa/CSV:issä, ei HTML-lähteissä.
  - tiedostot:
    - ops/semrush-fixes.md (raporttiteksti)
    - ops/semrush-triage.md (raporttiteksti)
    - ops/semrush-postfix-audit.md (raporttiteksti)
    - ops/input/semrush_mega_export.csv.csv (SEMrush-listaus)
  - Ei esiintymiä projektin HTML-sivuissa.
  - Ei esiintymiä "data-cfemail".

- Päätelmä:
  - Todennäköisesti Cloudflare-injektio / SEMrush false positive; ei paikallista lähdeviitettä korjattavaksi.
