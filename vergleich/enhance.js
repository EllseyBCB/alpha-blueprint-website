/* Alpha Blueprint – interaktive Erweiterungen (additiv, robust gegen fehlende Elemente) */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1) Scroll-Fortschrittsbalken oben */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
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

  /* 3) Sanfte Parallaxe auf dem Hero-Hintergrund */
  const heroBg = document.querySelector(".hero-background");
  if (heroBg && !reduce) {
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        if (y < window.innerHeight) heroBg.style.transform = "translateY(" + y * 0.18 + "px) scale(1.06)";
      },
      { passive: true }
    );
  }

  /* 4) Zähler in der Erfahrungs-Karte hochzählen (z. B. 100%) */
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
})();
