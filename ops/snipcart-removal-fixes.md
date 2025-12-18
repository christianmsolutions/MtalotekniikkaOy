# Snipcart removal fixes

## Kauppasivut (Snipcart säilytetty)
- verkkokauppa.html
- ostoskori.html
  - Snipcart key/script/init + checkout-napit jätetty.

## Ei-kauppasivut (Snipcart poistettu)
- Muutettu headerin ostoskoripainike linkiksi: `<a class="icon-btn" href="verkkokauppa.html" aria-label="Verkkokauppa">🛒</a>`
- Poistettu Snipcart avain/skriptirivit (SNIPCART_PUBLIC_KEY, snipcart.js/css) jos sellaisia oli.
- Muokatut sivut (39 kpl): tietoa.html, sahkoasennukset-tampere.html, ukk.html, pintakasittely-tampere.html, index.html, sahkoautonlataus.html, keittioremontti.html, hinnasto.html, putkityot.html, vikapalvelu-tampere.html, projektit.html, kylpyhuoneremontti-tampere.html, ilmastointihuolto.html, lvi-vikapalvelu-tampere.html, huoneistoremontti.html, aurinkopaneelit.html, sahkovikapalvelu-tampere.html, lvi.html, lvi-tampere.html, huoneistoremontti-tampere.html, sahkotyot.html, tietosuoja.html, aurinkopaneelit-tampere.html, sahkotyot-tampere.html, lvi-huolto-tampere.html, lampopumppu-asennus.html, kylpyhuoneremontti.html, korjaussaneeraus-tampere.html, sahkoremontti-tampere.html, lvi-asennus-tampere.html, yhteystiedot.html, keittioremontti-tampere.html, rekry.html, maalaus-tampere.html, remonttipalvelut-tampere.html, sahkoautonlataus-tampere.html, ajankohtaista.html, kiitos.html, saneeraus.html.

## Jäljelle jääneet Snipcart-elementit
- assets/js/main.js sisältää initSnipcart-funktion, mutta se ei aktivoidu ellei SNIPCART_PUBLIC_KEY ole asetettu (vain kauppasivuilla).
