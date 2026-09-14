"""Convierte el logo REAL del negocio (assets/img/source/logo-original.jpg —
remolino de café marrón/crema dentro de una taza, con el rótulo "Ranqui /
Café Bar", fondo blanco y una franja negra de recorte en la parte inferior)
en marcas de agua con fondo transparente, más los iconos de favicon/manifest
y la imagen Open Graph. Sustituye a la marca de autoría propia que generaba
scripts/generate_brand_mark.py (se conserva ese script solo como registro de
lo que se usó mientras no teníamos el archivo real — ver README)."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SRC = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "source", "logo-original.jpg")
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "logo")
OUT_WEB = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "web")

TINTA = (36, 22, 17)       # --tinta
CREMA = (246, 236, 221)    # --crema
COBRE = (184, 112, 58)     # --cobre
COBRE_VIVO = (224, 153, 79)  # --cobre-vivo

# Fila donde empieza la franja negra de recorte inferior del archivo
# original (medido: negro puro a partir de ~y=708 de 751) y fila hasta
# donde llega el icono de la taza (por debajo ya solo hay aire antes del
# rótulo "Ranqui / Café Bar") — ambos medidos a mano sobre el archivo real.
BLACK_BAR_TOP = 703
ICON_BOTTOM = 445


def whiten_to_alpha(rgb_arr, bg_low=16, bg_high=48):
    """Fondo blanco -> transparente, con una rampa suave para no dejar un
    borde duro ni comerse los tonos claros del propio remolino (la crema
    más clara del logo está lo bastante lejos del blanco puro como para
    quedar intacta con este umbral — comprobado por muestreo de píxeles)."""
    arr = rgb_arr.astype(np.float32)
    dist_from_white = 255.0 - arr.min(axis=2)
    alpha = np.clip((dist_from_white - bg_low) / (bg_high - bg_low), 0, 1) * 255
    return alpha.astype(np.uint8)


def cutout(im_rgb):
    arr = np.array(im_rgb)
    alpha = whiten_to_alpha(arr)
    out = Image.new("RGBA", im_rgb.size, (0, 0, 0, 0))
    out.paste(im_rgb, (0, 0))
    out.putalpha(Image.fromarray(alpha))
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def square_pad(img, pad_frac=0.14, size=None):
    w, h = img.size
    side = max(w, h)
    pad = int(side * pad_frac)
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    canvas.paste(img, ((side + pad * 2 - w) // 2, (side + pad * 2 - h) // 2), img)
    if size:
        canvas = canvas.resize((size, size), Image.LANCZOS)
    return canvas


def load_font(candidates, size):
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(OUT_WEB, exist_ok=True)

    full = Image.open(SRC).convert("RGB")
    full = full.crop((0, 0, full.width, BLACK_BAR_TOP))

    # Lockup completo (icono + rótulo "Ranqui / Café Bar"), recortado a su
    # contenido real, fondo transparente — para usos grandes (OG, "acerca de").
    lockup = cutout(full)
    lockup.save(os.path.join(OUT, "mark-lockup.png"))

    # Solo el icono (taza + remolino + vapor), sin el rótulo de texto —
    # para la cabecera (junto al wordmark en HTML), favicon y manifest.
    icon_src = full.crop((0, 0, full.width, ICON_BOTTOM))
    icon_mark = cutout(icon_src)
    icon_mark_sq = square_pad(icon_mark, pad_frac=0.10)
    icon_mark_sq.save(os.path.join(OUT, "mark-512.png"))
    icon_mark_sq.resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, "mark-master.png"))

    # Favicons / iconos de "añadir a inicio": el icono real sobre un
    # medallón de espresso (--tinta), con anillo de cobre, igual que el
    # resto de webs hermanas pero con la marca real en vez de un emblema
    # inventado.
    def make_icon(size, out_path):
        S = size * 4
        base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(base)
        d.ellipse([0, 0, S, S], fill=TINTA + (255,))
        m = icon_mark_sq.resize((int(S * 0.72), int(S * 0.72)), Image.LANCZOS)
        base.alpha_composite(m, ((S - m.width) // 2, (S - m.height) // 2))
        ring_w = max(2, int(S * 0.012))
        d.ellipse([ring_w // 2, ring_w // 2, S - ring_w // 2, S - ring_w // 2], outline=COBRE + (170,), width=ring_w)
        base = base.resize((size, size), Image.LANCZOS)
        base.convert("RGB").save(out_path)
        print("wrote", out_path, size)

    make_icon(16, os.path.join(OUT, "icon-16.png"))
    make_icon(32, os.path.join(OUT, "icon-32.png"))
    make_icon(96, os.path.join(OUT, "icon-96.png"))
    make_icon(180, os.path.join(OUT, "icon-180.png"))
    make_icon(192, os.path.join(OUT, "icon-192.png"))
    make_icon(512, os.path.join(OUT, "icon-512.png"))

    # Imagen Open Graph: fondo del sitio + el icono REAL (a tamaño grande,
    # legible) + tipografía propia para el título (el rótulo del logo
    # queda demasiado pequeño/borroso si se escala el lockup completo a
    # 1200x630) + la valoración real.
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), TINTA)
    d = ImageDraw.Draw(img)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W * 0.82, H * 0.5
    for rad, col, alpha in [(W * 0.30, COBRE, 60), (W * 0.14, COBRE_VIVO, 80)]:
        gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=col + (alpha,))
    from PIL import ImageFilter
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    icon_og = icon_mark.copy()
    icon_og.thumbnail((360, 360), Image.LANCZOS)
    img.paste(icon_og, (int(cx - icon_og.width / 2), int(cy - icon_og.height / 2)), icon_og)

    title_font = load_font(["georgiab.ttf", "Georgia Bold.ttf", "DejaVuSerif-Bold.ttf"], 100)
    sub_font = load_font(["arial.ttf", "DejaVuSans.ttf"], 30)
    eyebrow_font = load_font(["arialbd.ttf", "DejaVuSans-Bold.ttf"], 24)

    d.ellipse([90, 128, 104, 142], fill=COBRE)
    d.text((118, 116), "CAFÉ BAR · CARBALLO", font=eyebrow_font, fill=(207, 158, 112))
    d.text((86, 168), "Ranqui", font=title_font, fill=CREMA)
    d.text((92, 320), "Un solo giro, de 7:30 a la 1:00 los sábados.", font=sub_font, fill=(212, 196, 174))
    d.text((92, 364), "Café Bar en Carballo · 4,6/5 (146 reseñas en Google)", font=sub_font, fill=(212, 196, 174))

    img.save(os.path.join(OUT_WEB, "og-image.jpg"), quality=90)
    print("wrote og-image.jpg")
