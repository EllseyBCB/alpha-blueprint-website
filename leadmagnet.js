/* Lead-Magnet-Formular -> Supabase (Tabelle: kontakt_anfragen) + PDF-Download.
   Speichert den Interessenten wie eine normale Anfrage (im Admin sichtbar),
   liefert danach sofort die Checkliste aus und meldet eine Conversion. */
(function () {
  var form = document.getElementById("lead-form");
  if (!form) return;
  var status = document.getElementById("lead-status");
  var success = document.getElementById("lead-success");
  var dl = document.getElementById("lead-download");

  var ENDPOINT = "https://gwoqublnvyefszckjyqh.supabase.co/rest/v1/kontakt_anfragen";
  var KEY = "sb_publishable_ErEYfc9_fLQ362TZ2ldzpg_BVgtndMw";
  var PDF = "downloads/ki-checkliste-kmu.pdf";

  function set(msg, color) { if (status) { status.textContent = msg; status.style.color = color || ""; } }

  function deliver() {
    if (success) success.style.display = "block";
    // automatischer Download
    try {
      var a = document.createElement("a");
      a.href = PDF; a.download = "KI-Checkliste-KMU.pdf";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {}
    // Tracking: Lead + Datei-Download (nur nach Einwilligung aktiv)
    if (window.abpTrackConversion) window.abpTrackConversion();
    if (window.gtag) window.gtag("event", "file_download", { file_name: "ki-checkliste-kmu.pdf" });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');

    // Spamschutz
    if (form.website && form.website.value.trim() !== "") { deliver(); return; }

    var email = form.email.value.trim();
    if (!email) { set("Bitte geben Sie Ihre E-Mail-Adresse ein.", "#c0392b"); return; }
    if (form.datenschutz && !form.datenschutz.checked) { set("Bitte bestätigen Sie die Datenschutzerklärung.", "#c0392b"); return; }

    var data = {
      vorname: form.vorname.value.trim() || "—",
      nachname: "(Lead-Magnet)",
      email: email,
      nachricht: "📋 KI-Checkliste angefordert (Lead-Magnet)",
    };

    var original = btn.textContent;
    btn.disabled = true; btn.textContent = "Wird vorbereitet…"; set("Wird vorbereitet…");
    try {
      var res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      btn.style.display = "none";
      set("");
      deliver();
    } catch (err) {
      // Auch bei Speicherfehler bekommt der Nutzer die Checkliste
      btn.disabled = false; btn.textContent = original;
      deliver();
    }
  });
})();
