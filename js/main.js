// GSAP/ScrollTrigger cargan de un CDN — si eso falla (bloqueador de
// anuncios, red inestable, caída del CDN), nada de lo de abajo debe
// romperse: solo el movimiento es opcional aquí, no la dirección, el
// teléfono, el mapa, etc.
const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
if (gsapReady) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ---------- Word splitting (accesible) ---------- */
function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  const words = text.split(/\s+/);
  el.innerHTML = "";
  const wrap = document.createElement("span");
  wrap.className = "split-wrap";
  wrap.setAttribute("aria-hidden", "true");
  words.forEach((word, i) => {
    const outer = document.createElement("span");
    outer.className = "split-word";
    const inner = document.createElement("span");
    inner.textContent = word;
    outer.appendChild(inner);
    wrap.appendChild(outer);
    if (i < words.length - 1) wrap.appendChild(document.createTextNode(" "));
  });
  el.appendChild(wrap);
  return Array.from(wrap.querySelectorAll(".split-word > span"));
}

const splitTargets = document.querySelectorAll("[data-split-word]");
const splitMap = new Map();
splitTargets.forEach((el) => splitMap.set(el, splitWords(el)));

/* ---------- Hero: remolino de crema (ver js/scene-remolino.js). Solo se
   activa con motion permitido y si el canvas 2D existe; si no, el
   resplandor de respaldo (.hero-fallback-glow) se queda como fondo. ---------- */
let heroScene = null;
function initHeroScene() {
  const hero = document.querySelector(".hero");
  const canvas = hero && hero.querySelector(".hero-scene-canvas");
  if (!hero || !canvas || typeof window.createRemolinoScene !== "function") return;
  heroScene = window.createRemolinoScene(canvas);
  if (heroScene) hero.classList.add("is-animated");
}

/* ---------- Cookie notice ---------- */
function initCookieBanner() {
  const banner = document.querySelector(".cookie-banner");
  const ackBtn = document.querySelector(".cookie-ack");
  if (!banner || !ackBtn) return;
  const KEY = "ranqui-cookie-ack";
  let acknowledged = false;
  try {
    acknowledged = localStorage.getItem(KEY) === "1";
  } catch (e) {}
  if (!acknowledged) {
    banner.hidden = false;
  }
  ackBtn.addEventListener("click", () => {
    banner.hidden = true;
    try {
      localStorage.setItem(KEY, "1");
    } catch (e) {}
  });
}
initCookieBanner();

/* ---------- Botón flotante de llamada (tel: real) ---------- */
function initCallFab() {
  const fab = document.querySelector(".call-fab");
  const hero = document.querySelector(".hero");
  if (!fab || !hero) return;
  if (!gsapReady) {
    const observer = new IntersectionObserver(([entry]) => {
      fab.classList.toggle("is-visible", !entry.isIntersecting);
    });
    observer.observe(hero);
    return;
  }
  ScrollTrigger.create({
    trigger: hero,
    start: "bottom top",
    onEnter: () => fab.classList.add("is-visible"),
    onLeaveBack: () => fab.classList.remove("is-visible"),
  });
}
initCallFab();

/* ---------- Mapa: el iframe de Google (y sus cookies) solo se carga al
   pulsar el botón — así el aviso de cookies puede seguir diciendo "sin
   cookies de terceros" mientras el mapa no se pida explícitamente. */
function initMapConsent() {
  document.querySelectorAll(".map-consent").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        if (!btn.dataset.mapSrc) return;
        const iframe = document.createElement("iframe");
        iframe.title = btn.dataset.mapTitle || "Mapa";
        iframe.src = btn.dataset.mapSrc;
        iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        btn.replaceWith(iframe);
      },
      { once: true }
    );
  });
}
initMapConsent();

/* ---------- Franja del día: tramo + marcador "ahora" en directo ----------
   Horario real (ficha de Google): L-V 7:30-23:45, S 8:30-1:00, D cerrado.
   La franja visual siempre cubre 7:30-1:00 (17.5h) para que la forma del
   día se lea igual cada día; el marcador y el texto de estado sí reflejan
   la hora real y el horario real de hoy (incluido el desborde de S hacia
   la 1:00 de la madrugada siguiente). */
