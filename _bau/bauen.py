#!/usr/bin/env python3
"""Baut die Website aus _bau/seiten/ in den Projektordner.

Jede Quelldatei beginnt mit einem Kommentar <!--{...}--> mit den Seitenangaben
(Titel, Beschreibung, Pfad, Navigation, strukturierte Daten). Der Rest ist der
Inhalt von <main>. Kopf, Navigation, Fuß, SEO-Angaben und die Sitemap entstehen
hier, damit keine Seite von den anderen abweicht.

Aufruf:  python3 _bau/bauen.py
"""
import html
import json
import re
from datetime import date
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
QUELLEN = WURZEL / "_bau" / "seiten"
SYMBOLE = WURZEL / "_bau" / "symbole"
DOMAIN = "https://alphablueprint.de"
VERSION = "20261008"
HEUTE = date.today().isoformat()

FIRMA = {
    "@type": "ProfessionalService",
    "@id": DOMAIN + "/#firma",
    "name": "Alpha Blueprint",
    "legalName": "Alpha Blueprint Management and Consulting - FZCO",
    "url": DOMAIN + "/",
    "logo": DOMAIN + "/icon-512.png",
    "image": DOMAIN + "/og-image.jpg",
    "description": "KI-Assistent Jarvis, die App Alpha Automation, KI-Beratung und Prozessautomatisierung für kleine und mittlere Unternehmen.",
    "email": "info@alphablueprint.de",
    "telephone": "+49 174 6811322",
    "priceRange": "Auf Anfrage",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "IFZA Business Park, Dubai Digital Park, Premises No. 74057-001",
        "addressLocality": "Dubai",
        "postalCode": "00000",
        "addressCountry": "AE",
    },
    "areaServed": [{"@type": "Country", "name": n} for n in ("Deutschland", "Österreich", "Schweiz")],
    "founder": {"@id": DOMAIN + "/ueber-uns.html#elia"},
    "knowsAbout": ["Künstliche Intelligenz", "KI-Assistenten", "Prozessautomatisierung",
                   "E-Mail-Automatisierung", "KI-Beratung", "Softwareentwicklung"],
}
PERSON = {
    "@type": "Person",
    "@id": DOMAIN + "/ueber-uns.html#elia",
    "name": "Elia Nedvidek",
    "jobTitle": "Inhaber und Entwickler",
    "worksFor": {"@id": DOMAIN + "/#firma"},
    "image": DOMAIN + "/assets/elia-portrait.webp",
    "url": DOMAIN + "/ueber-uns.html",
}

NAV = [
    ("jarvis", "/jarvis/", "Jarvis"),
    ("aa", "/alpha-automation/", "Alpha Automation"),
    ("beratung", "/ki-beratung.html", "KI-Beratung"),
    ("automatisierung", "/workflow-automationen.html", "Automatisierung"),
    ("ueber", "/ueber-uns.html", "Über mich"),
    ("ratgeber", "/ratgeber.html", "Ratgeber"),
]

FUSS_SPALTEN = [
    ("Produkte", [("/jarvis/", "Jarvis"), ("/alpha-automation/", "Alpha Automation"), ("/leistungen.html", "Alle Leistungen")]),
    ("Leistungen", [("/ki-beratung.html", "KI-Beratung"), ("/workflow-automationen.html", "Prozessautomatisierung"),
                    ("/ablauf.html", "Ablauf"), ("/faq.html", "Häufige Fragen")]),
    ("Alpha Blueprint", [("/ueber-uns.html", "Über mich"), ("/ratgeber.html", "Ratgeber"), ("/checkliste.html", "KI-Checkliste"),
                         ("/kontakt.html", "Kontakt"), ("/impressum.html", "Impressum"), ("/datenschutz.html", "Datenschutz")]),
]


def symbol(name, klasse=""):
    svg = (SYMBOLE / f"{name}.svg").read_text().strip()
    zusatz = ' aria-hidden="true" focusable="false"' + (f' class="{klasse}"' if klasse else "")
    return svg.replace("<svg ", "<svg" + zusatz + " ", 1)


def a_zeichen():
    return '<img src="/assets/logo-a-white.png" width="34" height="30" alt="">'


AA_ZEICHEN = ('<svg viewBox="190 190 644 570" fill="currentColor" aria-hidden="true" focusable="false" class="{k}">'
              '<path d="M512 208 819 741H730L512 362 293 741H205Z"/><path d="M512 493 655 741H566L512 647 457 741H369Z"/></svg>')

