"""Small-size icon variants: drop the seal, thicken strokes, keep the silhouette.

The logotype is a brush mark with hairlines as thin as ~4px at its native size.
Below ~40px those hairlines turn to grey mush, so a browser tab shows a smudge
instead of a word. These variants are for the tab and the app icon only; the full
mark stays untouched everywhere the logo is actually looked at.
"""
import os
from PIL import Image, ImageFilter, ImageOps
import numpy as np

BRAND = r"D:\Deepseek\reactive-resume-main\apps\web\public\brand"
PUBLIC = r"D:\Deepseek\reactive-resume-main\apps\web\public"
INK = (11, 13, 18)
PAPER = (249, 248, 245)

full = Image.open(os.path.join(BRAND, "logo-full.png")).convert("RGB")
gray = np.array(full.convert("L"))
ink_mask = gray < 160

# --- Drop the seal -----------------------------------------------------------------
# The seal is the only red element: a single connected blob in the mark's bottom-right.
rgb = np.array(full).astype(int)
red = (rgb[:, :, 0] - rgb[:, :, 1] > 50) & (rgb[:, :, 0] - rgb[:, :, 2] > 50) & (rgb[:, :, 0] > 110)
ys, xs = np.where(red)
pad = 6
seal = (max(0, xs.min() - pad), max(0, ys.min() - pad), xs.max() + 1 + pad, ys.max() + 1 + pad)
print("seal", seal)

# Paint the seal square to paper, then cut the mark back to its own ink: the logotype
# is untouched, the stamp is gone, and no column of the mark is clipped.
without = full.copy()
without.paste(PAPER, seal)
mark_mask = np.array(without.convert("L")) < 160
mark_mask[int(ys.min()) :, :] = mark_mask[int(ys.min()) :, :]  # keep the mark's bottom edge intact
rows = np.where(mark_mask.any(axis=1))[0]
cols = np.where(mark_mask.any(axis=0))[0]
# The mark ends above the wordmark: its own last row is the baseline of the monogram.
mark_rows = rows[rows < int(ys.max()) + 200]
mark = without.crop((int(cols.min()) - 4, 0, int(cols.max()) + 5, int(ys.min()) + 16))
mark.save(os.path.join(BRAND, "logo-mark-clean.png"))
print("mark without seal", mark.size)


def alpha_of(image: Image.Image, threshold: float = 160) -> Image.Image:
    g = np.array(image.convert("L")).astype(np.float32)
    alpha = np.clip((250 - g) / (250 - threshold), 0, 1) * 255
    return Image.fromarray(alpha.astype(np.uint8), "L")


def thicken(alpha: Image.Image, px: float) -> Image.Image:
    """Dilate the ink with a blur-and-threshold, so hairlines survive a 16px render."""
    blurred = alpha.filter(ImageFilter.GaussianBlur(px))
    a = np.array(blurred).astype(np.float32)
    # Anything the blur spread more than a whisper of ink onto becomes solid ink.
    return Image.fromarray(np.clip(a * 2.2, 0, 255).astype(np.uint8), "L")


def on_square(mask: Image.Image, side: int, coverage: float) -> Image.Image:
    target = int(side * coverage)
    ratio = target / max(mask.size)
    scaled = mask.resize((max(1, round(mask.width * ratio)), max(1, round(mask.height * ratio))), Image.LANCZOS)
    canvas = Image.new("L", (side, side), 0)
    canvas.paste(scaled, ((side - scaled.width) // 2, (side - scaled.height) // 2))
    return canvas


def cut(mask: Image.Image, color) -> Image.Image:
    out = Image.new("RGBA", mask.size, color + (0,))
    out.putalpha(mask)
    return out


# The icon master: seal removed, strokes thickened at 1024 so 16px still reads.
base = alpha_of(mark)
master = on_square(thicken(base, 1.6), 1024, 0.74)
cut(master, INK).save(os.path.join(BRAND, "logo-mark-icon.png"))
cut(master, (255, 255, 255)).save(os.path.join(BRAND, "logo-mark-icon-reversed.png"))

for size, name in ((512, "pwa-512x512.png"), (192, "pwa-192x192.png"), (64, "pwa-64x64.png")):
    cut(master.resize((size, size), Image.LANCZOS), INK).save(os.path.join(PUBLIC, name))

apple = cut(on_square(thicken(base, 1.6), 180, 0.74), INK)
apple.save(os.path.join(PUBLIC, "apple-touch-icon-180x180.png"))

# A maskable icon is cropped to a circle of 80% of its box: keep the mark in that safe zone.
maskable = cut(on_square(thicken(base, 1.6), 512, 0.56), INK)
paper = Image.new("RGBA", (512, 512), PAPER + (255,))
paper.alpha_composite(maskable)
paper.save(os.path.join(PUBLIC, "maskable-icon-512x512.png"))

icon = cut(master.resize((256, 256), Image.LANCZOS), INK)
icon.save(os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (256, 256)])
icon.save(os.path.join(PUBLIC, "favicon.png"))

# Header and loader: the mark without the seal, at its natural weight.
app_light = cut(on_square(thicken(base, 1.0), 512, 0.80), INK)
app_dark = cut(on_square(thicken(base, 1.0), 512, 0.80), (255, 255, 255))
app_light.save(os.path.join(PUBLIC, "icon", "light.png"))
app_dark.save(os.path.join(PUBLIC, "icon", "dark.png"))

# Footer lockup: mark without seal above the wordmark, matching the source lockup.
# The wordmark starts below the seal's bottom edge, so this crop keeps it whole.
wm = full.crop((0, seal[3] + 8, full.width, full.height))
wm_mask = alpha_of(wm)
wm_rows = np.where((np.array(wm_mask) > 40).any(axis=1))[0]
wm_cols = np.where((np.array(wm_mask) > 40).any(axis=0))[0]
wm_mask = wm_mask.crop((int(wm_cols.min()), int(wm_rows.min()), int(wm_cols.max()) + 1, int(wm_rows.max()) + 1))

gap = 34
lock_w = max(master.width, wm_mask.width) + 40
lock_h = master.height + gap + wm_mask.height + 40
lock_mask = Image.new("L", (lock_w, lock_h), 0)
lock_mask.paste(master, ((lock_w - master.width) // 2, 20))
lock_mask.paste(wm_mask, ((lock_w - wm_mask.width) // 2, 20 + master.height + gap))
cut(lock_mask, INK).save(os.path.join(PUBLIC, "logo", "light.png"))
cut(lock_mask, (255, 255, 255)).save(os.path.join(PUBLIC, "logo", "dark.png"))

for name in ("logo-mark-icon.png", "logo-mark-icon-reversed.png", "logo-mark-clean.png"):
    print(f"brand/{name:30} {os.path.getsize(os.path.join(BRAND, name)) / 1024:7.1f} KB")