function initFranjaLive() {
  const strip = document.querySelector(".franja-strip");
  const marker = document.querySelector(".franja-now");
  const status = document.querySelector("[data-franja-status]");
  if (!strip) return;
  const label = status && status.querySelector("[data-franja-label]");
  const detail = status && status.querySelector("[data-franja-detail]");

  const STRIP_START = 7.5;
  const STRIP_END = 25; // 1:00 del día siguiente
  const RANGES = [null, [7.5, 23.75], [7.5, 23.75], [7.5, 23.75], [7.5, 23.75], [7.5, 23.75], [8.5, 25]];
  const TODAY_TEXT = [
    "Cerrado hoy",
    "Hoy 7:30 – 23:45",
    "Hoy 7:30 – 23:45",
    "Hoy 7:30 – 23:45",
    "Hoy 7:30 – 23:45",
    "Hoy 7:30 – 23:45",
    "Hoy 8:30 – 1:00",
  ];

  function update() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours() + now.getMinutes() / 60;
    const prevRange = RANGES[(day + 6) % 7];
    const spillover = !!prevRange && prevRange[1] > 24 && hours < prevRange[1] - 24;
    const todayRange = RANGES[day];
    const openToday = !!todayRange && hours >= todayRange[0] && hours < todayRange[1];
    const open = openToday || spillover;

    strip.classList.toggle("is-closed-today", !todayRange && !spillover);

    if (marker) {
      if (open) {
        const displayHours = spillover ? hours + 24 : hours;
        const pct = Math.max(0, Math.min(100, ((displayHours - STRIP_START) / (STRIP_END - STRIP_START)) * 100));
        marker.style.left = pct + "%";
        marker.classList.add("is-live");
      } else {
        marker.classList.remove("is-live");
      }
    }

    if (status && label && detail) {
      status.toggleAttribute("data-closed", !open);
      label.textContent = open ? "Abierto ahora" : "Cerrado ahora";
      detail.textContent = spillover ? "Cierra a la 1:00" : TODAY_TEXT[day];
    }
  }
  update();
  setInterval(update, 60000);
}
initFranjaLive();

/* ---------- Menú: panel de cuchara ----------
   El botón-cucharilla despliega un panel centrado bajo la cabecera (ver
   css .stir-nav) en vez de un arco, un rail lateral o un overlay a
   pantalla completa. */
const navToggle = document.querySelector(".nav-toggle");
const stirNav = document.querySelector(".stir-nav");
const stirScrim = document.querySelector(".stir-scrim");

function closeStirNav() {
  if (!stirNav || !navToggle) return;
  stirNav.classList.remove("is-open");
  if (stirScrim) stirScrim.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}
function openStirNav() {
  if (!stirNav || !navToggle) return;
  stirNav.classList.add("is-open");
  if (stirScrim) stirScrim.classList.add("is-open");
  navToggle.setAttribute("aria-expanded", "true");
  const firstLink = stirNav.querySelector("a");
  if (firstLink) firstLink.focus();
}
if (navToggle && stirNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeStirNav() : openStirNav();
  });
  stirNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") closeStirNav();
  });
  if (stirScrim) stirScrim.addEventListener("click", closeStirNav);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      closeStirNav();
      navToggle.focus();
    }
  });
}

/* ---------- Reduced motion y cableado del scroll suave ---------- */
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let lenis = null;

const revealTimelines = [];
function completeRevealsBefore(targetEl) {
  const targetTop = targetEl.getBoundingClientRect().top + window.scrollY;
  revealTimelines.forEach(({ group, tl }) => {
    const groupTop = group.getBoundingClientRect().top + window.scrollY;
    if (groupTop <= targetTop + 40) tl.progress(1);
  });
}

function smoothScrollToSelector(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  completeRevealsBefore(target);
  const headerOffset = 60;
  if (lenis) {
    lenis.scrollTo(target, { offset: -headerOffset });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: reduceQuery.matches ? "auto" : "smooth" });
  }
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const id = link.getAttribute("href");
  if (id.length <= 1) return;
  if (!document.querySelector(id)) return;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    closeStirNav();
    smoothScrollToSelector(id);
  });
});