KONTAKTFORMULAR = """
<form id="kontakt-form" class="formular" novalidate>
  <div class="reihe">
    <label>Vorname<input name="vorname" autocomplete="given-name" required placeholder="Ihr Vorname"></label>
    <label>Nachname<input name="nachname" autocomplete="family-name" required placeholder="Ihr Nachname"></label>
  </div>
  <label>E-Mail<input type="email" name="email" autocomplete="email" inputmode="email" required placeholder="name@firma.de"></label>
  <label>Worum geht es?<textarea name="nachricht" required placeholder="Kurz Ihr Betrieb und wo es hakt. Zum Beispiel: Wir beantworten jeden Tag 40 ähnliche Mails."></textarea></label>
  <div class="falle" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
  <label class="zustimmung"><input type="checkbox" name="datenschutz" required> <span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden. Details in der <a href="/datenschutz.html">Datenschutzerklärung</a>.</span></label>
  <button class="knopf" type="submit">Anfrage senden</button>
  <p id="kontakt-status" role="status" aria-live="polite"></p>
</form>"""


def ersetzen(inhalt):
    inhalt = re.sub(r"\{\{symbol:([a-z0-9-]+)(?:\s+([a-z0-9 -]+))?\}\}", lambda m: symbol(m.group(1), m.group(2) or ""), inhalt)
    inhalt = re.sub(r"\{\{aa-zeichen(?:\s+([a-z0-9 -]+))?\}\}", lambda m: AA_ZEICHEN.format(k=m.group(1) or ""), inhalt)
    inhalt = inhalt.replace("{{kontaktformular}}", KONTAKTFORMULAR)
    inhalt = inhalt.replace("{{pfeil}}", symbol("arrow-right"))
    return inhalt


def fragen_aus(inhalt):
    """FAQPage-Daten aus den <details>-Blöcken der Seite, damit Text und Markup nie auseinanderlaufen."""
    paare = []
    for frage, antwort in re.findall(r"<summary>(.*?)</summary>\s*(.*?)</details>", inhalt, re.S):
        text = re.sub(r"<[^>]+>", "", antwort)
        text = re.sub(r"\s+", " ", html.unescape(text)).strip()
        paare.append({"@type": "Question", "name": html.unescape(re.sub(r"<[^>]+>", "", frage)).strip(),
                      "acceptedAnswer": {"@type": "Answer", "text": text}})
    return paare


def navigation(aktiv):
    teile = []
    for schluessel, url, name in NAV:
        aktuell = ' aria-current="page"' if schluessel == aktiv else ""
        teile.append(f'<a href="{url}"{aktuell}>{name}</a>')
    teile.append('<a class="knopf klein" href="/kontakt.html">Erstgespräch vereinbaren</a>')
    return "".join(teile)


def fuss():
    spalten = "".join(
        f'<div><h2>{titel}</h2><ul>' + "".join(f'<li><a href="{u}">{n}</a></li>' for u, n in links) + "</ul></div>"
        for titel, links in FUSS_SPALTEN)
    return f"""
<footer class="fuss">
  <div class="rahmen">
    <div class="raster">
      <div class="ueber">
        <a class="marke" href="/">{a_zeichen()}<span>Alpha Blueprint<small>KI · Automatisierung · Entwicklung</small></span></a>
        <p>Jarvis, Alpha Automation und Automatisierungen nach Maß. Entwickelt und betreut von Elia Nedvidek.</p>
        <ul class="kontakt-mini">
          <li><a href="mailto:info@alphablueprint.de">info@alphablueprint.de</a></li>
          <li><a href="tel:+491746811322">+49 174 6811322</a></li>
        </ul>
      </div>
      {spalten}
    </div>
    <div class="zeile-unten"><span>© {date.today().year} Alpha Blueprint Management and Consulting - FZCO</span><span>Erstgespräch kostenlos und unverbindlich</span></div>
  </div>
</footer>"""


def pfadkette(kette):
    if not kette:
        return "", None
    alle = [("Start", "/")] + kette
    sichtbar = '<nav class="pfad" aria-label="Brotkrumen"><ol>' + "".join(
        (f'<li><a href="{u}">{n}</a></li>' if i < len(alle) - 1 else f'<li aria-current="page">{n}</li>')
        for i, (n, u) in enumerate(alle)) + "</ol></nav>"
    daten = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": DOMAIN + u} for i, (n, u) in enumerate(alle)]}
    return sichtbar, daten


