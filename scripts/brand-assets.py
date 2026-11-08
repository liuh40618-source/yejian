"""Strip the generator watermark and cut every brand asset the app loads.

Run `python scripts/brand-from-logo.py` first: it removes the watermark and
writes apps/web/public/brand/logo-full.png (mark + wordmark, tightly cropped).

The logo is black ink on a near-white ground, not a shape with a transparent
interior. Every icon below therefore keeps its paper ground and is cut with an
alpha mask, so the mark reads the same on light and dark chrome. The reversed
variant swaps only the ink, leaving the paper transparent: white strokes on a
dark header instead of a white square.
"""
import os
from PIL import Image
import numpy as np

BRAND = r"D:\Deepseek\reactive-resume-main\apps\web\public\brand"
PUBLIC = r"D:\Deepseek\reactive-resume-main\apps\web\public"

INK = (11, 13, 18)
PAPER = (249, 248, 245)

full = Image.open(os.path.join(BRAND, "logo-full.png")).convert("RGB")
w, h = full.size

gray = np.array(full.convert("L"))
ink_mask = gray < 160


def bbox_rows(y0: int, y1: int):
    ys, xs = np.where(ink_mask[y0:y1, :])
    return xs.min(), ys.min() + y0, xs.max() + 1, ys.max() + 1 + y0


# The mark ends and the wordmark begins at the widest empty horizontal gap below the seal.
row_ink = ink_mask.sum(axis=1)
gaps, run_start = [], None
for y in range(int(h * 0.5), h):
    if row_ink[y] == 0:
        run_start = y if run_start is None else run_start
    elif run_start is not None:
        gaps.append((run_start, y))
        run_start = None
if run_start is not None:
    gaps.append((run_start, h))
gap = max(gaps, key=lambda g: g[1] - g[0])

mark = full.crop(bbox_rows(0, gap[0]))
wordmark = full.crop(bbox_rows(gap[1], h))
mark.save(os.path.join(BRAND, "logo-mark.png"))
wordmark.save(os.path.join(BRAND, "logo-wordmark.png"))
print("mark", mark.size, "wordmark", wordmark.size)


def alpha_of(image: Image.Image) -> Image.Image:
    """The image's own ink as an alpha channel: dark pixels opaque, paper clear."""
    g = np.array(image.convert("L")).astype(np.float32)
    # Below 160 is solid ink; 160..250 ramps out, so an edge stays smooth at 2x.
    alpha = np.clip((250 - g) / 90, 0, 1) * 255
    return Image.fromarray(alpha.astype(np.uint8), "L")


def tinted(image: Image.Image, color) -> Image.Image:
    """Recolour an image's ink, keeping its shape via alpha."""
    flat = Image.new("RGBA", image.size, color + (0,))
    flat.putalpha(alpha_of(image))
    return flat


def on_square(image: Image.Image, side: int, coverage: float, background=None) -> Image.Image:
    """Centre `image` on a square so its longest side takes `coverage` of the square."""
    target = int(side * coverage)
    ratio = target / max(image.size)
    scaled = image.resize((max(1, round(image.width * ratio)), max(1, round(image.height * ratio))), Image.LANCZOS)
    canvas = Image.new("RGBA", (side, side), background if background else (0, 0, 0, 0))
    canvas.alpha_composite(scaled, ((side - scaled.width) // 2, (side - scaled.height) // 2))
    return canvas


# --- Icons -----------------------------------------------------------------------
# A launcher icon sits in a rounded square drawn by the OS, so the mark keeps a
# generous inset: 0.62 reads as deliberate at 32px and still survives a round mask.
dark_mark = tinted(mark, INK)
mark_sq = on_square(dark_mark, 1024, 0.62)
mark_sq.save(os.path.join(BRAND, "logo-mark-square.png"))

mark_sq.resize((512, 512), Image.LANCZOS).save(os.path.join(PUBLIC, "pwa-512x512.png"))
mark_sq.resize((192, 192), Image.LANCZOS).save(os.path.join(PUBLIC, "pwa-192x192.png"))
mark_sq.resize((64, 64), Image.LANCZOS).save(os.path.join(PUBLIC, "pwa-64x64.png"))
mark_sq.resize((180, 180), Image.LANCZOS).save(os.path.join(PUBLIC, "apple-touch-icon-180x180.png"))

# A maskable icon is cropped to a circle of 80% of its box: the mark must live inside
# that safe zone, on the paper surface the manifest already names.
maskable = on_square(dark_mark, 1024, 0.55, PAPER + (255,))
maskable.resize((512, 512), Image.LANCZOS).save(os.path.join(PUBLIC, "maskable-icon-512x512.png"))

icon = mark_sq.resize((256, 256), Image.LANCZOS)
icon.save(os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (256, 256)])
icon.save(os.path.join(PUBLIC, "favicon.png"))

# --- Reversed mark, for dark surfaces ---------------------------------------------
light_mark = tinted(mark, (255, 255, 255))
light_sq = on_square(light_mark, 1024, 0.62)
light_sq.save(os.path.join(BRAND, "logo-mark-reversed.png"))

# --- Assets the app renders with <img> --------------------------------------------
mark_sq.resize((512, 512), Image.LANCZOS).save(os.path.join(PUBLIC, "icon", "light.png"))
light_sq.resize((512, 512), Image.LANCZOS).save(os.path.join(PUBLIC, "icon", "dark.png"))

lock = tinted(full, INK)
lock.thumbnail((1024, 1024), Image.LANCZOS)
lock.save(os.path.join(PUBLIC, "logo", "light.png"))
tinted(full, (255, 255, 255)).resize(lock.size, Image.LANCZOS).save(os.path.join(PUBLIC, "logo", "dark.png"))

for name in sorted(os.listdir(BRAND)):
    path = os.path.join(BRAND, name)
    print(f"brand/{name:26} {os.path.getsize(path) / 1024:7.1f} KB")
