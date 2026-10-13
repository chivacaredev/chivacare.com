"""Build the favicon set from the ChivaCare "C" mark in the header logo.

Usage: python scripts/make-favicons.py
"""
from pathlib import Path

from PIL import Image

SRC = Path('public/assets/layouts/frontend/images/logo-chivacare.png')
OUT = Path('public')

logo = Image.open(SRC).convert('RGBA')
alpha = logo.getchannel('A')
w, h = logo.size

# The mark is the first opaque run of columns; the word "ChivaCare" starts after a transparent gap.
cols = [any(alpha.getpixel((x, y)) > 16 for y in range(h)) for x in range(w)]
start = cols.index(True)
end = start
while end < w and cols[end]:
    end += 1
mark = logo.crop((start, 0, end, h))
mark = mark.crop(mark.getchannel('A').getbbox())


def square(size, pad=0.06, background=None):
    """Mark centred on a square canvas with `pad` margin on each side."""
    canvas = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    inner = round(size * (1 - 2 * pad))
    scale = inner / max(mark.size)
    resized = mark.resize((max(1, round(mark.width * scale)), max(1, round(mark.height * scale))), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


square(256).save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
square(32).save(OUT / 'favicon-32x32.png')
# iOS ignores transparency, so the touch icon gets a white background.
square(180, pad=0.12, background=(255, 255, 255, 255)).save(OUT / 'apple-touch-icon.png')
square(192, pad=0.1).save(OUT / 'icon-192.png')
square(512, pad=0.1).save(OUT / 'icon-512.png')
print(f'mark {mark.size} from columns {start}-{end} of {w}')
