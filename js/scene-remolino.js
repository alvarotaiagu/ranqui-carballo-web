/* ---------- Hero: remolino de crema ----------
   Octava familia estructural del workspace. El logo real de Ranqui es un
   remolino de café dentro de una taza, así que el hero traduce eso a
   movimiento — pero de forma mecánicamente distinta a caracola-carballo-web
   (única web hermana que también usa un espiral como motivo): allí son
   MOTAS DE LUZ que nacen en el borde y CONVERGEN hacia un núcleo, en una
   espiral logarítmica única, sobre azul-noche/latón. Aquí no hay
   convergencia ni partículas con ciclo de vida: son ANILLOS CONCÉNTRICOS
   de "gotas de crema" que giran cada uno a su propia velocidad angular
   (más rápido cuanto más cerca del centro, como un fluido removido de
   verdad), así que el remolino se forma y deshace solo por la diferencia
   de fase entre anillos — nunca converge, nunca nace ni muere nada. Paleta
   espresso/crema/cobre, no azul-noche/latón. Y es interactivo de un modo
   propio: arrastrar el puntero añade un impulso de giro real (como remover
   la taza con una cucharilla), con fricción que lo frena solo.
   Todo el difuminado se resuelve en UN sprite fuera de pantalla (radial
   gradient dibujado una sola vez) y cada gota es un drawImage con alpha —
   nada de ctx.filter/shadowBlur en vivo por fotograma. DPR limitado a 2,
   pausado fuera de viewport/pestaña oculta, limpieza completa en destroy(). */
