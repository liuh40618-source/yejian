"""Favicon assets, sized for where they are actually seen.

The logotype is a brush mark whose hairlines are roughly 0.4% of its width. Below about
40px those strokes fall between pixel centres and average to grey, so a straight downscale
shows a smudge rather than a word. Each size below is therefore adjusted for its grid:

32px+  the real mark, fattened just enough that both characters stay solid;
48px+  the same treatment, lighter, because more pixels are available;
  16px is deliberately not shipped. At 16 pixels the brush strokes are narrower than one
       pixel, so every variant tried (downscale, fatten, inverted, redrawn octagon) came out
       as noise or as a blank frame. An .ico without a 16px entry makes the browser scale
       the 32px one: soft, but still the logo, which beats a smudge.
"""
import os
from PIL import Image, ImageFilter
import numpy as np

BRAND = r"D:\Deepseek\reactive-resume-main\apps\web\public\brand"
PUBLIC = r"D:\Deepseek\reactive-resume-main\apps\web\public"
INK = (11, 13, 18)

clean = Image.open(os.path.join(BRAND, "logo-mark-clean.png")).convert("L")
raw = np.array(clean).astype(np.float32)
alpha = Image.fromarray((np.clip((250 - raw) / 90, 0, 1) * 255).astype(np.uint8), "L")


def fattened(blur: float, boost: float) -> Image.Image:
    """Grow every stroke: blur spreads the ink, boost pulls it back to full opacity."""
    blurred = np.array(alpha.filter(ImageFilter.GaussianBlur(blur))).astype(np.float32) / 255
    return Image.fromarray((np.clip(blurred * boost, 0, 1) * 255).astype(np.uint8), "L")


def fit(mask: Image.Image, size: int, coverage: float = 0.92) -> Image.Image:
    ratio = (size * coverage) / max(mask.size)
    scaled = mask.resize(
        (max(1, round(mask.width * ratio)), max(1, round(mask.height * ratio))), Image.LANCZOS
    )
    canvas = Image.new("L", (size, size), 0)
    canvas.paste(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2))
    return canvas


def snap(mask: Image.Image, threshold: int) -> Image.Image:
    """Ink or clear: at these sizes a half-covered pixel reads as dirt, not as an edge."""
    return mask.point(lambda v: 255 if v > threshold else 0)


def cut(mask: Image.Image, color=INK) -> Image.Image:
    out = Image.new("RGBA", mask.size, color + (0,))
    out.putalpha(mask)
    return out


# 16px keeps the most contrast it can: a heavier boost, thresholded hard.
frames = {
    32: snap(fit(fattened(0.8, 1.6), 32), 118),
    48: snap(fit(fattened(0.4, 1.25), 48), 120),
    64: fit(fattened(0.3, 1.15), 64),
}

# An .ico carries one image per entry, so each size keeps its own variant.
cut(frames[64]).save(
    os.path.join(PUBLIC, "favicon.ico"),
    sizes=[(32, 32), (48, 48), (64, 64)],
    append_images=[cut(frames[32]), cut(frames[48])],
)
cut(fit(fattened(0.3, 1.15), 180)).save(os.path.join(PUBLIC, "favicon.png"))
cut(fit(fattened(0.3, 1.15), 256)).save(os.path.join(BRAND, "logo-mark-favicon.png"))
print("favicon.ico", round(os.path.getsize(os.path.join(PUBLIC, "favicon.ico")) / 1024, 1), "KB")
