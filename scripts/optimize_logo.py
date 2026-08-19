from pathlib import Path

from PIL import Image


ASSET_NAMES = [
    "icon.png",
    "splash-icon.png",
    "favicon.png",
    "android-icon-foreground.png",
]
ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "images"

for name in ASSET_NAMES:
    path = ASSET_DIR / name
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        rgba.thumbnail((768, 768), Image.Resampling.LANCZOS)
        rgba.save(path, format="PNG", optimize=True, compress_level=9)
