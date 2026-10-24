import fs from 'node:fs/promises';
import path from 'node:path';

const source = process.argv[2];
if (!source) throw new Error('Usage: node tools/import-place-gallery.mjs <gallery output directory>');

const index = JSON.parse((await fs.readFile(path.join(source, 'gallery-index.json'), 'utf8')).replace(/^\uFEFF/, ''));
const target = path.resolve('web/assets/places');
const entries = {};
let imported = 0;
for (const place of index.report) {
  entries[place.placeId] = [];
  for (const picture of place.pictures) {
    const filename = path.basename(picture.src);
    const directory = path.join(target, place.placeId);
    await fs.mkdir(directory, { recursive: true });
    await fs.copyFile(path.join(source, picture.src), path.join(directory, filename));
    entries[place.placeId].push({
      id: picture.id,
      src: `/assets/places/${place.placeId}/${filename}`,
      alt: picture.alt,
      title: picture.title,
      caption: picture.caption,
      credit: picture.attribution || '来源页面见链接',
      sourceUrl: picture.sourcePage,
      license: picture.rightsStatus,
      licenseUrl: picture.licenseLink || '',
      reviewed: picture.reviewed === true,
      captionVerified: picture.photoCaptionVerified === true,
    });
    imported++;
  }
}
await fs.writeFile('data/place-gallery.json', `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Imported ${imported} pictures across ${Object.values(entries).filter(items => items.length).length} places.`);
