"""Genera assets/img/web/og-image.jpg: espresso + resplandor de taza + el
wordmark "RANQUI", dibujado a mano con PIL (misma autoría que la marca —
ver generate_brand_mark.py), sin fotografía ni logo ajeno. La valoración
(4,6★ · 146 reseñas) es la real de la ficha de Google del negocio."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "web")
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 1200, 630
TINTA = (36, 22, 17)
TINTA_3 = (59, 39, 28)
COBRE = (184, 112, 58)
COBRE_VIVO = (224, 153, 79)
CREMA = (246, 236, 221)

img = Image.new("RGB", (W, H), TINTA)

# Radial glow, low-right — la taza, sin fuego ni convergencia.
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
cx, cy = W * 0.79, H * 0.7
for rad, col, alpha in [
    (W * 0.42, TINTA_3, 140),
    (W * 0.24, COBRE, 75),
    (W * 0.11, COBRE_VIVO, 95),
]:
    gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(*col, alpha))
glow = glow.filter(ImageFilter.GaussianBlur(60))
img.paste(Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB"), (0, 0))

draw = ImageDraw.Draw(img)


def load_font(name_candidates, size):
    for name in name_candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


title_font = load_font(["georgiab.ttf", "Georgia Bold.ttf", "DejaVuSerif-Bold.ttf"], 108)
sub_font = load_font(["arial.ttf", "DejaVuSans.ttf"], 32)
eyebrow_font = load_font(["arialbd.ttf", "DejaVuSans-Bold.ttf"], 25)

# Eyebrow
draw.ellipse([90, 130, 104, 144], fill=COBRE)
draw.text((118, 118), "CAFÉ BAR · CARBALLO", font=eyebrow_font, fill=(207, 158, 112))

# Title
draw.text((86, 172), "RANQUI", font=title_font, fill=CREMA)

# Subtitle
draw.text(
    (92, 330),
    "Un solo giro, de 7:30 a la 1:00 los sábados.",
    font=sub_font,
    fill=(212, 196, 174),
)
draw.text(
    (92, 374),
    "Café Bar en Carballo · 4,6/5 (146 reseñas en Google)",
    font=sub_font,
    fill=(212, 196, 174),
)

# Remolino pequeño abajo a la derecha, ecoando la marca: anillos
# concéntricos de puntos en vez de una espiral única de convergencia.
gx, gy = 1010, 470
for ring in range(5):
    t = ring / 4
    rad = 14 + t * 106
    n = 5 + ring * 2
    speed_offset = t * 2.4
    for k in range(n):
        theta = (k / n) * 2 * math.pi + speed_offset
        x = gx + math.cos(theta) * rad
        y = gy + math.sin(theta) * rad * 0.94
        col = tuple(round(COBRE_VIVO[c] + (CREMA[c] - COBRE_VIVO[c]) * t) for c in range(3))
        r = 3 + (1 - t) * 3
        draw.ellipse([x - r, y - r, x + r, y + r], fill=col)

img.save(os.path.join(OUT_DIR, "og-image.jpg"), quality=90)
print("done")
