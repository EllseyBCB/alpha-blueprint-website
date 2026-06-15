/* Admin-App: zeigt die Formular-Anfragen aus Supabase.
   Lesen ist per Row Level Security nur für das eingeloggte Admin-Konto erlaubt. */
(function () {
  var SUPABASE_URL = "https://gwoqublnvyefszckjyqh.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ErEYfc9_fLQ362TZ2ldzpg_BVgtndMw";
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var $ = function (id) { return document.getElementById(id); };
  var loginView = $("login"), dashView = $("dash"), boot = $("boot");

  function show(view) {
    boot.classList.add("hidden");
    loginView.classList.toggle("hidden", view !== "login");
    dashView.classList.toggle("hidden", view !== "dash");
  }

  function fmtDate(s) {
    try {
      return new Date(s).toLocaleString("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch (e) { return s; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  async function loadData() {
    var list = $("list");
    list.innerHTML = '<div class="center">Lädt Anfragen…</div>';
    var res = await sb.from("kontakt_anfragen").select("*").order("created_at", { ascending: false });
    if (res.error) {
      list.innerHTML = '<div class="empty"><div class="big">⚠️</div>Konnte Anfragen nicht laden: ' + esc(res.error.message) + "</div>";
      return;
    }
    var rows = res.data || [];
    $("count").textContent = rows.length;
    var weekAgo = Date.now() - 7 * 864e5;
    $("count7").textContent = rows.filter(function (r) { return new Date(r.created_at).getTime() >= weekAgo; }).length;

    if (!rows.length) {
      list.innerHTML = '<div class="empty"><div class="big">📭</div>Noch keine Anfragen. Sobald jemand das Kontaktformular absendet, erscheint die Anfrage hier.</div>';
      return;
    }
    list.innerHTML = rows.map(function (r) {
      var mail = esc(r.email);
      var name = esc(r.vorname + " " + r.nachname);
      return '<div class="entry" data-id="' + esc(r.id) + '">' +
        '<div class="head"><span class="name">' + name + "</span>" +
        '<span class="date">' + esc(fmtDate(r.created_at)) + "</span></div>" +
        '<div class="mail"><a href="mailto:' + mail + '">' + mail + "</a></div>" +
        '<div class="text">' + esc(r.nachricht) + "</div>" +
        '<div class="actions"><button class="del" data-id="' + esc(r.id) + '" data-name="' + name + '">🗑 Löschen</button></div>' +
        "</div>";
    }).join("");
  }

  async function render(session) {
    if (session && session.user) {
      $("who").textContent = "Angemeldet als " + session.user.email;
      show("dash");
      loadData();
    } else {
      show("login");
    }
  }

  // Login
  $("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = $("login-btn"), msg = $("login-msg");
    msg.className = "msg"; msg.textContent = "Anmeldung läuft…";
    btn.disabled = true;
    var res = await sb.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
    btn.disabled = false;
    if (res.error) {
      msg.className = "msg err";
      msg.textContent = "Login fehlgeschlagen: " + res.error.message;
    } else {
      msg.className = "msg ok"; msg.textContent = "Erfolgreich!";
    }
  });

  $("logout").addEventListener("click", function () { sb.auth.signOut(); });
  $("refresh").addEventListener("click", loadData);

  // Eintrag löschen (nur Admin per RLS erlaubt)
  $("list").addEventListener("click", async function (e) {
    var btn = e.target.closest && e.target.closest(".del");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var name = btn.getAttribute("data-name") || "diesen Eintrag";
    if (!confirm("Anfrage von " + name + " wirklich löschen? Das kann nicht rückgängig gemacht werden.")) return;
    btn.disabled = true; btn.textContent = "Löscht…";
    var res = await sb.from("kontakt_anfragen").delete().eq("id", id);
    if (res.error) {
      alert("Löschen fehlgeschlagen: " + res.error.message);
      btn.disabled = false; btn.textContent = "🗑 Löschen";
      return;
    }
    var card = btn.closest(".entry");
    if (card) card.remove();
    var c = $("count");
    if (c) c.textContent = Math.max(0, (parseInt(c.textContent, 10) || 1) - 1);
    if (!$("list").querySelector(".entry")) loadData();
  });

  sb.auth.onAuthStateChange(function (_e, session) { render(session); });
  sb.auth.getSession().then(function (r) { render(r.data.session); });
})();
