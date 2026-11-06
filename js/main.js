/* ==========================================================================
   Portfolio interactions. You normally don't need to edit this file;
   projects live in js/projects.js.
   ========================================================================== */
(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

  /* ---------- Helpers ---------- */

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

  const isExternal = (url) => /^https?:\/\//i.test(url || "");
  const linkAttrs = (url) =>
    `href="${esc(url || "#")}"` +
    (isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : "");

  const VARIANTS = ["dark", "light", "mid", "dark", "mid", "light", "dark", "mid"];

  // A screenshot if the project has one, otherwise a generated placeholder.
  function thumb(project, index) {
    if (project.image) {
      return `<img src="${esc(project.image)}" alt="" loading="lazy" decoding="async">`;
    }
    const variant = VARIANTS[index % VARIANTS.length];
    return `
      <div class="ph ph--${variant}">
        <div class="ph__top"><i></i><i></i><span>${esc(project.category)}</span></div>
        <div class="ph__body"><b></b><b></b><b></b></div>
        <span class="ph__title">${esc(project.title)}</span>
      </div>`;
  }

  /* ---------- Hero ring ---------- */

  const ring = document.getElementById("ring");
  if (ring && projects.length) {
    // About 12–14 cards fill the ring; repeat the project list a whole number of times.
    const CARD_COUNT = Math.max(projects.length, Math.round(13 / projects.length) * projects.length);
    ring.style.setProperty("--step", `${360 / CARD_COUNT}deg`);
    ring.innerHTML = Array.from({ length: CARD_COUNT }, (_, i) => {
      const index = i % projects.length;
      return `
        <div class="ring__card" style="--i:${i}">
          <div class="ring__face">${thumb(projects[index], index)}</div>
          <div class="ring__face ring__face--back"></div>
        </div>`;
    }).join("");

    // Pause the spin while the hero is off screen (saves battery).
    const hero = document.querySelector(".hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        ring.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      }).observe(hero);
    }
  }

  /* ---------- Project index + grid ---------- */

  const list = document.getElementById("workList");
  if (list) {
    list.innerHTML = projects
      .map(
        (p, i) => `
        <li>
          <a class="row" ${linkAttrs(p.url)} data-index="${i}">
            <span class="row__title">${esc(p.title)}</span>
            <span class="row__cat">${esc(p.category)}</span>
            <span class="row__role">${esc(p.role)}</span>
            <span class="row__year">${esc(p.year)}</span>
          </a>
        </li>`
      )
      .join("");
  }

  const grid = document.getElementById("workGrid");
  if (grid) {
    grid.innerHTML = projects
      .map(
        (p, i) => `
        <article class="card" data-fade>
          <a ${linkAttrs(p.url)}>
            <div class="card__media">${thumb(p, i)}</div>
            <div class="card__meta">
              <h3 class="card__title">${esc(p.title)}</h3>
              <span class="label muted">${esc(p.year)}</span>
            </div>
            ${p.summary ? `<p class="card__summary">${esc(p.summary)}</p>` : ""}
            <span class="bracket card__cta">${isExternal(p.url) ? "Visit site" : "See details"}</span>
          </a>
        </article>`
      )
      .join("");
  }

  /* ---------- Cursor preview over the project index (mouse only) ---------- */

  if (list && projects.length && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const preview = document.createElement("div");
    preview.className = "preview";
    preview.setAttribute("aria-hidden", "true");
    document.body.appendChild(preview);

    let current = -1;
    let x = 0;
    let y = 0;
    let frame = 0;

    const place = () => {
      preview.style.transform = `translate(${x + 24}px, ${y - 100}px)`;
      frame = 0;
    };

    list.addEventListener("pointerover", (e) => {
      const row = e.target.closest(".row");
      if (!row) return;
      const index = Number(row.dataset.index);
      if (index !== current) {
        current = index;
        preview.innerHTML = thumb(projects[index], index);
      }
      preview.classList.add("is-visible");
    });
    list.addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(place);
    });
    list.addEventListener("pointerleave", () => preview.classList.remove("is-visible"));
  }

  /* ---------- Word-by-word reveal for the big statements ---------- */

  const reveals = [...document.querySelectorAll("[data-reveal-words]")];
  reveals.forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
  });

  if (reduceMotion) {
    document.querySelectorAll("[data-reveal-words] .w").forEach((w) => w.classList.add("is-lit"));
  } else if (reveals.length) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      reveals.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // 0 when the text enters the lower part of the screen, 1 once it reaches the upper third.
        const start = vh * 0.9;
        const end = vh * 0.3;
        const progress = (start - rect.top) / (start - end);
        const clamped = Math.min(1, Math.max(0, progress));
        const words = el.children;
        const lit = Math.round(clamped * words.length);
        for (let i = 0; i < words.length; i++) words[i].classList.toggle("is-lit", i < lit);
      });
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- Fade in sections as they scroll into view ---------- */

  const faders = document.querySelectorAll("[data-fade]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    faders.forEach((el) => io.observe(el));
  } else {
    faders.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Giant footer name: scale it to fill the width ---------- */

  const mark = document.querySelector(".footer__mark span");
  const fitMark = () => {
    if (!mark) return;
    const available = mark.parentElement.clientWidth;
    mark.style.fontSize = "100px";
    const width = mark.getBoundingClientRect().width;
    if (width > 0) mark.style.fontSize = `${(100 * available * 0.98) / width}px`;
  };
  if (mark) {
    fitMark();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMark);
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitMark, 120);
    });
  }

  /* ---------- Tape marquee: repeat the text until it covers the whole strip ---------- */

  const tape = document.querySelector(".tape");
  const tapeGroups = tape ? tape.querySelectorAll(".tape__group") : [];
  const fillTape = () => {
    if (tapeGroups.length !== 2) return;
    const original = [...tapeGroups[0].children];
    const originalCount = Number(tape.dataset.count || original.length);
    tape.dataset.count = String(originalCount);
    const base = original.slice(0, originalCount);
    let guard = 0;
    while (tapeGroups[0].scrollWidth < tape.clientWidth && guard++ < 12) {
      tapeGroups.forEach((group) => base.forEach((node) => group.appendChild(node.cloneNode(true))));
    }
  };
  if (tape) {
    fillTape();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fillTape);
    window.addEventListener("resize", fillTape);
  }

  /* ---------- Current year in the footer ---------- */

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
