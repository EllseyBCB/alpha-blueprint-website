/* ============================================================
   Cookie-Consent-Banner + Google Ads Conversion-Tracking
   ------------------------------------------------------------
   SO AKTIVIERST DU DAS TRACKING:
   1. Google-Ads-Konto -> Tools -> Conversions -> neue Conversion
      "Website" anlegen (Aktion: Lead/Kontakt). Du bekommst:
        - eine Conversion-ID  (Format: AW-123456789)
        - ein Conversion-Label (Format: AbCdEfGhIj)
   2. Trage beide unten bei AW_ID und CONVERSION_LABEL ein.
   Solange AW_ID den Platzhalter enthält, passiert NICHTS
   (kein Banner, kein Tracking) – die Seite bleibt DSGVO-neutral.
   ============================================================ */
(function () {
  var AW_ID = "AW-XXXXXXXXXX";        // <-- hier deine Google-Ads-ID eintragen
  var CONVERSION_LABEL = "XXXXXXXXXX"; // <-- hier dein Conversion-Label eintragen
  var STORAGE_KEY = "abp-consent-v1";

  // Noch nicht konfiguriert -> nichts tun.
  if (AW_ID.indexOf("XXXX") !== -1) {
    window.abpTrackConversion = function () {}; // No-Op, damit contact.js nicht bricht
    return;
  }

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
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + AW_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", AW_ID);
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

  // Conversion-Auslöser für das Kontaktformular
  window.abpTrackConversion = function () {
    if (!gtagLoaded) return; // ohne Einwilligung kein Conversion-Hit
    gtag("event", "conversion", {
      send_to: AW_ID + "/" + CONVERSION_LABEL,
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
        '<p>Wir verwenden Cookies, um anonym zu messen, wie unsere Werbung wirkt. ' +
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
