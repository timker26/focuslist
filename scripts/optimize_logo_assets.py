from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/webdev-static-assets/focuslist-logo-v2.png")
TARGETS = {
    "assets/images/icon.png": 1024,
    "assets/images/splash-icon.png": 1024,
    "assets/images/android-icon-foreground.png": 1024,
    "assets/images/favicon.png": 256,
}


def main() -> None:
    with Image.open(SOURCE) as image:
        source = image.convert("RGBA")
        for relative_path, size in TARGETS.items():
            target = source.resize((size, size), Image.Resampling.LANCZOS)
            target.save(relative_path, "PNG", optimize=True, compress_level=9)


if __name__ == "__main__":
    main()
