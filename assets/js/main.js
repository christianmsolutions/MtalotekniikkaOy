(() => {
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const SEARCH_INDEX = window.siteSearchIndex || [
    { title: "Etusivu", description: "Talotekniikan etusivu ja yhteydenotto.", url: "index.html", tags: ["etusivu", "palvelut"] },
    { title: "Sähkötyöt", description: "Sähköasennukset, huollot ja päivystys.", url: "sahkotyot.html", tags: ["sähkö"] },
    { title: "LVI-palvelut", description: "Putkityöt, ilmanvaihto ja lämmitysratkaisut.", url: "putkityot.html", tags: ["lvi"] },
    { title: "Korjaussaneeraus", description: "Saneeraus- ja remonttipalvelut Pirkanmaalla.", url: "kylpyhuoneremontti.html", tags: ["saneeraus"] },
    { title: "Vikapalvelu", description: "24/7 vikapäivystys sähkö- ja LVI-ongelmiin.", url: "vikapalvelu-tampere.html", tags: ["päivystys"] },
    { title: "Verkkokauppa", description: "Tilaa palvelut ja tarvikkeet verkosta.", url: "verkkokauppa.html", tags: ["kauppa"] },
    { title: "Projektit", description: "Referenssit ja projektiesittelyt.", url: "projektit.html", tags: ["projektit"] },
    { title: "Ajankohtaista", description: "Uutiset ja blogiartikkelit.", url: "ajankohtaista.html", tags: ["blogi"] },
    { title: "UKK", description: "Usein kysytyt kysymykset ja vastaukset.", url: "ukk.html", tags: ["ukk"] },
    { title: "Hinnasto", description: "Tuntihinnat ja lisäkulut.", url: "hinnasto.html", tags: ["hinnasto"] },
    { title: "Yhteystiedot", description: "Ota yhteyttä tai varaa kartoitus.", url: "yhteystiedot.html", tags: ["yhteys"] }
  ];

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    highlightActiveNav();
    initSearch();
    initFilters();
    initFaq();
    initCookieBanner();
    initReveal();
    initBeforeAfter();
    initYear();
    initSnipcart();
    registerServiceWorker();
  });

  function initNav() {
    const nav = qs(".nav");
    const toggle = qs(".nav-toggle");
    const dropdownToggle = qs("[data-dropdown]");

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("nav--open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("nav-open", isOpen);
      });
    }

    if (dropdownToggle) {
      const parent = dropdownToggle.closest("li");
      const dropdown = parent?.querySelector(".nav__dropdown");

      dropdownToggle.addEventListener("click", (e) => {
        const isDesktop = window.matchMedia("(min-width:1025px)").matches;
        if (!isDesktop) {
          e.preventDefault();
          parent?.classList.toggle("nav__item--open");
        }
      });

      dropdownToggle.addEventListener("mouseenter", () => {
        const isDesktop = window.matchMedia("(min-width:1025px)").matches;
        if (isDesktop) parent?.classList.add("nav__item--open");
      });

      parent?.addEventListener("mouseleave", () => {
        const isDesktop = window.matchMedia("(min-width:1025px)").matches;
        if (isDesktop) parent?.classList.remove("nav__item--open");
      });

      document.addEventListener("click", (evt) => {
        if (!parent?.contains(evt.target)) {
          parent?.classList.remove("nav__item--open");
        }
      });
    }
  }

  function highlightActiveNav() {
    const rawPath = location.pathname.toLowerCase();
    const path = (rawPath.split("/").pop() || "index.html").toLowerCase();
    qsa(".nav__link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const hrefLower = href.toLowerCase();
      const isHome =
        hrefLower === "/" && (path === "" || path === "/" || path === "index.html");
      if (hrefLower === path || isHome) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initSearch() {
    const trigger = qs("[data-search-trigger]");
    if (!trigger) return;

    const overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.innerHTML = `
      <div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="search-title">
        <header>
          <h2 id="search-title" class="section__title" style="margin:0;">Haku</h2>
          <button type="button" class="btn btn--ghost" data-search-close>Sulje</button>
        </header>
        <label class="sr-only" for="site-search-input">Hae sivustolta</label>
        <input id="site-search-input" type="search" placeholder="Etsi sivustolta" autocomplete="off" />
        <div class="search-results" role="listbox"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = qs("#site-search-input", overlay);
    const results = qs(".search-results", overlay);
    const closeBtn = qs("[data-search-close]", overlay);
    let lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      overlay.classList.add("is-visible");
      document.body.style.overflow = "hidden";
      input.value = "";
      renderResults("");
      input.focus();
    }

    function close() {
      overlay.classList.remove("is-visible");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    function renderResults(query) {
      const term = query.trim().toLowerCase();
      const matches = SEARCH_INDEX.filter((item) => {
        const haystack = `${item.title} ${item.description} ${(item.tags || []).join(" ")}`.toLowerCase();
        return term ? haystack.includes(term) : true;
      }).slice(0, 12);

      results.innerHTML = "";
      if (matches.length === 0) {
        results.innerHTML = `<p>Ei tuloksia haulla “${query}”.</p>`;
        return;
      }

      matches.forEach((match) => {
        const a = document.createElement("a");
        a.href = match.url;
        a.setAttribute("role", "option");
        a.innerHTML = `<strong>${match.title}</strong><br><span>${match.description}</span>`;
        results.appendChild(a);
      });
    }

    trigger.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    input.addEventListener("input", () => renderResults(input.value));

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        overlay.classList.contains("is-visible") ? close() : open();
      }
      if (e.key === "Escape" && overlay.classList.contains("is-visible")) {
        close();
      }
    });
  }

  function initFilters() {
    qsa("[data-filter-group]").forEach((group) => {
      const buttons = qsa("button[data-filter]", group);
      const targetSelector = group.getAttribute("data-filter-target");
      if (!targetSelector) return;
      const items = qsa(targetSelector);

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          const filter = btn.dataset.filter;
          items.forEach((item) => {
            const category = item.dataset.category;
            const match = filter === "kaikki" || category === filter;
            item.hidden = !match;
          });
        });
      });
    });
  }

  function initFaq() {
    qsa(".faq details").forEach((el) => {
      el.addEventListener("toggle", () => {
        if (!el.open) return;
        qsa(".faq details").forEach((other) => {
          if (other !== el) other.open = false;
        });
      });
    });
  }

  function initCookieBanner() {
    const banner = qs(".cookie-banner");
    const accept = qs("[data-cookie-accept]");
    if (!banner || !accept) return;

    const showBanner = () => {
      banner.classList.add("is-visible");
    };

    if (!localStorage.getItem("mtalotekniikka_cookie")) {
      let timeoutId;
      const dismissListeners = () => {
        window.removeEventListener("scroll", showBanner);
        document.removeEventListener("pointerdown", showBanner);
        document.removeEventListener("keydown", showBanner);
        clearTimeout(timeoutId);
      };

      const showOnce = () => {
        showBanner();
        dismissListeners();
      };

      timeoutId = setTimeout(showOnce, 20000);
      window.addEventListener("scroll", showOnce, { once: true });
      document.addEventListener("pointerdown", showOnce, { once: true });
      document.addEventListener("keydown", showOnce, { once: true });
    }

    accept.addEventListener("click", () => {
      localStorage.setItem("mtalotekniikka_cookie", "true");
      banner.classList.remove("is-visible");
    });
  }

  function initReveal() {
    const elements = qsa("[data-reveal]");
    if (!elements.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function initBeforeAfter() {
    qsa("[data-before-after]").forEach((wrap) => {
      const range = qs("input[type='range']", wrap);
      const after = qs(".after", wrap);
      if (!range || !after) return;
      range.addEventListener("input", () => {
        after.style.width = `${range.value}%`;
      });
    });
  }

  function initYear() {
    const yearEl = qs("#current-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function initSnipcart() {
    const key = window.SNIPCART_PUBLIC_KEY;
    if (!key) return;

    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "style";
    preload.href = "https://cdn.snipcart.com/themes/v3.4.0/default/snipcart.css";
    preload.onload = () => {
      preload.rel = "stylesheet";
    };
    preload.onerror = () => {
      preload.rel = "stylesheet";
    };
    document.head.appendChild(preload);

    const script = document.createElement("script");
    script.src = "https://cdn.snipcart.com/themes/v3.4.0/default/snipcart.js";
    script.defer = true;
    document.head.appendChild(script);

    let root = qs("#snipcart");
    if (!root) {
      root = document.createElement("div");
      root.id = "snipcart";
      root.hidden = true;
      root.style.display = "none";
      document.body.appendChild(root);
    }
    root.dataset.apiKey = key;
    root.dataset.configAddProductBehavior = "none";
    root.dataset.currency = "eur";
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }
})();
