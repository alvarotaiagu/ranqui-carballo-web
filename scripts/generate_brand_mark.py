"""
Genera la marca propia de Café Bar Ranqui: una taza vista de perfil con un
remolino de crema dentro, dibujada a mano con PIL. El negocio SÍ tiene un
logo real (remolino marrón/crema dentro de una taza, con el rótulo
"Ranqui"), pero no se recibió el archivo — solo se vio pegado en el chat,
sin ruta accesible — así que esta marca es una interpretación GEOMÉTRICA
PROPIA del mismo concepto (taza + remolino), no un trazado ni una
reproducción del logo real. En cuanto el negocio pase el archivo, sustituir
todo lo de assets/img/logo/ por el logo real (ver README).
"""
from PIL import Image, ImageDraw, ImageFilter
import math
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "logo")
os.makedirs(OUT, exist_ok=True)

S = 1024  # supersample size
CX, CY = S / 2, S / 2
R = S * 0.46

TINTA = (36, 22, 17, 255)       # --tinta
CREMA = (246, 236, 221, 255)    # --crema
NATA = (255, 246, 234, 255)     # --nata
COBRE = (184, 112, 58, 255)     # --cobre
COBRE_VIVO = (224, 153, 79, 255)  # --cobre-vivo


def swirl_points(turns=2.6, steps=380, a=5.0, b=0.24):
    pts = []
    max_theta = turns * 2 * math.pi
    for i in range(steps + 1):
        theta = (i / steps) * max_theta
        r = a * math.exp(b * theta)
        pts.append((theta, r))
    max_r = pts[-1][1]
    return [(theta, r / max_r) for theta, r in pts]


def make_mark():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Medallion base: espresso
    d.ellipse([CX - R, CY - R, CX + R, CY + R], fill=TINTA)

    # Cup body: a rounded cup silhouette in crema, slightly lower than
    # center so a handle fits on the right without touching the ring.
    cup_w = R * 1.12
    cup_h = R * 1.0
    cup_top = CY - cup_h * 0.34
    cup_bottom = CY + cup_h * 0.5
    cup_left = CX - cup_w * 0.42
    cup_right = CX + cup_w * 0.34

    cup = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cup)
    cd.rounded_rectangle(
        [cup_left, cup_top, cup_right, cup_bottom],
        radius=(cup_right - cup_left) * 0.14,
        fill=CREMA,
    )
    # Handle: a torus made from two ellipses (outer minus inner)
    handle_cx = cup_right + (cup_right - cup_left) * 0.16
    handle_cy = (cup_top + cup_bottom) / 2
    handle_r_out = (cup_bottom - cup_top) * 0.26
    handle_r_in = handle_r_out * 0.55
    cd.ellipse(
        [handle_cx - handle_r_out, handle_cy - handle_r_out, handle_cx + handle_r_out, handle_cy + handle_r_out],
        fill=CREMA,
    )
    cd.ellipse(
        [handle_cx - handle_r_in, handle_cy - handle_r_in, handle_cx + handle_r_in, handle_cy + handle_r_in],
        fill=(0, 0, 0, 0),
    )
    # Punch the handle hole through with proper compositing
    mask_hole = Image.new("L", (S, S), 255)
    mhd = ImageDraw.Draw(mask_hole)
    mhd.ellipse(
        [handle_cx - handle_r_in, handle_cy - handle_r_in, handle_cx + handle_r_in, handle_cy + handle_r_in],
        fill=0,
    )
    cup.putalpha(Image.composite(cup.getchannel("A"), Image.new("L", (S, S), 0), mask_hole))

    img = Image.alpha_composite(img, cup)
    d = ImageDraw.Draw(img)

    # Espresso interior (rim ellipse) where the swirl lives.
    rim_w = (cup_right - cup_left) * 0.86
    rim_h = rim_w * 0.30
    rim_cx = (cup_left + cup_right) / 2
    rim_cy = cup_top + rim_h * 0.05
    d.ellipse(
        [rim_cx - rim_w / 2, rim_cy - rim_h / 2, rim_cx + rim_w / 2, rim_cy + rim_h / 2],
        fill=(58, 36, 22, 255),
        outline=(*COBRE[:3], 200),
        width=int(S * 0.006),
    )

    # Swirl of crema inside the cup: logarithmic spiral, thickening and
    # brightening toward the centre.
    pts = swirl_points()
    swirl_r = min(rim_w, rim_h * 3.1) * 0.46
    prev = None
    n = len(pts)
    for i, (theta, rn) in enumerate(pts):
        x = rim_cx + math.cos(theta) * rn * swirl_r
        y = rim_cy + math.sin(theta) * rn * swirl_r * (rim_h / rim_w) * 3.0
        if prev is not None:
            t = i / n
            w = max(2, (S * 0.004) + t * (S * 0.014))
            col = tuple(round(COBRE_VIVO[c] + (NATA[c] - COBRE_VIVO[c]) * t) for c in range(3))
            d.line([prev, (x, y)], fill=(*col, 235), width=int(w))
        prev = (x, y)

    # Clip everything to the outer circle, then redraw the ring on top.
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([CX - R, CY - R, CX + R, CY + R], fill=255)
    img = Image.composite(img, Image.new("RGBA", (S, S), (0, 0, 0, 0)), mask)
    d = ImageDraw.Draw(img)
    ring_w = S * 0.012
    d.ellipse(
        [CX - R, CY - R, CX + R, CY + R],
        outline=(*COBRE[:3], 170),
        width=int(ring_w),
    )

    return img


def save_sizes(img, prefix, sizes, bg=None):
    for size in sizes:
        resized = img.resize((size, size), Image.LANCZOS)
        if bg is not None:
            canvas = Image.new("RGBA", (size, size), bg)
            canvas.alpha_composite(resized)
            canvas.convert("RGB").save(os.path.join(OUT, f"{prefix}-{size}.png"))
        else:
            resized.save(os.path.join(OUT, f"{prefix}-{size}.png"))


if __name__ == "__main__":
    mark = make_mark()
    mark.save(os.path.join(OUT, "mark-master.png"))

    save_sizes(mark, "mark", [512])
    save_sizes(mark, "icon", [16, 32, 96, 180, 192, 512], bg=TINTA)

    print("done")
