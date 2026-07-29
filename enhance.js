/* Alpha Blueprint – interaktive Erweiterungen (additiv, robust gegen fehlende Elemente) */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* 1) Scroll-Fortschrittsbalken + Parallaxe-Ebene (rAF-gebündelt, ein Handler) */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  const heroBg = document.querySelector(".hero-background");
  const heroContent = document.querySelector(".hero-content");

  /* Parallaxe-Ziele: große Bildflächen driften leicht gegen die Scroll-Richtung */
  const wide = window.matchMedia("(min-width: 900px)").matches;
  const parallax = [];
  if (!reduce && wide) {
    const register = (sel, speed) => {
      document.querySelectorAll(sel).forEach((el) => parallax.push({ el, speed, visible: false }));
    };
    register(".showcase > img", 58);
    register(".page-hero > img", 44);
    register(".founder-photo", 26);
    if (parallax.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const t = parallax.find((p) => p.el === e.target);
          if (t) t.visible = e.isIntersecting;
        });
      }, { rootMargin: "120px 0px" });
      parallax.forEach((p) => io.observe(p.el));
    }
    /* Hero-Text-Parallaxe erst nach der Eingangs-Animation scharf schalten */
    if (heroContent) setTimeout(() => heroContent.classList.add("parallax-live"), 1400);

    /* Überschriften in maskierte Wörter zerlegen (Original als aria-label erhalten) */
    document.querySelectorAll(".section-heading h2, .split-copy h2, .contact-copy h2").forEach((h) => {
      h.setAttribute("aria-label", h.textContent.trim());
      let wi = 0;
      const split = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
              } else {
                const w = document.createElement("span");
                w.className = "w";
                const inner = document.createElement("i");
                inner.textContent = part;
                inner.style.setProperty("--wi", wi++);
                w.appendChild(inner);
                frag.appendChild(w);
              }
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
            split(child);
          }
        });
      };
      split(h);
      h.classList.add("split-h2");
    });
    const wordsIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("words-in");
          wordsIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll(".split-h2").forEach((h) => wordsIo.observe(h));
  }
  /* Typewriter für die Hero-Headline (Original bleibt als aria-label erhalten) */
  const heroH1 = document.querySelector(".hero-content h1");
  if (heroH1 && !reduce) {
    const segs = [];
    heroH1.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
        segs.push({ node: n, text: n.textContent });
      } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN" && n.firstChild) {
        segs.push({ node: n.firstChild, text: n.textContent });
      }
    });
    if (segs.length) {
      heroH1.setAttribute("aria-label", heroH1.textContent.trim());
      heroH1.style.minHeight = heroH1.offsetHeight + "px";
      segs.forEach((s) => { s.node.textContent = ""; });
      const cursor = document.createElement("span");
      cursor.className = "type-cursor";
      cursor.setAttribute("aria-hidden", "true");
      let si = 0, ci = 0;
      const typeNext = () => {
        if (si >= segs.length) {
          setTimeout(() => cursor.remove(), 1600);
          return;
        }
        const s = segs[si];
        ci++;
        s.node.textContent = s.text.slice(0, ci);
        s.node.parentNode === heroH1
          ? heroH1.insertBefore(cursor, s.node.nextSibling)
          : s.node.parentNode.appendChild(cursor);
        if (ci >= s.text.length) { si++; ci = 0; }
        setTimeout(typeNext, 38);
      };
      setTimeout(typeNext, 550);
    }
  }

  const showcaseImg = document.querySelector(".showcase > img");
  const showcaseH2 = document.querySelector(".showcase-content h2");
  const showcaseSec = document.querySelector(".showcase");

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const vh = h.clientHeight;
      const y = h.scrollTop;
      const max = h.scrollHeight - vh;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      if (heroBg && !reduce && y < vh * 1.2) {
        heroBg.style.transform = wide
          ? "scale(" + (1.04 + Math.min(1, y / vh) * 0.09).toFixed(4) + ")"   // angepinnter Hero: langsamer Zoom unter dem Vorhang
          : "translateY(" + y * 0.18 + "px) scale(1.06)";                     // mobil: klassische Drift
      }
      if (heroContent && heroContent.classList.contains("parallax-live") && y < vh * 1.2) {
        heroContent.style.setProperty("--hy", (y * -0.06).toFixed(1) + "px");
        heroContent.style.setProperty("--ho", Math.max(0, 1 - y / (vh * 0.85)).toFixed(3));
      }
      for (const p of parallax) {
        if (!p.visible) continue;
        const r = p.el.getBoundingClientRect();
        const rel = (r.top + r.height / 2 - vh / 2) / vh;
        p.el.style.setProperty("--py", (rel * p.speed).toFixed(1) + "px");
      }
      /* Showcase: Zoom atmet zur Mitte hin, Headline füllt sich mit Gold */
      if (showcaseSec && !reduce && parallax.length) {
        const r = showcaseSec.getBoundingClientRect();
        if (r.bottom > -100 && r.top < vh + 100) {
          const rel = (r.top + r.height / 2 - vh / 2) / vh;
          if (showcaseImg) {
            const near = 1 - Math.min(1, Math.abs(rel));
            showcaseImg.style.setProperty("--pz", (1.08 + near * 0.1).toFixed(3));
          }
          if (showcaseH2) {
            const p = Math.min(1, Math.max(0, (0.55 - rel) / 0.75));
            showcaseH2.style.setProperty("--fill", (100 - p * 100).toFixed(1) + "%");
          }
        }
      }
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 2) Aktiver Navigationspunkt anhand der sichtbaren Sektion */
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  if (sections.length && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("active"));
            const link = byId.get(e.target.id);
            if (link) link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  /* 3) Zähler in der Erfahrungs-Karte hochzählen (z. B. 100%) */
  const stat = document.querySelector(".experience-card strong");
  if (stat && !reduce) {
    const raw = stat.textContent.trim();
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      const suffix = raw.replace(/[0-9]/g, "");
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          obs.disconnect();
          const start = performance.now();
          const dur = 1100;
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            stat.textContent = Math.round(num * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.6 });
      io.observe(stat);
    }
  }

  /* 4) 3D-Tilt auf Karten: nur Maus-Geräte, weich per rAF-Interpolation */
  if (finePointer && !reduce) {
    const targets = document.querySelectorAll(
      ".service-card, .benefit-card, .ratgeber-card, .founder-photo img, .content-media img, .split-image > img"
    );
    const MAX_TILT = 6;
    targets.forEach((el) => {
      el.classList.add("tilt");
      const glare = document.createElement("div");
      glare.className = "tilt-glare";
      glare.setAttribute("aria-hidden", "true");
      if (el.tagName !== "IMG") el.appendChild(glare);

      let targetX = 0, targetY = 0, curX = 0, curY = 0, lift = 0, targetLift = 0;
      let raf = null;
      const animate = () => {
        curX += (targetX - curX) * 0.14;
        curY += (targetY - curY) * 0.14;
        lift += (targetLift - lift) * 0.14;
        el.style.transform =
          "perspective(1000px) rotateX(" + curX.toFixed(3) + "deg) rotateY(" + curY.toFixed(3) + "deg) translateY(" + lift.toFixed(2) + "px)";
        if (Math.abs(targetX - curX) + Math.abs(targetY - curY) + Math.abs(targetLift - lift) > 0.02) {
          raf = requestAnimationFrame(animate);
        } else {
          if (targetX === 0 && targetY === 0 && targetLift === 0) el.style.transform = "";
          raf = null;
        }
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(animate); };

      el.addEventListener("pointermove", (ev) => {
        const r = el.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width;
        const py = (ev.clientY - r.top) / r.height;
        targetY = (px - 0.5) * 2 * MAX_TILT;
        targetX = (0.5 - py) * 2 * MAX_TILT;
        targetLift = -6;
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        kick();
      });
      el.addEventListener("pointerleave", () => {
        targetX = 0; targetY = 0; targetLift = 0;
        kick();
      });
    });
  }
})();
