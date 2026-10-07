// Minimal asset loader: images + XML level files.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function loadXML(src) {
  return fetch(src)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${src}: ${r.status}`);
      return r.text();
    })
    .then((text) => new DOMParser().parseFromString(text, 'application/xml'));
}

export async function loadAll(manifest) {
  const entries = Object.entries(manifest);
  const results = await Promise.all(
    entries.map(([, src]) => loadImage(src))
  );
  const out = {};
  entries.forEach(([key], i) => { out[key] = results[i]; });
  return out;
}
