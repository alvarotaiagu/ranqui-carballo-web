# Café Bar Ranqui — landing

Sitio estático (HTML/CSS/JS, sin build), mismo *toolkit* técnico que las
webs hermanas de este workspace (GSAP + ScrollTrigger, Lenis) pero con su
**propia estructura de página y su propia técnica de hero** — ver "Octava
familia estructural" más abajo. Abrir `index.html` con un servidor
estático cualquiera (por ejemplo `python -m http.server`) — no funciona
bien con `file://` porque las fuentes y `js/main.js` necesitan HTTP.

## Origen del contenido

Negocio real, sin web previa. El usuario pasó:

- Una captura de la ficha de Google de **Bar Ranqui** (Rúa Carballo
  Calero, 9, 15100 Carballo, A Coruña — teléfono 881 98 48 47, 4,6★ sobre
  146 reseñas, categoría "Cafetería", precio 10-20 € por persona, horario
  semanal completo).
- Una imagen del **logo real** del negocio (remolino de café marrón/crema
  dentro de una taza, con el rótulo "Ranqui · Café Bar"), pegada primero en
  el chat sin ruta de archivo accesible (se usó una marca de autoría propia
  mientras tanto) y subida como archivo en una sesión posterior el mismo
  día — ver "Marca gráfica" más abajo.
- Su Facebook (`facebook.com/p/Café-Bar-Ranqui-100064840909932/` —
  actualizado por el usuario, mismo ID de página que la URL
  `profile.php?id=...` usada al principio) e Instagram
  (`instagram.com/cafebar_ranqui`) reales, ambos enlazados tal cual en el
  sitio. Se intentó extraer contenido de ambos con la herramienta de
  fetch de la sesión; los dos están detrás de un muro de login y no
  devolvieron nada aprovechable (ni fotos, ni bio, ni posts).

Con eso se sustituyeron los placeholders iniciales por:

- **Dirección, teléfono y horario semanal real**: L–V 7:30–23:45, S
  8:30–1:00, D cerrado. Cableados como `tel:` real en el FAB, el CTA del
  hero, `#contacto` y el pie, y reflejados en vivo en `#franja`
  (`initFranjaLive()` en `js/main.js`) y en el `openingHoursSpecification`
  del JSON-LD.
- **Valoración**: 4,6★ sobre 146 reseñas en Google, en el `AggregateRating`
  del JSON-LD, en `#valoracion` y en la imagen OG.
- **Mapa real** en `#contacto` sobre la dirección de arriba, sin API key —
  el `iframe` de Google Maps solo se crea al pulsar "Cargar el mapa"
  (`.map-consent` / `initMapConsent()` en `js/main.js`), igual que en el
  resto de webs hermanas, para que el aviso de cookies pueda seguir
  diciendo "sin cookies de terceros" mientras no se pida el mapa
  explícitamente.

**Lo que NO se recibió y no se inventó**: ni una sola reseña con texto
completo (solo la valoración agregada), ninguna carta ni precio de plato
concreto, ninguna foto del local o de platos, y ningún dato de la
historia del negocio (dueños, personal, anécdotas) — a diferencia de
caracola-carballo-web o jayce-cafe-bar-carballo-web, que sí tuvieron
reseñas completas de las que sacar citas y platos mencionados. Por eso
`#oferta` presenta solo los cuatro datos que sí están confirmados
(categoría, precio medio, rango horario, valoración) en vez de una carta
inventada, y `#valoracion` no cita ninguna reseña — solo la cifra
agregada.

## Vibe: decisión explícita del usuario, con una colisión detectada a tiempo

El prompt original traía la vibe en blanco a propósito. Se propusieron
cuatro direcciones con `AskUserQuestion` (remolino de crema / barra de
mármol y latón / comanda de barra / otra idea); el usuario eligió
**"Remolino de crema"** — literalmente el motivo del logo real del
negocio.

