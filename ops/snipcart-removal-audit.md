# Snipcart removal audit

Haetut avainsanat: `cdn.snipcart.com`, `app.snipcart.com`, `SNIPCART_PUBLIC_KEY`, `snipcart-checkout`, `snipcart-add-item`, `id="snipcart"`, `data-cfemail`.

Löydökset (ennen poistoja):
- Snipcart avain ja checkout-nappi lähes kaikissa sivuissa (header): `href=""` logo + `snipcart-checkout` (lista rg:ssä, mm. index.html, lvi*.html, sahkotyot*.html, aurinkopaneelit*.html, jne.).
- Snipcart avain/skriptit: vain ostoskori.html ja verkkokauppa.html jäävät; muut poistettu.
- Snipcart lisäykset (add-item): vain verkkokauppa.html.
- Ei `data-cfemail` esiintymiä HTML:ssä (vain raporteissa).

Kauppasivut (Snipcart pidetään):
- verkkokauppa.html
- ostoskori.html

Ei-kauppasivut (Snipcart poistettu):
- 39 sivua (header-linkki korvattu ostoskorilinkiksi verkkokauppaan; avain/skriptit poistettu)
- Tarkka lista: tietoa.html, sahkoasennukset-tampere.html, ukk.html, pintakasittely-tampere.html, index.html, sahkoautonlataus.html, keittioremontti.html, hinnasto.html, putkityot.html, vikapalvelu-tampere.html, projektit.html, kylpyhuoneremontti-tampere.html, ilmastointihuolto.html, lvi-vikapalvelu-tampere.html, huoneistoremontti.html, aurinkopaneelit.html, sahkovikapalvelu-tampere.html, lvi.html, lvi-tampere.html, huoneistoremontti-tampere.html, sahkotyot.html, tietosuoja.html, aurinkopaneelit-tampere.html, sahkotyot-tampere.html, lvi-huolto-tampere.html, lampopumppu-asennus.html, kylpyhuoneremontti.html, korjaussaneeraus-tampere.html, sahkoremontti-tampere.html, lvi-asennus-tampere.html, yhteystiedot.html, keittioremontti-tampere.html, rekry.html, maalaus-tampere.html, remonttipalvelut-tampere.html, sahkoautonlataus-tampere.html, ajankohtaista.html, kiitos.html, saneeraus.html.
