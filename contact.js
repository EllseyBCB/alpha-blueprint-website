/* Kontaktformular -> Supabase (Tabelle: kontakt_anfragen).
   Der publishable Key ist bewusst öffentlich; durch Row Level Security
   ist nur das Eintragen erlaubt, Lesen nur für den Inhaber im Dashboard. */
(function () {
  var form = document.getElementById("kontakt-form");
  if (!form) return;
  var status = document.getElementById("kontakt-status");

  var ENDPOINT = "https://gwoqublnvyefszckjyqh.supabase.co/rest/v1/kontakt_anfragen";
  var KEY = "sb_publishable_ErEYfc9_fLQ362TZ2ldzpg_BVgtndMw";

  function set(msg, color) {
    if (!status) return;
    status.textContent = msg;
    status.style.color = color || "";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var data = {
      vorname: form.vorname.value.trim(),
      nachname: form.nachname.value.trim(),
      email: form.email.value.trim(),
      nachricht: form.nachricht.value.trim(),
    };
    if (!data.vorname || !data.nachname || !data.email || !data.nachricht) {
      set("Bitte füllen Sie alle Felder aus.", "#c0392b");
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
      set("✓ Vielen Dank! Ihre Anfrage wurde übermittelt – wir melden uns zeitnah bei Ihnen.", "#1f9e57");
    } catch (err) {
      btn.disabled = false;
      btn.textContent = original;
      set("Leider gab es ein Problem beim Senden. Bitte erneut versuchen oder direkt an info@alphablueprint.de schreiben.", "#c0392b");
    }
  });
})();
