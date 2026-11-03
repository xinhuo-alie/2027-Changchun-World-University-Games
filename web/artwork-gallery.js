export const ARTWORK_GALLERY_KEY = 'cc2027:artwork-gallery:v1';
export const ARTWORK_GALLERY_LIMIT = 30;

const isSafeArtworkUrl = (value) => typeof value === 'string' && /^\/data\/results\/[a-f0-9-]+\.(png|jpe?g|webp)$/i.test(value);

function normalizeArtwork(item) {
  if (!item || typeof item !== 'object' || !isSafeArtworkUrl(item.url)) return null;
  const createdAt = typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)) ? item.createdAt : null;
  const name = typeof item.name === 'string' ? item.name.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 32) : '';
  return { url:item.url, name, createdAt };
}

export function readArtworkGallery(storage, legacyUrl = null) {
  let items = [];
  try {
    const parsed = JSON.parse(storage.getItem(ARTWORK_GALLERY_KEY) || '[]');
    if (Array.isArray(parsed)) items = parsed.map(normalizeArtwork).filter(Boolean);
  } catch { /* A malformed gallery should not block the role workshop. */ }
  if (isSafeArtworkUrl(legacyUrl) && !items.some((item) => item.url === legacyUrl)) {
    items.unshift({ url:legacyUrl, name:'历史角色', createdAt:null });
    try { storage.setItem(ARTWORK_GALLERY_KEY, JSON.stringify(items.slice(0, ARTWORK_GALLERY_LIMIT))); } catch { /* Keep the legacy artwork usable even if storage is full. */ }
  }
  const unique = [...new Map(items.map((item) => [item.url, item])).values()];
  return unique.slice(0, ARTWORK_GALLERY_LIMIT);
}

export function rememberArtwork(storage, url, { name = '我的角色', createdAt = new Date().toISOString() } = {}) {
  if (!isSafeArtworkUrl(url)) return readArtworkGallery(storage);
  const existing = readArtworkGallery(storage);
  const prior = existing.find((item) => item.url === url);
  const item = normalizeArtwork({ url, name:prior?.name || name, createdAt:prior?.createdAt || createdAt });
  const next = [item, ...existing.filter((entry) => entry.url !== url)].slice(0, ARTWORK_GALLERY_LIMIT);
  try { storage.setItem(ARTWORK_GALLERY_KEY, JSON.stringify(next)); } catch { /* The active visit remains usable without gallery persistence. */ }
  return next;
}