Antes de escribir código se detectó una colisión real: **el espiral no es
un motivo libre en este workspace** — caracola-carballo-web (7ª familia,
mismo día 2026-09-14) ya usa una espiral logarítmica como motivo central
del hero, la marca y el horario. Se avisó al usuario con una segunda
`AskUserQuestion` explicando la colisión; confirmó seguir con el remolino
de crema pero **distinguido a fondo** de Caracola — ver la nota técnica en
`js/scene-remolino.js` para el detalle mecánico exacto de esa distinción.

## Octava familia estructural del workspace

Antes de escribir una sola línea se revisaron las siete webs hermanas
(Melao y su segunda plantilla "día y noche", A Taberna do Rio, O
Logradouro, O Carballo Tapería, A Lareira, gmz, Jayce y Caracola) para no
repetir ni el orden de secciones ni la técnica de hero ni el patrón de
navegación de ninguna:

- **Hero: remolino de crema** (`js/scene-remolino.js`): anillos
  concéntricos de "gotas" que giran cada uno a su propia velocidad angular
  (vórtice forzado en el centro, libre hacia el borde, como un café
  removido de verdad) — nunca convergen ni tienen ciclo de vida, a
  diferencia de las motas que nacen y mueren convergiendo hacia un núcleo
  en Caracola. Paleta espresso/crema/cobre, no azul-noche/latón.
  Interactivo de un modo propio: arrastrar el puntero sobre la taza añade
  un impulso de giro real (componente tangencial del arrastre respecto al
  centro), con fricción que lo frena solo — "remover la taza".
- **Nav: panel de cuchara** (`.stir-nav`): el botón de menú es una
  cucharilla; al abrirse, un panel se posa centrado bajo la cabecera (no
  arco que se desenrolla como Caracola, ni rail lateral como A Taberna do
  Rio, ni overlay a pantalla completa como Melao v2/O Carballo, ni
  cabecera "parrilla" como A Lareira).
- **Progreso de scroll: taza que se llena** (`.taza-gauge`, esquina
  inferior): a petición explícita del usuario, que vio esta idea en
  jayce-cafe-bar-carballo-web y quiso reutilizarla — ahí sustituye al logo
  de la cabecera (taza cónica + vapor); aquí vive en la esquina como
  indicador independiente, con la silueta de mug (rounded-rect + asa) que
  ya usa la figura de `#la-taza`, sin tocar el logo real de la cabecera.
  Excepción registrada de "no repetir motivo entre webs hermanas" —ver
  [[project-template-library-strategy]]— igual que
  `melao-carballo-web-v2` reutilizó el concepto día/noche: aquí el usuario
  pidió expresamente traer esta idea concreta de Jayce.
- **Franja del día** (`#franja`, `.franja-strip`): una franja horizontal
  continua de 7:30 a 1:00 dividida en cuatro tramos, con un marcador
  "ahora" que se mueve en directo según la hora real
  (`initFranjaLive()`) — distinta de la esfera circular de Caracola, el
  clock-card de A Lareira y el "reloj" lineal de A Taberna do Rio. Los
  tramos son una lectura del horario real, explícitamente marcados como
  NO una carta por franjas (no hay datos de qué se sirve en cada uno).
- **Lo que se sabe hasta ahora** (`#oferta`): en vez de una carta
  redactada a partir de reseñas (Caracola, Jayce) o una carta real
  (A Taberna do Rio, O Carballo), cuatro datos confirmados en tarjetas
  simples (categoría, precio medio, rango horario, valoración) — porque
  aquí no hay ni carta ni reseñas de las que extraer platos.
  Deliberadamente el más escueto de todos los "carta/oferta" del
  workspace, por ser el que menos contenido real tiene disponible.
  `#valoracion` sigue el mismo criterio: solo la cifra agregada, sin
  citas inventadas.

## Marca gráfica

**Actualizado**: el negocio pasó el archivo real del logo
(`assets/img/source/logo-original.jpg` — remolino marrón/crema dentro de
una taza con vapor, rótulo "Ranqui · Café Bar", fondo blanco con una
franja negra de recorte al pie). Se procesó con `scripts/process_logo.py`:

- Recorte de la franja negra inferior y separación icono/rótulo (medidos
  a mano sobre el archivo real: `BLACK_BAR_TOP`/`ICON_BOTTOM`).