document.querySelectorAll("[data-scroll-target]").forEach((btn) => {
  btn.addEventListener("click", () => smoothScrollToSelector(btn.dataset.scrollTarget));
});

/* ---------- Resalte de sección activa: panel de cuchara + pie ---------- */
const TRACKED_SECTIONS = ["la-taza", "franja", "oferta", "valoracion", "contacto"];

function setActiveSection(id) {
  document.querySelectorAll('.stir-nav a[href^="#"]').forEach((a) => {
    a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
  });
  document.querySelectorAll('.footer-nav a[href^="#"]').forEach((a) => {
    a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
  });
}

function initScrollSpy() {
  if (!gsapReady) return;
  TRACKED_SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top center",
      end: "bottom center",
      onEnter: () => setActiveSection(id),
      onEnterBack: () => setActiveSection(id),
    });
  });
}

/* ---------- Cromo de scroll: cabecera con fondo + relleno del indicador
   de remolino (progreso de lectura, decorativo, esquina inferior) ---------- */
function initScrollChrome() {
  if (!gsapReady) return;
  const header = document.querySelector(".site-header");
  const gauge = document.querySelector(".swirl-gauge");
  const gaugeFill = document.querySelector(".swirl-gauge .fill");

  let circumference = 0;
  if (gaugeFill) {
    const r = gaugeFill.r.baseVal.value;
    circumference = 2 * Math.PI * r;
    gaugeFill.style.strokeDasharray = String(circumference);
    gaugeFill.style.strokeDashoffset = String(circumference);
  }

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      if (gauge) gauge.classList.toggle("is-visible", self.progress > 0.02);
      if (gaugeFill) gaugeFill.style.strokeDashoffset = String(circumference * (1 - self.progress));
    },
  });

  if (header) {
    ScrollTrigger.create({
      trigger: document.body,
      start: "top -80",
      onEnter: () => header.classList.add("is-scrolled"),
      onLeaveBack: () => header.classList.remove("is-scrolled"),
    });
  }
}

/* ---------- Motion setup ---------- */
if (!gsapReady) {
  document.body.classList.add("motion-reduced");
}

const mm = gsapReady ? gsap.matchMedia() : null;

if (mm) mm.add(
  {
    isMotion: "(prefers-reduced-motion: no-preference)",
    isFinePointer: "(pointer: fine)",
  },
  (context) => {
    const { isMotion, isFinePointer } = context.conditions;

    if (isMotion) {
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      runHeroIntro();
      runSectionReveals();
      initScrollSpy();
      initScrollChrome();
      initHeroScene();

      if (isFinePointer) {
        initMagneticButtons();
        initTiltCards();
        initHeroTilt();
        initCustomCursor();
      }

      window.addEventListener("pagehide", () => {
        lenis && lenis.destroy();
        ScrollTrigger.getAll().forEach((t) => t.kill());
        if (heroScene) heroScene.destroy();
      });
    } else {
      document.body.classList.add("motion-reduced");
      initScrollSpy();
      initScrollChrome();
    }

    return () => {
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
    };
  }
);

