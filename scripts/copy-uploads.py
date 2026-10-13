"""Copy only the legacy images that public content references.

Usage: python scripts/copy-uploads.py <legacy site root>

Files keep their original path under assets/ (e.g.
assets/uploads/img_blog/main/x.jpg) so URLs inside rich-text content
keep working. Customer folders (slip, file_payment, img_profile) are
never touched.
"""
import json
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import unquote

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(sys.argv[1])
DB = Path('src/data/db')
DEST = Path('public')
IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf'}

# table -> (uploads folder, file columns)
SOURCES = {
    'activities': ('img_activities', ['photomain']),
    'advertiser': ('img_advertiser', ['photomain']),
    'assessment': ('img_assessment', ['img_assessment']),
    'assessment_case': ('img_assessmentcase', ['img_assessment']),
    'blog': ('img_blog', ['photomain']),
    'categories': ('img_category', ['img_category']),
    'promotions': ('img_promotions', ['photomain']),
    'reviews': ('img_reviews', ['photomain']),
    'services': ('img_services', ['photomain', 'download_th', 'download_en']),
    'teams': ('img_teams', ['photomain', 'photomain2']),
    'video': ('img_video', ['photomain']),
}


def copy(src):
    dest = DEST / src.relative_to(ROOT)
    if dest.exists():
        return 0
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    return 1


copied, missing, skipped = 0, [], []
for table, (folder, cols) in SOURCES.items():
    # one file name can exist in several size folders (main/, 500x500/, ...)
    index = {}
    for f in (ROOT / 'assets/uploads' / folder).rglob('*'):
        if f.is_file():
            index.setdefault(f.name, []).append(f)
    for row in json.loads((DB / f'{table}.json').read_text(encoding='utf-8')):
        for col in cols:
            name = (row.get(col) or '').strip()
            if not name:
                continue
            if Path(name).suffix.lower() not in IMAGE_EXT:
                skipped.append(f'{folder}/{name}')
                continue
            if Path(name).name not in index:
                missing.append(f'{folder}/{name}')
                continue
            copied += sum(copy(f) for f in index[Path(name).name])

# images embedded in rich-text HTML (CKEditor uploads, theme images)
refs = set()
for f in DB.glob('*.json'):
    for row in json.loads(f.read_text(encoding='utf-8')):
        for value in row.values():
            if isinstance(value, str):
                for url in re.findall(r"(?:src|href)\s*=\s*[\"']([^\"']+)", value):
                    m = re.search(r'/(assets/(?:files|uploads|layouts)/.+)$', unquote(url))
                    if m:
                        refs.add(m.group(1))
for ref in sorted(refs):
    src = ROOT / ref
    if src.is_file():
        copied += copy(src)
    else:
        missing.append(ref)

print(f'copied {copied}')
print(f'skipped non-image {len(skipped)}: {skipped}')
print(f'missing {len(missing)}: {missing}')
