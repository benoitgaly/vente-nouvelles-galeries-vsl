"""
Découpe la page 4 du teaser (4 plans architecturaux en grille 2x2) en 4 images JPG
distinctes correspondant aux 4 niveaux du bien :
  - plan-sous-sol.jpg : sous-sol (surface vente 110 m² + 621 m²)
  - plan-rdc.jpg      : RDC (entrée + vente 850 m² + bureaux/réception 45 m²)
  - plan-r1.jpg       : 1er étage (surface de vente 825 m²)
  - plan-r2.jpg       : 2e étage (bureaux 200 m² + vente 400 m² + réserves 130 m²)

Source : teaser_villeneuve.pdf, page 4.
Sortie  : site/assets/plans/plan-*.jpg
"""
from __future__ import annotations

from pathlib import Path
import pypdfium2 as pdfium
from PIL import Image, ImageOps

BASE = Path(r"C:\Users\benoi\Dropbox\_Sociétés\JMG Immob")
PDF = BASE / "teaser_villeneuve.pdf"
OUT_DIR = BASE / "site" / "assets" / "plans"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Cache du rendu de la page 4 (pour ne pas re-rendre à chaque ajustement).
RENDER_CACHE = BASE / "_teaser_extract" / "pages_rendered" / "page_04.jpg"
RENDER_CACHE.parent.mkdir(parents=True, exist_ok=True)


def render_page_04() -> Image.Image:
    """Rend la page 4 du teaser à ~200 DPI et la cache sur disque."""
    if RENDER_CACHE.exists():
        img = Image.open(RENDER_CACHE)
        img.load()
        return img.convert("RGB")
    pdf = pdfium.PdfDocument(str(PDF))
    page = pdf[3]  # page 4 (index 0-based)
    # scale ~200 DPI : 200/72 ≈ 2.78. On vise ~1488x2106 (A4 portrait à 200 DPI = 1654x2339 ;
    # le PDF Sinico est probablement A4 paysage ou recadré → on rend et on regarde la taille).
    pil = page.render(scale=2.78).to_pil()
    if pil.mode != "RGB":
        pil = pil.convert("RGB")
    pil.save(RENDER_CACHE, "JPEG", quality=92, optimize=True, progressive=True)
    pdf.close()
    return pil


def crop_and_save(src: Image.Image, box: tuple[int, int, int, int], out_name: str) -> tuple[int, int, int]:
    """Crop une zone, auto-contraste léger, ré-échantillonne à max 1800 px côté long, sauve JPEG q=90.
    Retourne (width, height, size_bytes)."""
    crop = src.crop(box)
    crop = ImageOps.autocontrast(crop, cutoff=2)
    # Limiter le côté long à 1800 px
    w, h = crop.size
    long_side = max(w, h)
    if long_side > 1800:
        scale = 1800 / long_side
        new_size = (int(w * scale), int(h * scale))
        crop = crop.resize(new_size, Image.LANCZOS)
    out_path = OUT_DIR / out_name
    crop.save(out_path, "JPEG", quality=90, optimize=True, progressive=True)
    size = out_path.stat().st_size
    return (*crop.size, size)


def main() -> None:
    page = render_page_04()
    W, H = page.size
    print(f"Page 4 rendue : {W} x {H}")

    # Coordonnées définies en proportions sur la page rendue (1654x2341).
    # Repères visuels :
    #   - sous-sol / RDC : titres y≈660, plans y∈[700,1340] approx.
    #   - 1er / 2e étage : titres y≈1480, plans y∈[1500,2180] approx.
    #   - sous-sol et R+1 commencent à x≈40 et finissent à x≈630
    #   - RDC et R+2 commencent à x≈780 et finissent à x≈1450
    # On prend une marge confortable autour de chaque plan, sans dépasser sur le voisin.
    def box(x0: float, y0: float, x1: float, y1: float) -> tuple[int, int, int, int]:
        return (int(W * x0), int(H * y0), int(W * x1), int(H * y1))

    plans = {
        # haut-gauche : sous-sol
        "plan-sous-sol.jpg": box(0.015, 0.265, 0.460, 0.555),
        # haut-droite : rez-de-chaussée (commence un peu plus à gauche pour ne pas couper "Entrée Clients")
        "plan-rdc.jpg":      box(0.470, 0.265, 0.940, 0.555),
        # bas-gauche : 1er étage
        "plan-r1.jpg":       box(0.015, 0.560, 0.460, 0.880),
        # bas-droite : 2e étage
        "plan-r2.jpg":       box(0.470, 0.560, 0.940, 0.880),
    }

    print("\nDécoupes :")
    for name, box in plans.items():
        w, h, size = crop_and_save(page, box, name)
        print(f"  {name:22s}  box={box}  -> {w}x{h}  ({size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
