# Vikapalvelu nav hotfix

## Muutokset
- Päivitetty “Vikapalvelu” -linkin href kaikissa standardi-HTML-sivuissa (45 kpl) → `/vikapalvelu` (header + mahdolliset mobiilinavigaatiot ja footer-linkit).
- Ei lisätty uusia sivuja; olemassa oleva `vikapalvelu.html` säilyy.
- Logo-linkeissä ei ollut tyhjiä href-arvoja, joten niitä ei muutettu.

## Ennen → jälkeen
- “Vikapalvelu” href: `vikapalvelu.html` (tai muut variantit) → `/vikapalvelu`

## Guardrail-tulokset
- Navissa `-tampere.html` linkkejä: 0 kpl
- “Vikapalvelu” → sahkotyot* -linkkejä: 0 kpl

## Muokatut tiedostot (45)
tietoa.html  
sahkoasennukset-tampere.html  
verkkokauppa.html  
vikapalvelu.html  
ukk.html  
pintakasittely-tampere.html  
index.html  
ilmastointihuolto-tampere.html  
sahkoautonlataus.html  
keittioremontti.html  
hinnasto.html  
putkityot.html  
vikapalvelu-tampere.html  
projektit.html  
kylpyhuoneremontti-tampere.html  
ilmastointihuolto.html  
lvi-vikapalvelu-tampere.html  
huoneistoremontti.html  
aurinkopaneelit.html  
sahkovikapalvelu-tampere.html  
lvi.html  
lvi-tampere.html  
huoneistoremontti-tampere.html  
sahkotyot.html  
tietosuoja.html  
aurinkopaneelit-tampere.html  
putkityot-tampere.html  
sahkotyot-tampere.html  
lvi-huolto-tampere.html  
ostoskori.html  
lampopumppu-asennus-tampere.html  
lampopumppu-asennus.html  
kylpyhuoneremontti.html  
korjaussaneeraus-tampere.html  
sahkoremontti-tampere.html  
lvi-asennus-tampere.html  
yhteystiedot.html  
keittioremontti-tampere.html  
rekry.html  
maalaus-tampere.html  
remonttipalvelut-tampere.html  
sahkoautonlataus-tampere.html  
ajankohtaista.html  
kiitos.html  
saneeraus.html  

## Testit
- `node ops/scripts/nav_footer_runtime_test.mjs` (PASS; SKIP vain ei-standardi/raporttisivut)
- Master-audit: (ajettava tiimin prosessin mukaan; suositus ajaa heti hotfixin jälkeen)
