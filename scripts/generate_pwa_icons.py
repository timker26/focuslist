from pathlib import Path

from PIL import Image


project_root = Path(__file__).resolve().parents[1]
source = project_root / "assets" / "images" / "icon.png"
target_dir = project_root / "public"
target_dir.mkdir(exist_ok=True)

with Image.open(source) as image:
    rgba = image.convert("RGBA")
    for size in (192, 512):
        resized = rgba.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(target_dir / f"pwa-icon-{size}.png", format="PNG", optimize=True, compress_level=9)
