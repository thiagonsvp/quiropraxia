from pathlib import Path
from PIL import Image

BASE = Path(__file__).resolve().parent.parent

SOURCES = {
    "img/hero-giselle": "WhatsApp Image 2026-09-03 at 14.21.11 (1).jpeg",
    "img/metodo-giselle": "WhatsApp Image 2026-09-03 at 14.21.12.jpeg",
    "img/sobre-giselle": "WhatsApp Image 2026-09-03 at 14.21.12 (2).jpeg",
}


def main():
    img_dir = BASE / "img"
    img_dir.mkdir(exist_ok=True)
    for dest_stem, source_name in SOURCES.items():
        source_path = BASE / source_name
        im = Image.open(source_path).convert("RGB")
        webp_path = BASE / f"{dest_stem}.webp"
        jpg_path = BASE / f"{dest_stem}.jpg"
        im.save(webp_path, "WEBP", quality=78, method=6)
        im.save(jpg_path, "JPEG", quality=82, optimize=True)
        print(
            f"{source_name} -> {webp_path.name} "
            f"({webp_path.stat().st_size // 1024} KB), "
            f"{jpg_path.name} ({jpg_path.stat().st_size // 1024} KB)"
        )


if __name__ == "__main__":
    main()