/* ---------- Intro del hero ---------- */
function runHeroIntro() {
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from(".site-header", { y: -24, opacity: 0, duration: 0.7, ease: "power3.out" });
  tl.from(".hero-eyebrow", { y: 12, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.35");
  tl.from(".hero-title", { y: 24, opacity: 0, duration: 0.75, ease: "power3.out" }, "-=0.25");
  tl.from(".hero-claim", { y: 16, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.5");
  tl.from(".hero-actions", { y: 14, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.35");
  tl.from(".hero-meta .hero-chip", { y: 10, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }, "-=0.3");
  tl.from(".scroll-cue", { opacity: 0, duration: 0.5 }, "-=0.2");
}

/* ---------- Revelados sección por sección ---------- */
function runSectionReveals() {
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    const heading = group.querySelector("h2");
    const headingSplitTargets = heading
      ? Array.from(heading.matches("[data-split-word]") ? [heading] : heading.querySelectorAll("[data-split-word]"))
      : [];
    const headingWords = headingSplitTargets.length
      ? headingSplitTargets.flatMap((el) => splitMap.get(el) || [])
      : null;
    const blocks = group.querySelectorAll("p");
    const cards = group.querySelectorAll(
      ".oferta-card, .canal-card, .info-list li, .taza-facts li, .franja-tramo, .map-card"
    );

    if (headingWords) gsap.set(headingWords, { yPercent: 110, opacity: 0 });
    gsap.set(blocks, { y: 16, opacity: 0 });
    gsap.set(cards, { y: 26, opacity: 0, scale: 0.96 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: "top 78%",
        toggleActions: "play none none none",
      },
    });
    if (headingWords) {
      tl.to(headingWords, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power4.out" });
    }
    tl.to(blocks, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }, headingWords ? "-=0.35" : 0);
    tl.to(
      cards,
      { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: Math.min(0.08, 0.55 / Math.max(cards.length, 1)), ease: "power3.out" },
      headingWords || blocks.length ? "-=0.35" : 0
    );
    revealTimelines.push({ group, tl });
  });
}

/* ---------- Botones magnéticos ---------- */
function initMagneticButtons() {
  document.querySelectorAll(".btn:not([aria-disabled='true'])").forEach((el) => {
    const moveX = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
    const moveY = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      moveX((e.clientX - rect.left - rect.width / 2) * 0.25);
      moveY((e.clientY - rect.top - rect.height / 2) * 0.4);
    });
    el.addEventListener("mouseleave", () => {
      moveX(0);
      moveY(0);
    });
  });
}

/* ---------- Tilt en tarjetas de oferta/canal ---------- */
function initTiltCards() {
  document.querySelectorAll(".oferta-card, .canal-card").forEach((el) => {
    const rotX = gsap.quickTo(el, "rotationX", { duration: 0.4, ease: "power2" });
    const rotY = gsap.quickTo(el, "rotationY", { duration: 0.4, ease: "power2" });
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotY(px * 5);
      rotX(-py * 5);
    });
    el.addEventListener("mouseleave", () => {
      rotX(0);
      rotY(0);
    });
  });
}

/* ---------- Tilt 3D del hero ---------- */
function initHeroTilt() {
  const hero = document.querySelector(".hero");
  const content = document.querySelector(".hero-content");
  if (!hero || !content) return;

  const rotX = gsap.quickTo(content, "rotationX", { duration: 0.7, ease: "power2" });
  const rotY = gsap.quickTo(content, "rotationY", { duration: 0.7, ease: "power2" });

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotY(px * 4);
    rotX(-py * 4);
  });
  hero.addEventListener("pointerleave", () => {
    rotX(0);
    rotY(0);
  });
}

/* ---------- Cursor personalizado (solo puntero fino) ---------- */
function initCustomCursor() {
  const ring = document.querySelector(".cursor-ring");
  const dot = document.querySelector(".cursor-dot");
  if (!ring || !dot) return;
  document.body.classList.add("custom-cursor-active");

  const moveRingX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" });
  const moveRingY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" });
  const moveDotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
  const moveDotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });

  function onMove(e) {
    ring.classList.add("is-visible");
    dot.classList.add("is-visible");
    moveRingX(e.clientX);
    moveRingY(e.clientY);
    moveDotX(e.clientX);
    moveDotY(e.clientY);
  }
  window.addEventListener("pointermove", onMove, { passive: true });

  document.querySelectorAll("a, button, [tabindex], .oferta-card, .canal-card").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.classList.add("is-hover");
      dot.classList.add("is-hover");
    });
    el.addEventListener("mouseleave", () => {
      ring.classList.remove("is-hover");
      dot.classList.remove("is-hover");
    });
  });

  window.addEventListener("blur", () => {
    ring.classList.remove("is-visible");
    dot.classList.remove("is-visible");
  });
  document.addEventListener("mouseleave", () => {
    ring.classList.remove("is-visible");
    dot.classList.remove("is-visible");
  });
}

/* Actualiza medidas de ScrollTrigger cuando las fuentes/el layout se
   asientan — protegido por gsapReady ya que GSAP/ScrollTrigger pueden no
   haberse cargado (CDN caído, bloqueador de anuncios, sin red). */
if (gsapReady) {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
