#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const baseHead = ({ title, description, canonical, heroImg }) => `<!doctype html>
<html lang="fi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#0c1a2a">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" as="image" href="${heroImg}">
  <link rel="stylesheet" href="assets/css/main.css">
  <script>
    window.SNIPCART_PUBLIC_KEY = 'YTk1OGQ3ODMtNDhmOS00MWE0LTgxMzEtYTUzMWJkYTkwMTJiNjM4OTkwMTQ0MTkxNTkxMDQy';
  </script>
  <script src="assets/js/main.js" defer></script>
</head>`;

const nav = `<header class="header">
  <div class="container header__bar">
    <a class="logo" href="/">M Talotekniikka</a>
    <nav class="nav" aria-label="Päänavigaatio">
      <button class="nav-toggle" aria-expanded="false" aria-controls="main-nav">Valikko</button>
      <ul class="nav__list" id="main-nav">
        <li><a class="nav__link" href="index.html">Etusivu</a></li>
        <li><a class="nav__link" href="verkkokauppa.html">Verkkokauppa</a></li>
        <li><a class="nav__link" href="yhteystiedot.html">Ota yhteyttä</a></li>
      </ul>
    </nav>
    <div class="header__actions">
      <button class="icon-btn snipcart-checkout" type="button" aria-label="Avaa ostoskori">
        🛒 <span class="cart-count"><span class="snipcart-items-count">0</span></span>
      </button>
    </div>
  </div>
</header>`;

const footer = `<footer class="footer">
  <div class="container footer__bottom">
    <p>&copy; <span id="current-year">2025</span> M Talotekniikka.</p>
  </div>
</footer>
<div class="cookie-banner">
  <div class="container">
    <p>Käytämme evästeitä parantaaksemme käyttökokemustasi ja analysoidaksemme sivuston käyttöä. <a href="tietosuoja.html">Lue tietosuojaseloste</a>.</p>
    <button class="btn btn--ghost" type="button" data-cookie-accept>Hyväksy</button>
  </div>
