/* ==========================================================================
   Extra effects: intro loader, custom cursor, draggable 3D ring, text scramble,
   live clock, counters, magnetic links and the interactive footer name.
   This is polish only: the site works without this file.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const raf = window.requestAnimationFrame.bind(window);

  /* ---------- 1. Intro loader + hero entrance ---------- */

  const loader = document.querySelector(".loader");
  const playIntro = () => root.classList.add("intro-play");

  if (root.classList.contains("is-loading") && loader) {
    try { sessionStorage.setItem("yd-intro-seen", "1"); } catch (e) { /* private mode */ }

    const count = loader.querySelector(".loader__count");
    const bar = loader.querySelector(".loader__bar span");
    const DURATION = 1400;
    const start = performance.now();

    const finish = () => {
      loader.classList.add("is-done");
      setTimeout(playIntro, 180);
      setTimeout(() => root.classList.remove("is-loading"), 1000);
    };
    const step = (now) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      if (count) count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (bar) bar.style.transform = `scaleX(${eased})`;
      if (p < 1) raf(step);
      else finish();
    };
    raf(step);
  } else if (root.classList.contains("intro")) {
    playIntro();
  }

  /* ---------- 2. Live clock (India time) ---------- */

  const clock = document.getElementById("clock");
  if (clock) {
    let format = null;
    try {
      format = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      });
    } catch (e) { /* very old browser: leave the static "IST" */ }
    if (format) {
      const tick = () => { clock.textContent = `${format.format(new Date())} IST`; };
      tick();
      setInterval(tick, 1000);
    }
  }

  /* ---------- 3. Draggable 3D ring with momentum + mouse tilt ---------- */

  const ring = document.getElementById("ring");
  const tilt = document.querySelector(".ring-tilt");
  const stage = document.querySelector(".hero__stage");
  const hero = document.querySelector(".hero");

  if (ring && tilt && stage && hero && ring.children.length) {
    ring.classList.add("ring--js");          // turns off the CSS spin; JS drives it now
    stage.classList.add("is-draggable");
    stage.dataset.cursor = "Drag";

    const BASE_X = -14;                      // keep in sync with .ring-tilt in style.css
    const BASE_Z = 11;
    const AUTO = reduceMotion ? 0 : -7.2;    // degrees per second (one turn every 50s)

    let angle = 0;
    let spin = 0;                            // extra speed from a flick, decays back to AUTO
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let dragVel = 0;
    let mx = 0, my = 0, tx = 0, ty = 0;      // mouse position (-1..1) and smoothed tilt
    let visible = true;
    let running = false;
    let prev = 0;

    const loop = (now) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!dragging) {
        angle += (AUTO + spin) * dt;
        spin *= Math.pow(0.06, dt);
      }
      tx += (mx - tx) * Math.min(1, dt * 3);
      ty += (my - ty) * Math.min(1, dt * 3);
      ring.style.transform = `rotateY(${angle}deg)`;
      tilt.style.transform = `rotateX(${BASE_X - ty * 7}deg) rotateZ(${BASE_Z + tx * 5}deg)`;
      if (visible) raf(loop);
      else running = false;
    };
    const startLoop = () => {
      if (running) return;
      running = true;
      prev = performance.now();
      raf(loop);
    };
    startLoop();

    // Pause while the hero is off screen.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) startLoop();
      }).observe(hero);
    }

    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      dragVel = 0;
      spin = 0;
      lastX = e.clientX;
      lastT = performance.now();
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
      if (e.pointerType === "mouse") e.preventDefault();
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const now = performance.now();
      const delta = (e.clientX - lastX) * 0.4;
      angle += delta;
      dragVel = dragVel * 0.5 + (delta / Math.max(1, now - lastT)) * 1000 * 0.5;
      lastX = e.clientX;
      lastT = now;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      const held = performance.now() - lastT > 120;   // paused before letting go: no flick
      const velocity = held ? 0 : Math.max(-900, Math.min(900, dragVel));
      spin = velocity - AUTO;
    };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    if (finePointer && !reduceMotion) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      hero.addEventListener("pointerleave", () => { mx = 0; my = 0; });
    }
  }

  /* ---------- 4. Custom cursor (mouse / trackpad only) ---------- */

  if (finePointer) {
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="cursor__label"></span>';
    document.body.appendChild(cursor);
    const label = cursor.firstElementChild;
    root.classList.add("has-cursor");

    document.querySelectorAll(".card a").forEach((a) => { a.dataset.cursor = "View"; });
    document.querySelectorAll(".row").forEach((a) => { a.dataset.cursor = "Open"; });

    let x = -100, y = -100, cx = -100, cy = -100, shown = false;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        cx = x;
        cy = y;
        cursor.classList.add("is-visible");
      }
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget) { shown = false; cursor.classList.remove("is-visible"); }
    });
    document.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    document.addEventListener("pointerup", () => cursor.classList.remove("is-down"));

    document.addEventListener("pointerover", (e) => {
      const target = e.target.closest("[data-cursor], a, button");
      const text = target && target.dataset.cursor;
      cursor.classList.toggle("is-link", Boolean(target) && !text);
      cursor.classList.toggle("is-label", Boolean(text));
      if (text) label.textContent = text;
    });

    const follow = () => {
      const k = reduceMotion ? 1 : 0.22;
      cx += (x - cx) * k;
      cy += (y - cy) * k;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf(follow);
    };
    raf(follow);
  }

  /* ---------- 5. Magnetic links ---------- */

  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.5}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- 6. Text scramble on hover / keyboard focus ---------- */

  if (!reduceMotion) {
    const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/*+=";
    const scramble = (el) => {
      if (el.dataset.scrambling) return;
      const text = el.dataset.text || (el.dataset.text = el.textContent);
      if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", text);
      el.dataset.scrambling = "1";
      el.style.width = `${el.getBoundingClientRect().width}px`;   // no layout jump
      let frame = 0;
      const run = () => {
        const revealed = frame / 2;
        el.textContent = [...text]
          .map((ch, i) => (ch === " " || i < revealed ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join("");
        frame += 1;
        if (revealed < text.length) raf(run);
        else {
          el.textContent = text;
          el.style.width = "";
          delete el.dataset.scrambling;
        }
      };
      raf(run);
    };
    document.querySelectorAll(".nav a, a.bracket").forEach((el) => {
      el.addEventListener("pointerenter", () => scramble(el));
      el.addEventListener("focus", () => scramble(el));
    });
  }

  /* ---------- 7. Counters ---------- */

  const counters = document.querySelectorAll(".stat__num[data-counter]");
  counters.forEach((el) => {
    const raw = el.dataset.counter;
    const to = raw === "projects" ? (window.PROJECTS || []).length : Number(raw);
    if (!Number.isFinite(to)) return;
    const from = Number(el.dataset.from || 0);
    const suffix = el.dataset.suffix || "";
    const digits = Math.max(2, String(to).length);
    const render = (v) => { el.textContent = String(Math.round(v)).padStart(digits, "0") + suffix; };

    if (reduceMotion || !("IntersectionObserver" in window)) { render(to); return; }

    render(from);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const DURATION = 1800;
      const step = (now) => {
        const p = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(2, -10 * p);          // ease-out expo
        render(from + (to - from) * (p === 1 ? 1 : eased));
        if (p < 1) raf(step);
      };
      raf(step);
    }, { threshold: 0.4 });
    io.observe(el);
  });

  /* ---------- 8. Footer name: letters light up under the cursor ---------- */

  const markName = document.querySelector(".footer__mark span");
  if (markName) {
    const text = markName.textContent;
    markName.textContent = "";
    [...text].forEach((ch) => {
      const letter = document.createElement("i");
      letter.textContent = ch === " " ? " " : ch;
      markName.appendChild(letter);
    });
    markName.classList.add("is-split");
  }
})();
