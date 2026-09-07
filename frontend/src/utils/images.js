/**
 * Product images are stored at one size but consumed at several — a grid
 * thumbnail is ~250px wide while the detail gallery is ~700px. Serving the
 * large file everywhere meant a catalogue page pulled roughly 12x more pixels
 * than it painted.
 *
 * Unsplash resizes on its CDN via query params, so the right size can be asked
 * for at the call site. Anything hosted elsewhere is returned untouched.
 */
const RESIZABLE_HOSTS = ['images.unsplash.com'];

export function productImage(url, width, { ratio = 1.25, quality = 75 } = {}) {
  if (!url) return url;

  let parsed;
  try {
    parsed = new URL(url, window.location.origin);
  } catch {
    return url;
  }

  if (!RESIZABLE_HOSTS.includes(parsed.hostname)) return url;

  parsed.searchParams.set('w', String(width));
  parsed.searchParams.set('h', String(Math.round(width * ratio)));
  parsed.searchParams.set('fit', 'crop');
  parsed.searchParams.set('q', String(quality));
  return parsed.toString();
}

/** srcset for a 1x/2x pair, so retina screens stay sharp without the desktop
 *  paying for it. */
export function productSrcSet(url, width, opts) {
  const one = productImage(url, width, opts);
  const two = productImage(url, width * 2, opts);
  if (one === two) return undefined;
  return `${one} 1x, ${two} 2x`;
}
