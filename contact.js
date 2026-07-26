/* Kontaktformular -> Supabase (Tabelle: kontakt_anfragen).
   Der publishable Key ist bewusst öffentlich; durch Row Level Security
   ist nur das Eintragen erlaubt, Lesen nur für den Inhaber im Dashboard. */
(function () {
  var form = document.getElementById("kontakt-form");
  if (!form) return;
  var status = document.getElementById("kontakt-status");

  var ENDPOINT = "https://gwoqublnvyefszckjyqh.supabase.co/rest/v1/kontakt_anfragen";
  var KEY = "sb_publishable_ErEYfc9_fLQ362TZ2ldzpg_BVgtndMw";

  /* Meldungen bewusst OHNE "du" und ohne "Sie": dieses Skript läuft auf der
     Startseite (gesiezt) und auf der Landingpage für Arbeitssuchende (geduzt).
     Vorher siezten die Meldungen überall - mitten im Formular der Du-Seite. */
  function set(msg, color, fehler) {
    if (!status) return;
    status.textContent = msg;
    status.style.color = color || "";
    // Auf dem Handy steht die Meldung unter dem Knopf und damit oft außerhalb
    // des Bildes. Ohne das hier tippt jemand auf Senden und sieht: nichts.
    if (fehler && status.scrollIntoView) {
      status.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');

    // Spamschutz: ausgefülltes Honeypot-Feld -> wie Erfolg behandeln, aber nichts senden.
    if (form.website && form.website.value.trim() !== "") {
      form.reset();
      btn.textContent = "Gesendet ✓";
      set("✓ Angekommen! Antwort innerhalb von 24 Stunden werktags – von Elia Nedvidek persönlich.", "#1f9e57");
      return;
    }

    var data = {
      vorname: form.vorname.value.trim(),
      nachname: form.nachname.value.trim(),
      email: form.email.value.trim(),
      nachricht: form.nachricht.value.trim(),
    };
    if (!data.vorname || !data.nachname || !data.email || !data.nachricht) {
      set("Bitte alle Felder ausfüllen.", "#c0392b", true);
      return;
    }
    if (form.datenschutz && !form.datenschutz.checked) {
      set("Bitte noch der Datenschutzerklärung zustimmen.", "#c0392b", true);
      return;
    }
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Wird gesendet…";
    set("Wird gesendet…");
    try {
      var res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          apikey: KEY,
          Authorization: "Bearer " + KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset();
      btn.textContent = "Gesendet ✓";
      set("✓ Angekommen! Antwort innerhalb von 24 Stunden werktags – von Elia Nedvidek persönlich.", "#1f9e57");
      // Google-Ads-Conversion melden (nur wenn Einwilligung erteilt und Tracking aktiv).
      if (window.abpTrackConversion) window.abpTrackConversion();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = original;
      set("Das Senden hat nicht geklappt. Bitte noch einmal versuchen – oder direkt an info@alphablueprint.de schreiben.", "#c0392b", true);
    }
  });
})();
