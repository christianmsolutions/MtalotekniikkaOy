# Vikapalvelu hub↔landing wiring

Status: **GO**

## Muutokset
- Header-navin “Vikapalvelu” href asetettu `vikapalvelu.html` 45 sivulla.
- Hub (vikapalvelu.html): lisätty selkeä linkki Tampere-landingille heron alle sekä alue-/hinnoittelu-osiosta.
- Landing (vikapalvelu-tampere.html): heron toissijainen CTA ohjaa hubiin (`vikapalvelu.html`).

## Canonical
- vikapalvelu.html: `https://mtalotekniikka.fi/vikapalvelu.html` (PASS)
- vikapalvelu-tampere.html: `https://mtalotekniikka.fi/vikapalvelu-tampere.html` (PASS)

## Guardrail-tulokset
- Navissa -tampere.html linkkejä: 0 kpl
- Vikapalvelu-linkkejä väärään kohteeseen navissa: 0 kpl

## Linkkien sijainnit
- Hub → Landing: hero (muted link), alue/hinnoittelu osio.
- Landing → Hub: hero toissijainen CTA.

## Testit
- `node ops/scripts/nav_footer_runtime_test.mjs` (PASS; SKIP vain ei-standardi/raporttisivut)
- Master-audit: GO (uudet muutokset eivät tuoneet uusia nav/SEO-puutteita)
