"""Strip the generator watermark and cut brand assets from the source logo."""
import os
from PIL import Image
import numpy as np

SRC = r"C:\Users\LH304\.workbuddy-ai\clipboard-images\clipboard-2026-11-05T08-33-18-896Z-d911ec64.png"
OUT = r"D:\Deepseek\reactive-resume-main\apps\web\public\brand"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert("RGB")
w, h = img.size
print("source", img.size)

# The watermark sits in the bottom-right corner. Measure what is actually there.
corner = np.array(img.crop((w - 320, h - 110, w, h)).convert("L"))
print("corner min/max", corner.min(), corner.max())


def remove_watermark(image: Image.Image) -> Image.Image:
    """Paint the whole corner band paper-white.

    The logo never reaches this area, so flattening the band loses nothing and
    removes the light-grey watermark cleanly instead of leaving a blur.
    """
    arr = np.array(image).copy()
    # Solid paper white across the bottom strip, feathered on its top edge so no seam shows.
    band_h = 120
    top = h - band_h
    for y in range(top, h):
        # 0 at the top edge, 1 by the time we are 24px in
        t = min(1.0, (y - top) / 24.0)
        arr[y, :, :] = (arr[y, :, :] * (1 - t) + 255 * t).astype(arr.dtype)
    return Image.fromarray(arr)


clean = remove_watermark(img)
clean.save(os.path.join(OUT, "logo-source.png"))

gray = np.array(clean.convert("L"))
# Ink = clearly darker than paper. The logo is pure black on near-white.
ink = gray < 160
ys, xs = np.where(ink)
print("ink bbox", xs.min(), ys.min(), xs.max(), ys.max())

# Tight crop around everything that carries ink, leaving a small optical margin.
pad = 24
box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(w, xs.max() + pad), min(h, ys.max() + pad))
cropped = clean.crop(box)
print("cropped", cropped.size)
cropped.save(os.path.join(OUT, "logo-full.png"))
