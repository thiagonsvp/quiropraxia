from pathlib import Path
from PIL import Image

BASE = Path(__file__).resolve().parent.parent
SOURCE = "GG-Logo-marca-d'agua (1).png"
TARGET_WIDTH = 900


def main():
    im = Image.open(BASE / SOURCE).convert("RGBA")
    bbox = im.split()[-1].getbbox()
    pad = 10
    l, t, r, b = bbox
    l, t = max(0, l - pad), max(0, t - pad)
    r, b = min(im.width, r + pad), min(im.height, b + pad)
    cropped = im.crop((l, t, r, b))

    scale = TARGET_WIDTH / cropped.width
    resized = cropped.resize((TARGET_WIDTH, round(cropped.height * scale)), Image.LANCZOS)

    img_dir = BASE / "img"
    img_dir.mkdir(exist_ok=True)
    webp_path = img_dir / "logo-giselle.webp"
    png_path = img_dir / "logo-giselle.png"
    resized.save(webp_path, "WEBP", quality=92, method=6)
    resized.save(png_path, "PNG", optimize=True)
    print(f"logo-giselle.webp ({webp_path.stat().st_size // 1024} KB), "
          f"logo-giselle.png ({png_path.stat().st_size // 1024} KB), size={resized.size}")


if __name__ == "__main__":
    main()
