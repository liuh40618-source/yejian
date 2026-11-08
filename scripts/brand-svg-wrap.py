"""Wrap the raster brand marks in SVG so the markup keeps its vector-era shape.

The artwork itself is raster (a brush logotype cannot be reconstructed as clean
paths from a screenshot), but embedding it keeps every call site unchanged:
same filenames, same <img> tags, same sizing.
"""
import base64
import os

PUBLIC = r"D:\Deepseek\reactive-resume-main\apps\web\public"


def wrap(png_path: str, svg_path: str, title: str) -> None:
    with open(png_path, "rb") as handle:
        encoded = base64.b64encode(handle.read()).decode("ascii")
    svg = (
        '<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
        f"<title>{title}</title>\n"
        f'  <image href="data:image/png;base64,{encoded}" x="0" y="0" width="512" height="512"/>\n'
        "</svg>\n"
    )
    with open(svg_path, "w", encoding="utf8") as handle:
        handle.write(svg)
    print(f"{os.path.basename(svg_path):18} {os.path.getsize(svg_path) / 1024:7.1f} KB")


wrap(os.path.join(PUBLIC, "icon", "light.png"), os.path.join(PUBLIC, "icon", "light.svg"), "页见")
wrap(os.path.join(PUBLIC, "icon", "dark.png"), os.path.join(PUBLIC, "icon", "dark.svg"), "页见")
wrap(os.path.join(PUBLIC, "logo", "light.png"), os.path.join(PUBLIC, "logo", "light.svg"), "页见")
wrap(os.path.join(PUBLIC, "logo", "dark.png"), os.path.join(PUBLIC, "logo", "dark.svg"), "页见")
wrap(os.path.join(PUBLIC, "favicon.png"), os.path.join(PUBLIC, "favicon.svg"), "页见")