def seite_bauen(quelle):
    roh = quelle.read_text()
    m = re.match(r"\s*<!--(\{.*?\})-->\s*", roh, re.S)
    if not m:
        raise SystemExit(f"Kein Kopfkommentar in {quelle}")
    meta = json.loads(m.group(1))
    inhalt = roh[m.end():]
    ziel = WURZEL / quelle.relative_to(QUELLEN)

    if meta.get("weiterleitung"):
        nach = meta["weiterleitung"]
        ziel.parent.mkdir(parents=True, exist_ok=True)
        ziel.write_text(f"""<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(meta['titel'])}</title><meta name="robots" content="noindex,follow">
<link rel="canonical" href="{DOMAIN}{nach}"><meta http-equiv="refresh" content="0; url={nach}">
<style>body{{background:#05090e;color:#e6f3f9;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}}a{{color:#a8ecfa}}</style>
</head><body><p>Diese Seite ist umgezogen: <a href="{nach}">weiter</a></p></body></html>
""")
        return None

    pfad = meta["pfad"]
    kanonisch = DOMAIN + pfad
    bild = DOMAIN + meta.get("bild", "/og-image.jpg")
    kette_html, kette_daten = pfadkette([tuple(x) for x in meta.get("kette", [])])
    inhalt = ersetzen(inhalt).replace("{{pfadkette}}", kette_html)

    graph = [FIRMA, PERSON, {"@type": "WebSite", "@id": DOMAIN + "/#website", "name": "Alpha Blueprint",
                             "url": DOMAIN + "/", "inLanguage": "de-DE", "publisher": {"@id": DOMAIN + "/#firma"}},
             {"@type": "WebPage", "@id": kanonisch + "#seite", "url": kanonisch, "name": meta["titel"],
              "description": meta["beschreibung"], "inLanguage": "de-DE", "isPartOf": {"@id": DOMAIN + "/#website"},
              "about": {"@id": DOMAIN + "/#firma"}, "dateModified": HEUTE}]
    if kette_daten:
        graph.append(kette_daten)
    graph += meta.get("daten", [])
    fragen = fragen_aus(inhalt)
    if fragen:
        graph.append({"@type": "FAQPage", "@id": kanonisch + "#fragen", "mainEntity": fragen})
    jsonld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))

    vorladen = "".join(f'<link rel="preload" as="image" href="{b}" fetchpriority="high">' for b in meta.get("vorladen", []))
    skripte = "".join(f'<script src="{s}?v={VERSION}" defer></script>' for s in meta.get("skripte", []))
    robots = "noindex,follow" if meta.get("noindex") else "index,follow,max-image-preview:large,max-snippet:-1"
    t = html.escape(meta["titel"])
    b = html.escape(meta["beschreibung"])
    og_titel = html.escape(meta.get("og_titel", meta["titel"]))
    welt = meta.get("welt", "")

    seite = f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{b}">
<link rel="canonical" href="{kanonisch}">
<meta name="robots" content="{robots}">
<meta name="author" content="Elia Nedvidek">
<meta name="theme-color" content="#05090e">
<link rel="icon" type="image/png" href="/assets/logo-cyan.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/neu/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/xn7gYHE41ni1AdIRggexSg.woff2" as="font" type="font/woff2" crossorigin>
{vorladen}
<link rel="stylesheet" href="/stil.css?v={VERSION}">
<meta property="og:type" content="{meta.get('og_typ', 'website')}">
<meta property="og:site_name" content="Alpha Blueprint">
<meta property="og:locale" content="de_DE">
<meta property="og:title" content="{og_titel}">
<meta property="og:description" content="{b}">
<meta property="og:url" content="{kanonisch}">
<meta property="og:image" content="{bild}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{og_titel}">
<meta name="twitter:description" content="{b}">
<meta name="twitter:image" content="{bild}">
<script type="application/ld+json">{jsonld}</script>
<script>document.documentElement.classList.add("js")</script>
</head>
<body class="{welt}">
<a class="springen" href="#inhalt">Zum Inhalt springen</a>
<header class="kopf" id="kopf">
  <div class="rahmen">
    <a class="marke" href="/" aria-label="Alpha Blueprint, zur Startseite">{a_zeichen()}<span>Alpha Blueprint<small>Elia Nedvidek</small></span></a>
    <button class="menue-knopf" type="button" aria-expanded="false" aria-controls="nav"><i></i><i></i><i></i><span class="sr-only">Menü</span></button>
    <nav class="nav" id="nav" aria-label="Hauptnavigation">{navigation(meta.get('nav'))}</nav>
  </div>
</header>
<main id="inhalt">
{inhalt.strip()}
</main>
{fuss()}
<script src="/seite.js?v={VERSION}" defer></script>
<script src="/consent.js?v={VERSION}" defer></script>
{skripte}
</body>
</html>
"""
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(seite)
    return None if meta.get("noindex") else (pfad, meta.get("prioritaet", "0.6"))


def main():
    eintraege = []
    for quelle in sorted(QUELLEN.rglob("*.html")):
        e = seite_bauen(quelle)
        if e:
            eintraege.append(e)
    eintraege.sort(key=lambda e: (-float(e[1]), e[0]))
    (WURZEL / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "".join(f"  <url><loc>{DOMAIN}{p}</loc><lastmod>{HEUTE}</lastmod><priority>{pr}</priority></url>\n" for p, pr in eintraege) +
        "</urlset>\n")
    print(f"{len(list(QUELLEN.rglob('*.html')))} Seiten gebaut, {len(eintraege)} in der Sitemap.")


if __name__ == "__main__":
    main()