(function () {
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  const CREMA = [244, 231, 209];
  const CREMA_VIVA = [255, 246, 234];
  const COBRE = [184, 112, 58];
  const COBRE_VIVO = [224, 153, 79];

  function makeDropSprite(color, size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const r = size / 2;
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.95)`);
    grad.addColorStop(0.55, `rgba(${color[0]},${color[1]},${color[2]},0.55)`);
    grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  const RING_COUNT = 6;

  function buildRings(rng) {
    const rings = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const t = i / (RING_COUNT - 1); // 0 centro, 1 borde
      // Vórtice forzado en el centro (gira más rápido cerca del eje) que
      // pasa a vórtice libre hacia el borde (gira más despacio) — igual
      // que un café removido de verdad.
      const speed = (0.62 - t * 0.46) * (i % 2 === 0 ? 1 : -0.82);
      const dropCount = 5 + i;
      const drops = [];
      for (let d = 0; d < dropCount; d++) {
        drops.push({
          angle0: (d / dropCount) * Math.PI * 2 + rng() * 0.3,
          size: 0.55 + rng() * 0.55,
          wobbleSeed: rng() * 1000,
          useCobre: (i + d) % 3 === 0,
        });
      }
      rings.push({ t, speed, drops, phase: rng() * Math.PI * 2 });
    }
    return rings;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.createRemolinoScene = function createRemolinoScene(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const rng = mulberry32(20260914);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0;
    let raf = null;
    let running = false;
    let last = 0;

    const SPRITE_SIZE = 220;
    const spriteCrema = makeDropSprite(CREMA, SPRITE_SIZE);
    const spriteCremaViva = makeDropSprite(CREMA_VIVA, SPRITE_SIZE);
    const spriteCobre = makeDropSprite(COBRE, SPRITE_SIZE);
    const spriteCobreVivo = makeDropSprite(COBRE_VIVO, SPRITE_SIZE);

    const rings = buildRings(rng);

    let stirVelocity = 0; // impulso angular añadido por el puntero, con fricción
    let pointer = null;

    function cup() {
      // El centro de la taza queda a la derecha, dejando el titular libre
      // a la izquierda (mismo criterio de composición que otras webs
      // hermanas, giro mecánico propio).
      const cx = width * 0.74;
      const cy = height * 0.48;
      const maxR = Math.min(width * 0.4, height * 0.5);
      return { cx, cy, maxR };
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onPointerDown(e) {
      pointer = { x: e.clientX, y: e.clientY };
    }
    function onPointerMove(e) {
      if (!pointer) return;
      const { cx, cy } = cup();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left - cx;
      const py = e.clientY - rect.top - cy;
      const dx = e.clientX - pointer.x;
      const dy = e.clientY - pointer.y;
      // Componente tangencial del arrastre respecto al centro de la taza:
      // así "remover" la taza gira el remolino, en vez de empujarlo en
      // línea recta.
      const r = Math.max(1, Math.hypot(px, py));
      const tangential = (px * dy - py * dx) / r;
      stirVelocity = clamp(stirVelocity + tangential * 0.0009, -2.2, 2.2);
      pointer = { x: e.clientX, y: e.clientY };
    }
    function onPointerUp() { pointer = null; }
    function onPointerLeave() { pointer = null; }

    function step(dt) {
      stirVelocity *= Math.pow(0.06, dt); // fricción: se frena solo
      rings.forEach((ring) => {
        ring.phase += (ring.speed + stirVelocity * (1 - ring.t * 0.6)) * dt;
      });
    }

    function frame(t) {
      ctx.clearRect(0, 0, width, height);
      const { cx, cy, maxR } = cup();

      // Base: café en la taza, más oscuro en el borde (profundidad), con
      // un aro de luz muy tenue marcando el reborde.
      const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.05);
      baseGrad.addColorStop(0, "rgba(90, 58, 32, 0.55)");
      baseGrad.addColorStop(0.7, "rgba(46, 27, 18, 0.4)");
      baseGrad.addColorStop(1, "rgba(46, 27, 18, 0)");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 1.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.clip();

      ctx.globalCompositeOperation = "lighter";

      rings.forEach((ring) => {
        const r = maxR * (0.16 + ring.t * 0.84);
        ring.drops.forEach((drop) => {
          const wobble = Math.sin(t * 0.6 + drop.wobbleSeed) * (r * 0.025);
          const angle = drop.angle0 + ring.phase;
          const x = cx + Math.cos(angle) * (r + wobble);
          const y = cy + Math.sin(angle) * (r + wobble) * 0.94;
          const size = SPRITE_SIZE * 0.16 * drop.size * (0.7 + ring.t * 0.5);
          const sprite = drop.useCobre
            ? (ring.t < 0.4 ? spriteCobreVivo : spriteCobre)
            : (ring.t < 0.4 ? spriteCremaViva : spriteCrema);
          ctx.globalAlpha = 0.5 + (1 - ring.t) * 0.35;
          ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
        });
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();

      // Reborde de la taza: un anillo cálido fino.
      ctx.strokeStyle = "rgba(224, 153, 79, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.stroke();

      // Brillo superior fijo (no animado por fotograma) sugiriendo
      // superficie líquida pulida.
      const sheen = ctx.createRadialGradient(cx - maxR * 0.3, cy - maxR * 0.35, 0, cx - maxR * 0.3, cy - maxR * 0.35, maxR * 0.5);
      sheen.addColorStop(0, "rgba(255, 246, 234, 0.14)");
      sheen.addColorStop(1, "rgba(255, 246, 234, 0)");
      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();
    }

    function loop(now) {
      if (!running) return;
      const t = now / 1000;
      const dt = last ? Math.min(0.05, t - last) : 0.016;
      last = t;
      step(dt);
      frame(t);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    resize();
    frame(0);

    const onResize = () => { resize(); frame(0); };
    window.addEventListener("resize", onResize);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !document.hidden) start();
          else stop();
        },
        { threshold: 0.05 }
      );
      io.observe(canvas);
    } else {
      start();
    }

    function onVisibility() {
      if (document.hidden) stop();
      else {
        const rect = canvas.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) start();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return {
      destroy() {
        stop();
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        if (io) io.disconnect();
      },
    };
  };
})();