- Fondo blanco → transparente por distancia de color (no por luminancia
  como en O Carballo, porque aquí la marca es a todo color, no un trazo
  monocromo) — `whiten_to_alpha()`, con una rampa suave para no dejar
  borde duro ni comerse los tonos crema más claros del propio remolino.
- `assets/img/logo/mark-512.png` / `mark-master.png`: solo el icono
  (taza + remolino + vapor), sin el rótulo — usado en cabecera/pie junto
  al wordmark en HTML. `mark-lockup.png`: icono + rótulo completo, para
  usos grandes.
- Favicons/manifest (`icon-16` a `icon-512`): el icono real sobre un
  medallón de espresso con anillo de cobre, mismo criterio que las webs
  hermanas.
- `assets/img/web/og-image.jpg`: el icono real a tamaño grande + tipografía
  propia para "Ranqui" (el rótulo del logo se ve borroso si se escala el
  lockup completo a 1200×630) + la valoración real.

**Ya obsoleto** (se conserva solo como registro de lo que se usó mientras
no teníamos el archivo real, ver historial de commits):
`scripts/generate_brand_mark.py` / `generate_og_image.py`, la marca de
autoría propia que generaban. No se ejecutan ni se referencian desde
`index.html`.

## Fotografía

No se recibió ninguna foto del local ni de platos (tampoco hay en el
Facebook/Instagram accesibles del negocio). Siguiendo el mismo criterio ya
usado en A Lareira y Caracola ante la misma falta de material, el sitio es
enteramente gráfico/tipográfico (canvas del hero, SVG de la taza, sin
fotografía de stock).

## Qué falta — pedir al negocio antes de darlo por cerrado

1. **Carta completa con platos y precios** — `#oferta` solo tiene los
   cuatro datos confirmados de la ficha de Google; no hay un solo plato
   con precio real en todo el sitio.
2. **Reseñas con texto completo** — hoy `#valoracion` solo muestra la
   valoración agregada (4,6★/146); en cuanto lleguen capturas de reseñas
   reales, se pueden citar tal cual como en el resto de webs hermanas.
3. **Fotos reales del local o de platos**, si el negocio quiere
   incorporarlas — hoy el sitio es intencionadamente gráfico.
4. **Confirmar el nombre de marca** — Google lista el negocio como "Bar
   Ranqui"; el logo real dice "Ranqui · Café Bar". El sitio usa "Café Bar
   Ranqui" como punto medio; vale la pena confirmar con el dueño.
5. **WhatsApp**, si el negocio lo usa — hoy solo hay `tel:+34881984847`.

Ya resueltos: dirección, teléfono, horario semanal, valoración (4,6★/146),
categoría y precio medio (captura de Google), el mapa de `#contacto`, y
**el logo real** (ver "Marca gráfica").

## Accesibilidad y resiliencia

- `prefers-reduced-motion: reduce`: el canvas del remolino no se activa
  (queda el resplandor de respaldo `.hero-fallback-glow`), no corren
  `runSectionReveals`/cursor personalizado/tilt.
- Sin JavaScript o con el CDN de GSAP/Lenis caído: el contenido, los
  enlaces, el teléfono y el aviso de cookies siguen siendo utilizables —
  solo se pierde el motion.
- Mapa, `tel:` y horario son datos reales de la ficha de Google del
  negocio — no hay ningún dato de contacto simulado en el sitio.
- El canvas del hero cachea el difuminado en sprites fuera de pantalla
  (`makeDropSprite`, radial gradient dibujado una sola vez) y usa
  `drawImage` por gota — nada de `ctx.filter`/`shadowBlur` en vivo por
  fotograma, DPR limitado a 2, pausado fuera de viewport/pestaña oculta,
  limpieza completa en `destroy()`.

## Validación pendiente

Construido pero no verificado todavía en navegador (Playwright / servidor
local) en esta sesión — antes de enseñarlo al dueño, servir con
`python -m http.server` y comprobar en 1440px y 390px: consola sin
errores, mapa cargando solo al clic, banner de cookies con el patrón
`[hidden]{display:none}`, marcador de `#franja` moviéndose en directo, y
que arrastrar sobre la taza del hero remueve el remolino de verdad.
