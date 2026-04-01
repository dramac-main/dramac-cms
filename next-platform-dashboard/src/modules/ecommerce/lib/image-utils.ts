/**
 * Normalize a single product image entry to a URL string.
 * Handles both `"https://..."` strings and `{ url: "https://...", alt?: "..." }` objects.
 */
export function getImageUrl(img: string | { url: string; alt?: string } | unknown): string | undefined {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object' && 'url' in img && typeof (img as { url: unknown }).url === 'string') {
    return (img as { url: string }).url;
  }
  return undefined;
}

/**
 * Normalize a product images array to string URLs.
 * The database stores images as EITHER `string[]` or `{ url, alt }[]`.
 */
export function normalizeProductImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.map(getImageUrl).filter((url): url is string => !!url);
}
