from __future__ import annotations
import argparse, json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'web' / 'assets' / 'places'
manifest = root / 'data' / 'place-gallery.json'
parser = argparse.ArgumentParser(description='Convert the imported place gallery to optimized WebP files.')
parser.add_argument('--apply', action='store_true', help='write WebP files, update the manifest, then remove local JPEG/PNG copies')
args = parser.parse_args()
data = json.loads(manifest.read_text(encoding='utf-8'))
paths = sorted(p for p in assets.rglob('*') if p.is_file() and p.suffix.lower() in {'.jpg', '.jpeg', '.png'})
converted = []
for source in paths:
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image.load()
        if args.apply:
            valid = False
            if target.exists():
                try:
                    with Image.open(target) as check:
                        check.verify()
                    valid = True
                except Exception:
                    target.unlink()
            if not valid:
                temporary = target.with_name(target.stem + '.tmp.webp')
                image.save(temporary, 'WEBP', quality=82, method=4, exact=True)
                with Image.open(temporary) as check:
                    check.verify()
                temporary.replace(target)
        converted.append((source, target))
if not args.apply:
    print(f'Preview: {len(paths)} images, {sum(p.stat().st_size for p in paths):,} source bytes. Run with --apply to convert and update paths.')
    raise SystemExit(0)
missing = [str(target.relative_to(root)) for _, target in converted if not target.is_file() or target.stat().st_size == 0]
if missing:
    raise SystemExit(f'Conversion incomplete; original files were retained. Missing: {missing[:5]}')
old_bytes = sum(source.stat().st_size for source, _ in converted)
for entries in data.values():
    for entry in entries:
        src = entry.get('src', '')
        suffix = Path(src).suffix.lower()
        if suffix in {'.jpg', '.jpeg', '.png'} and '/assets/places/' in src:
            entry['src'] = str(Path(src).with_suffix('.webp')).replace('\\', '/')
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for source, _ in converted:
    source.unlink()
new_bytes = sum(target.stat().st_size for _, target in converted)
print(f'Converted {len(converted)} images: {old_bytes:,} -> {new_bytes:,} bytes ({(1-new_bytes/old_bytes)*100:.1f}% smaller).')
