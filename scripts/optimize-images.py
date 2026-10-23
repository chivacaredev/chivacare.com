"""Shrink oversized images under public/assets in place (same path and format).

Usage: python scripts/optimize-images.py   (run again after copy-uploads.py)

JPEGs wider than MAX_WIDTH are scaled down and re-saved at QUALITY as
progressive JPEG; PNGs are only re-compressed losslessly. A file is
replaced only when the result is at least 10% smaller, so re-running is safe.
"""
import io
import sys
from pathlib import Path

from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path('public/assets')
MIN_BYTES = 150 * 1024
MAX_WIDTH = 1600
QUALITY = 80

before = after = 0
for path in sorted(ROOT.rglob('*')):
    ext = path.suffix.lower()
    if ext not in {'.jpg', '.jpeg', '.png'} or path.stat().st_size < MIN_BYTES:
        continue
    size = path.stat().st_size
    with Image.open(path) as im:
        im.load()
        out = io.BytesIO()
        if ext == '.png':
            im.save(out, 'PNG', optimize=True)
        else:
            im = ImageOps.exif_transpose(im).convert('RGB')  # bake rotation in; EXIF is dropped below
            if im.width > MAX_WIDTH:
                im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
            im.save(out, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    if out.tell() < size * 0.9:
        path.write_bytes(out.getvalue())
        before += size
        after += out.tell()
        print(f'{size // 1024:>6} KB -> {out.tell() // 1024:>5} KB  {path.relative_to(ROOT)}')

print(f'Saved {(before - after) // 1024} KB ({before // 1024} KB -> {after // 1024} KB)')
