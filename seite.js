/* Alpha Blueprint – Verhalten der Seite.
   Kein Scroll-Lauscher: Alles, was auf die Position reagiert, läuft über
   IntersectionObserver oder über CSS-Scroll-Zeitachsen in stil.css. */
(function () {
  var doc = document.documentElement;
  var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Menü am Handy */
  var knopf = document.querySelector(".menue-knopf");
  if (knopf) {
    knopf.addEventListener("click", function () {
      var offen = doc.classList.toggle("menue-offen");
      knopf.setAttribute("aria-expanded", offen ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { doc.classList.remove("menue-offen"); knopf.setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && doc.classList.contains("menue-offen")) { doc.classList.remove("menue-offen"); knopf.setAttribute("aria-expanded", "false"); knopf.focus(); }
    });
  }

  /* Kopfleiste bekommt Grund, sobald die Seite nicht mehr ganz oben steht */
  var kopf = document.getElementById("kopf");
  if (kopf && "IntersectionObserver" in window) {
    var marke = document.createElement("div");
    marke.style.cssText = "position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none";
    document.body.prepend(marke);
    new IntersectionObserver(function (e) { kopf.classList.toggle("gerollt", !e[0].isIntersecting); }).observe(marke);
  }

  /* Einblenden */
  var zeigen = document.querySelectorAll(".zeigen");
  if ("IntersectionObserver" in window && !ruhig) {
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("da"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    zeigen.forEach(function (el) { io.observe(el); });
  } else {
    zeigen.forEach(function (el) { el.classList.add("da"); });
  }

  /* Angepinnte Bildstrecke: der Schritt in der Bildmitte bestimmt das Bild */
  document.querySelectorAll(".strecke").forEach(function (strecke) {
    var schritte = strecke.querySelectorAll(".schritt");
    var bilder = strecke.querySelectorAll(".bilder figure");
    if (!schritte.length || !("IntersectionObserver" in window)) return;
    function setzen(nr) {
      schritte.forEach(function (s, i) { s.classList.toggle("an", i === nr); });
      bilder.forEach(function (b, i) { b.classList.toggle("an", i === nr); });
    }
    setzen(0);
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { if (e.isIntersecting) setzen(Array.prototype.indexOf.call(schritte, e.target)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    schritte.forEach(function (s) { beob.observe(s); });
  });

  /* Regel-Werkstatt: ein Satz wird zur Wenn-Dann-Regel */
  document.querySelectorAll("[data-werkstatt]").forEach(function (w) {
    var knoepfe = w.querySelectorAll(".beispiel");
    var eingabe = w.querySelector(".eingabe");
    var zeilen = w.querySelector(".regel");
    var fuss = w.querySelector(".regel-fuss span");
    var lauf = 0;

    function zeigen(knopf) {
      var nr = ++lauf;
      knoepfe.forEach(function (k) { k.setAttribute("aria-pressed", k === knopf ? "true" : "false"); });
      var satz = knopf.getAttribute("data-satz");
      var regel = JSON.parse(knopf.getAttribute("data-regel"));
      zeilen.innerHTML = "";
      regel.forEach(function (r) {
        var z = document.createElement("div");
        z.className = "zeile" + (r[0] === "Dann" ? " dann" : "");
        var b = document.createElement("b"); b.textContent = r[0];
        var s = document.createElement("span"); s.textContent = r[1];
        z.appendChild(b); z.appendChild(s); zeilen.appendChild(z);
      });
      if (fuss) fuss.textContent = knopf.getAttribute("data-fuss") || "";
      var alle = zeilen.querySelectorAll(".zeile");
      function regelZeigen() { alle.forEach(function (z, i) { setTimeout(function () { if (nr === lauf) z.classList.add("an"); }, ruhig ? 0 : 220 * i); }); }
      if (ruhig) { eingabe.textContent = satz; eingabe.classList.add("fertig"); regelZeigen(); return; }
      eingabe.classList.remove("fertig");
      eingabe.textContent = "";
      var i = 0;
      (function tippen() {
        if (nr !== lauf) return;
        i += 2;
        eingabe.textContent = satz.slice(0, i);
        if (i < satz.length) { setTimeout(tippen, 18); }
        else { eingabe.classList.add("fertig"); setTimeout(regelZeigen, 260); }
      })();
    }
    knoepfe.forEach(function (k) { k.addEventListener("click", function () { zeigen(k); }); });
    if (knoepfe[0]) {
      if ("IntersectionObserver" in window) {
        var einmal = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { zeigen(knoepfe[0]); einmal.disconnect(); } }, { threshold: 0.35 });
        einmal.observe(w);
      } else { zeigen(knoepfe[0]); }
    }
  });

  /* Kontaktformular: Thema aus dem Link vorbelegen (?thema=…) */
  var feld = document.querySelector("#kontakt-form textarea[name=nachricht]");
  if (feld) {
    var thema = new URLSearchParams(location.search).get("thema");
    var texte = {
      "alpha-prime": "Ich interessiere mich für Alpha Prime und hätte gern ein Angebot für unseren Betrieb.\n\nUnser Betrieb: ",
      "alpha-automation": "Ich möchte Alpha Automation testen. Bitte schalten Sie uns den Zugang frei.\n\nUnser Betrieb: ",
      "beratung": "Ich möchte wissen, wo sich KI in unserem Betrieb lohnt.\n\nUnser Betrieb: ",
      "automatisierung": "Wir haben einen Ablauf, den wir automatisieren möchten: "
    };
    if (thema && texte[thema] && !feld.value) feld.value = texte[thema];
  }
})();