</div>
<a class="back-to-top" href="#main" aria-label="Palaa sivun alkuun">↑</a>
</body>
</html>`;

const heroByCategory = {
  sahko: "../images/sahkotyot/hero/hero.jpg",
  lvi: "../images/lvi/hero/hero.jpg",
  saneeraus: "../images/saneeraus/hero/hero.jpg",
};

const pages = [
  {
    slug: "sahkotyot-tampere.html",
    category: "sahko",
    title: "Sähkötyöt Tampere | M Talotekniikka",
    description: "Sähkötyöt Tampereella ja Pirkanmaalla: asennukset, remontit ja vikakorjaukset yhdeltä tiimiltä.",
    eyebrow: "Sähkö Tampere · Pirkanmaa",
    h1: "Sähkötyöt Tampereella – selkeä suunnitelma ja nopea vaste",
    lead: "Kartoitamme tilanteen heti ja sovimme turvallisen aikataulun. Saat kirjallisen arvion ja nimetyn yhteyshenkilön.",
    points: ["Vaste 1–3 arkipäivää", "Päivystys 24/7", "Dokumentoidut mittaukset"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Vikatilanne?", href: "vikapalvelu-tampere.html" },
  },
  {
    slug: "sahkoautonlataus-tampere.html",
    category: "sahko",
    title: "Sähköauton lataus Tampere | M Talotekniikka",
    description: "Kotilataus, taloyhtiöiden ja yritysten latausratkaisut Tampereella ja Pirkanmaalla.",
    eyebrow: "Latauspisteet",
    h1: "Sähköauton latausratkaisut Pirkanmaalla",
    lead: "Suunnittelemme ja asennamme kuormanhallitut latauspisteet kotiin, taloyhtiöön ja yrityksille.",
    points: ["Kuormanhallinta ja kapasiteettilaskelmat", "Dokumentoidut käyttöönottotestit", "Käyttäjäopastus"],
    cta: { label: "Pyydä kartoitus", href: "#yhteys" },
    secondary: { label: "Katso hinnasto", href: "hinnasto.html" },
  },
  {
    slug: "aurinkopaneelit-tampere.html",
    category: "sahko",
    title: "Aurinkopaneelit Tampere | M Talotekniikka",
    description: "Aurinkopaneelien suunnittelu ja asennus Pirkanmaalla. Dokumentoitu käyttöönotto ja huolto.",
    eyebrow: "Aurinkosähkö",
    h1: "Aurinkopaneelien asennus Tampereella",
    lead: "Suunnittelemme tuoton ja mitoituksen, asennamme invertterit ja dokumentoimme käyttöönoton.",
    points: ["Tuottoarvio ja mitoitus", "Invertterin käyttöönotto", "Huolto- ja seurantapalvelu"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Kysy lisätietoja", href: "yhteystiedot.html" },
  },
  {
    slug: "sahkovikapalvelu-tampere.html",
    category: "sahko",
    title: "Sähkövikapalvelu Tampere | M Talotekniikka",
    description: "24/7 sähkövikapäivystys Tampereella ja Pirkanmaalla. Nopea vaste ja toimintaohjeet.",
    eyebrow: "Vikapäivystys",
    h1: "Sähkövikapäivystys 24/7",
    lead: "Saat toimintaohjeet puhelimessa ja sovimme käynnin. Vaste 0–4 h Pirkanmaalla.",
    points: ["Pääkeskus- ja sulakeviat", "Dokumentointi vakuutusyhtiölle", "Varalaitteet ja mittarit mukana"],
    cta: { label: "Soita päivystykseen", href: "tel:+358400472627" },
    secondary: { label: "Lue vikapalvelu", href: "vikapalvelu-tampere.html" },
  },
  {
    slug: "sahkoasennukset-tampere.html",
    category: "sahko",
    title: "Sähköasennukset Tampere | M Talotekniikka",
    description: "Sähköasennukset, keskukset ja valaistusratkaisut Tampereella ja Pirkanmaalla.",
    eyebrow: "Sähköasennukset",
    h1: "Sähköasennukset ja käyttöönotot",
    lead: "Uudis- ja saneerauskohteiden sähkötyöt avaimet käteen. Mittauspöytäkirjat sisältyvät.",
    points: ["Uudis- ja saneerauskohteet", "Valaistus- ja ohjausratkaisut", "Mittaus- ja käyttöönotot"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Tutustu sähköpalveluihin", href: "sahkotyot.html" },
  },
  {
    slug: "sahkoremontti-tampere.html",
    category: "sahko",
    title: "Sähkoremontti Tampere | M Talotekniikka",
    description: "Sähkösaneeraus huoneistoihin ja omakotitaloihin Tampereella. Selkeät aikataulut ja dokumentointi.",
    eyebrow: "Sähkösaneeraus",
    h1: "Sähköremontti huoneistoihin ja omakotitaloihin",
    lead: "Uusimme johdotukset, keskukset ja valaistukset määräysten mukaisesti. Dokumentoitu luovutus.",
    points: ["Käyttöönotto- ja mittauspöytäkirjat", "Asukasviestintä ja suojaukset", "Kotitalousvähennys hyödynnettävissä"],
    cta: { label: "Varaa kartoitus", href: "#yhteys" },
    secondary: { label: "Lue sähköpalvelut", href: "sahkotyot.html" },
  },
  {
    slug: "lvi-tampere.html",
    category: "lvi",
    title: "LVI Tampere | M Talotekniikka",
    description: "Putkityöt, lämmitys ja ilmanvaihto Tampereella ja Pirkanmaalla. Päivystys 24/7.",
    eyebrow: "LVI-palvelut",
    h1: "LVI-asiantuntija Tampereella",
    lead: "Putkityöt, lämmitysjärjestelmät ja ilmanvaihto yhdeltä kumppanilta. Vaste 1–3 arkipäivää.",
    points: ["Putkivuotojen ensivaste", "Energiansäästö ja säätö", "Dokumentoidut mittaukset"],
    cta: { label: "Pyydä kartoitus", href: "#yhteys" },
    secondary: { label: "Katso LVI-palvelut", href: "lvi.html" },
  },
  {
    slug: "putkityot-tampere.html",
    category: "lvi",
    title: "Putkityöt Tampere | M Talotekniikka",
    description: "Putkivuodot, vesikalusteet ja käyttövesiremontit Tampereella ja Pirkanmaalla.",
    eyebrow: "Putkityöt",
    h1: "Putkityöt ja käyttövesiremontit",
    lead: "Vuodot, vesikalusteet ja putkikorjaukset nopeasti ja siististi. Selkeä arvio ennen aloitusta.",
    points: ["Vuodon paikannus ja korjaus", "Vesikalusteiden vaihdot", "Käyttövesiputkien uusinnat"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Vikapalvelu", href: "lvi-vikapalvelu-tampere.html" },
  },
  {
    slug: "ilmastointihuolto-tampere.html",
    category: "lvi",
    title: "Ilmanvaihtotyöt Tampere | M Talotekniikka",
    description: "Ilmanvaihdon huollot, mittaukset ja säätö Pirkanmaalla. Raportit ja tasapainotus.",
    eyebrow: "Ilmanvaihto",
    h1: "Ilmanvaihdon huolto ja säätö",
    lead: "IV-koneiden huollot, kanavien puhdistukset ja ilmamäärien mittaukset raportoituna.",
    points: ["Ilmamäärämittaukset", "Suodatinvaihdot ja puhdistukset", "Tasapainotus ja raportit"],
    cta: { label: "Pyydä huolto", href: "#yhteys" },
    secondary: { label: "Katso LVI-palvelut", href: "lvi.html" },
  },
  {
    slug: "lampopumppu-asennus-tampere.html",
    category: "lvi",
    title: "Lämpöpumppu asennus Tampere | M Talotekniikka",
    description: "Ilmalämpöpumput ja ilma-vesilämpöpumput asennettuna Pirkanmaalla. Käyttöönotto ja opastus.",
    eyebrow: "Lämpöpumput",
    h1: "Lämpöpumput suunnittelusta käyttöönottoon",
    lead: "Mitoitamme, asennamme ja huollamme lämpöpumput. Sisältää käyttökoulutuksen.",
    points: ["Mitoitus ja tuottoarvio", "Asennus ja käyttöönotto", "Huolto- ja takuutarkastukset"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Katso LVI-palvelut", href: "lvi.html" },
  },
  {
    slug: "lvi-huolto-tampere.html",
    category: "lvi",
    title: "LVI-huolto Tampere | M Talotekniikka",
    description: "LVI-huollot, vuotokorjaukset ja lämmityksen optimointi Pirkanmaalla.",
    eyebrow: "LVI-huolto",
    h1: "LVI-huolto ja vikakorjaukset",
    lead: "Diagnosoimme viat mittalaitteilla, raportoimme kirjallisesti ja ohjaamme jatkotoimet.",
    points: ["Vaste 0–4 h päivystyksessä", "Huoltosopimukset taloyhtiöille", "Mittauspöytäkirjat"],
    cta: { label: "Tilaa huolto", href: "#yhteys" },
    secondary: { label: "Vikapalvelu", href: "lvi-vikapalvelu-tampere.html" },
  },
  {
    slug: "lvi-asennus-tampere.html",
    category: "lvi",
    title: "LVI-asennus Tampere | M Talotekniikka",
    description: "Lämmitys-, vesi- ja ilmanvaihtoratkaisut asennettuna Pirkanmaalla.",
    eyebrow: "LVI-asennus",
    h1: "LVI-asennukset ja käyttöönotot",
    lead: "Suunnittelemme ja asennamme LVI-järjestelmät sekä toimitamme mittausraportit.",
    points: ["Käyttövesi ja viemärit", "Ilmanvaihdon asennukset", "Mittaukset ja luovutukset"],
    cta: { label: "Pyydä kartoitus", href: "#yhteys" },
    secondary: { label: "Katso LVI-palvelut", href: "lvi.html" },
  },
  {
    slug: "lvi-vikapalvelu-tampere.html",
    category: "lvi",
    title: "LVI-vikapalvelu Tampere | M Talotekniikka",
    description: "24/7 LVI-päivystys Pirkanmaalla. Vuodot, tukokset ja lämmitysongelmat.",
    eyebrow: "Päivystys",
    h1: "LVI-vikapäivystys 24/7",
    lead: "Vaste 0–4 h. Dokumentoimme vahingot ja ohjaamme jatkotoimet.",
    points: ["Vuodon paikannus", "Tilapäiset vesijärjestelyt", "Raportointi vakuutusyhtiölle"],
    cta: { label: "Soita päivystykseen", href: "tel:+358400472627" },
    secondary: { label: "Katso LVI-palvelut", href: "lvi.html" },
  },
  {
    slug: "vikapalvelu-tampere.html",
    category: "saneeraus",
    title: "Vikapalvelu Tampere | M Talotekniikka",
    description: "24/7 vikapalvelu sähkö- ja LVI-ongelmiin Pirkanmaalla. Toimintaohjeet ja nopea vaste.",
    eyebrow: "Päivystys 24/7",
    h1: "Vikapalvelu Pirkanmaalla",
    lead: "Soita kun vuoto tai sähkövika vaatii nopeaa reagointia. Saat toimintaohjeet ja käyntiajan.",
    points: ["Vaste 0–4 h", "Dokumentointi vakuutusyhtiölle", "Tilapäiset järjestelyt"],
    cta: { label: "Soita päivystykseen", href: "tel:+358400472627" },
    secondary: { label: "Lue lisää vikapalvelusta", href: "sahkovikapalvelu-tampere.html" },
  },
  {
    slug: "remonttipalvelut-tampere.html",
    category: "saneeraus",
    title: "Remonttipalvelut Tampere | M Talotekniikka",
    description: "Pienet ja suuremmat remontit Pirkanmaalla. Kylpyhuoneet, keittiöt ja pintatyöt.",
    eyebrow: "Remonttipalvelut",
    h1: "Remontit avaimet käteen",
    lead: "Pintojen päivitys, märkätilat ja keittiöt samalla sopimuksella. Asukasviestintä ja dokumentointi sisältyvät.",
    points: ["VTT-sertifioitu vedeneristys", "Materiaalien koordinointi", "Selkeät aikataulut"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Tutustu saneeraukseen", href: "saneeraus.html" },
  },
  {
    slug: "maalaus-tampere.html",
    category: "saneeraus",
    title: "Maalaus Tampere | M Talotekniikka",
    description: "Maalaus- ja pintatyöt huoneistoihin ja liiketiloihin Pirkanmaalla.",
    eyebrow: "Pintakäsittely",
    h1: "Maalaus- ja pintatyöt",
    lead: "Sisä- ja ulkopintojen maalaukset, tasoitukset ja listoitukset. Siisti työnjälki ja suojaukset.",
    points: ["Pintojen esikäsittely", "Tasoitukset ja maalaukset", "Siivous ja suojaukset"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Tutustu remonttipalveluihin", href: "saneeraus.html" },
  },
  {
    slug: "pintakasittely-tampere.html",
    category: "saneeraus",
    title: "Pintakäsittely Tampere | M Talotekniikka",
    description: "Pintojen uusiminen, tasoitus ja suojaus Tampereella ja Pirkanmaalla.",
    eyebrow: "Pintakäsittely",
    h1: "Pintakäsittelyt ja suojaukset",
    lead: "Tasoitamme ja maalaamme pinnat sekä huolehdimme suojauksista. Soveltuu myös liiketiloihin.",
    points: ["Tasoitus ja maalaus", "Pölynhallinta", "Nopea aikataulu"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Saneerauspalvelut", href: "saneeraus.html" },
  },
  {
    slug: "keittioremontti-tampere.html",
    category: "saneeraus",
    title: "Keittiöremontti Tampere | M Talotekniikka",
    description: "Keittiöremontit avaimet käteen Pirkanmaalla. Kalusteet, sähkö- ja putkikytkennät.",
    eyebrow: "Keittiöremontti",
    h1: "Keittiöremontti avaimet käteen",
    lead: "Materiaalien koordinointi, kalusteasennukset ja pintojen uusinta. Sähkö- ja LVI-työt sisältyvät.",
    points: ["Kalusteiden asennus", "Sähkö- ja LVI-kytkennät", "Aikataulu ja siivous sovittuna"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Lue saneerauspalveluista", href: "saneeraus.html" },
  },
  {
    slug: "kylpyhuoneremontti-tampere.html",
    category: "saneeraus",
    title: "Kylpyhuoneremontti Tampere | M Talotekniikka",
    description: "Kylpyhuoneremontit VTT-sertifioidulla vedeneristyksellä ja dokumentoinnilla.",
    eyebrow: "Kylpyhuoneremontti",
    h1: "Kylpyhuoneremontti avaimet käteen",
    lead: "Purku, vedeneristys, putki- ja sähkötyöt sekä pintojen viimeistely yhdeltä toimijalta.",
    points: ["VTT-sertifioitu vedeneristys", "Dokumentointi ja käyttöönottotestit", "Asukasviestintä"],
    cta: { label: "Pyydä kartoitus", href: "#yhteys" },
    secondary: { label: "Saneerauspalvelut", href: "saneeraus.html" },
  },
  {
    slug: "huoneistoremontti-tampere.html",
    category: "saneeraus",
    title: "Huoneistoremontti Tampere | M Talotekniikka",
    description: "Huoneistoremontit ja pintojen päivitykset Pirkanmaalla. Selkeä aikataulu ja dokumentointi.",
    eyebrow: "Huoneistoremontti",
    h1: "Huoneistoremontit Pirkanmaalla",
    lead: "Pintaremontit, keittiöt ja märkätilat. Yksi yhteyshenkilö ja sovitut aikataulut.",
    points: ["Pintojen päivitys", "Keittiöt ja märkätilat", "Siivous ja suojaukset"],
    cta: { label: "Pyydä tarjous", href: "#yhteys" },
    secondary: { label: "Saneerauspalvelut", href: "saneeraus.html" },
  },
  {
    slug: "korjaussaneeraus-tampere.html",
    category: "saneeraus",
    title: "Korjaussaneeraus Tampere | M Talotekniikka",
    description: "Korjaussaneeraus taloyhtiöille, yrityksille ja kotitalouksille Pirkanmaalla.",
    eyebrow: "Korjaussaneeraus",
    h1: "Korjaussaneeraus yhdellä sopimuksella",
    lead: "Huoneistot, taloyhtiöt ja liiketilat. Projektinjohto, dokumentointi ja valvonta sisältyvät.",
    points: ["Yksi yhteyshenkilö", "LVIS ja rakennustyöt yhdessä", "Dokumentoitu luovutus"],
    cta: { label: "Varaa kartoitus", href: "#yhteys" },
    secondary: { label: "Tutustu saneeraukseen", href: "saneeraus.html" },
  },
];

const buildPage = (page) => {
  const heroImg = heroByCategory[page.category] || "../images/etusivu/hero/home-hero.jpg";
  const head = baseHead({
    title: page.title,
    description: page.description,
    canonical: `https://mtalotekniikka.fi/${page.slug.replace(/\\.html$/, "")}`,
    heroImg,
  });

  const bullets = page.points.map((item) => `<li>${item}</li>`).join("");

  return `${head}
<body class="page page--landing">
  <a class="sr-only" href="#main">Siirry sisältöön</a>
  ${nav}
  <main id="main">
    <section class="page-hero" style="--hero-img: url('${heroImg}')">
      <div class="container">
        <p class="section__eyebrow">${page.eyebrow}</p>
        <h1 class="section__title">${page.h1}</h1>
        <p>${page.lead}</p>
        <div class="button-row">
          <a class="btn" href="${page.cta.href}">${page.cta.label}</a>
          <a class="btn btn--ghost" href="${page.secondary.href}">${page.secondary.label}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container grid grid--two">
        <div class="panel">
          <h2 class="section__title">Miten autamme</h2>
          <ul class="list-check">${bullets}</ul>
          <p class="muted">Toimialue: Tampere, Nokia, Pirkkala, Ylöjärvi, Lempäälä ja lähikunnat.</p>
        </div>
        <div class="panel" id="yhteys">
          <h2 class="section__title">Ota yhteyttä</h2>
          <p>Vastamme saman työpäivän aikana. Kiireellisissä tilanteissa soita päivystykseen.</p>
          <div class="button-row" style="margin:0.5rem 0 1rem;">
            <a class="btn" href="tel:+358400472627">Soita 040 047 2627</a>
            <a class="btn btn--ghost" href="yhteystiedot.html">Yhteydenotto</a>
          </div>
        </div>
      </div>
    </section>
  </main>
  ${footer}`;
};

pages.forEach((page) => {
  const html = buildPage(page);
  const outPath = path.join(__dirname, "..", page.slug);
  fs.writeFileSync(outPath, html, "utf8");
  console.log("Generated", page.slug);
});
