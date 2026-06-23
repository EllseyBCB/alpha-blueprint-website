/* ============================================================
   Cookie-Consent-Banner + Google-Tag (GA4) + Conversion-Event
   ------------------------------------------------------------
   Google-Tag (Mess-ID): G-YGZR469JHW
   - Laedt NICHTS, bis der Besucher im Banner "Akzeptieren" klickt
     (Google Consent Mode v2, Standard = abgelehnt -> DSGVO-konform).
   - Nach Einwilligung: GA4-Statistiken aktiv.
   - Beim erfolgreichen Absenden des Kontaktformulars wird das
     Ereignis "generate_lead" gesendet. Dieses Ereignis in GA4 als
     Schluesselereignis markieren und in Google Ads als Conversion
     importieren.
   ============================================================ */
(function () {
  var GTAG_ID = "G-YGZR469JHW";
  var STORAGE_KEY = "abp-consent-v1";

  // --- Google Consent Mode v2: standardmäßig alles abgelehnt ---
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  var gtagLoaded = false;
  function loadGtag() {
    if (gtagLoaded) return;
    gtagLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GTAG_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GTAG_ID);
  }

  function grant() {
    gtag("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    loadGtag();
  }

  // Conversion-Auslöser für das Kontaktformular.
  // Feuert das von Google Ads erzeugte GA4-Schluesselereignis (loest die
  // Ads-Conversion aus) sowie das Standard-Ereignis generate_lead (fuer GA4-Berichte).
  window.abpTrackConversion = function () {
    if (!gtagLoaded) return; // ohne Einwilligung kein Tracking
    gtag("event", "ads_conversion_Lead_Formular_senden_1", {
      page_location: location.href,
    });
    gtag("event", "generate_lead", {
      form: "kontaktformular",
    });
  };

  // Frühere Entscheidung anwenden
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === "granted") { grant(); return; }
  if (saved === "denied") { return; }

  // --- Banner anzeigen ---
  function save(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {} }

  function buildBanner() {
    var b = document.createElement("div");
    b.className = "abp-consent";
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-label", "Cookie-Einwilligung");
    b.innerHTML =
      '<div class="abp-consent-inner">' +
        '<p>Wir verwenden Cookies, um anonym zu messen, wie unsere Website und Werbung genutzt werden. ' +
        'Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
        '<div class="abp-consent-actions">' +
          '<button type="button" class="abp-btn abp-btn-ghost" data-act="deny">Nur notwendige</button>' +
          '<button type="button" class="abp-btn abp-btn-solid" data-act="allow">Akzeptieren</button>' +
        '</div>' +
      '</div>';
    b.addEventListener("click", function (e) {
      var act = e.target.getAttribute("data-act");
      if (act === "allow") { save("granted"); grant(); b.remove(); }
      else if (act === "deny") { save("denied"); b.remove(); }
    });
    document.body.appendChild(b);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildBanner);
  } else {
    buildBanner();
  }
})();
