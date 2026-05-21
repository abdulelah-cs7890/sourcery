// Builds a Google Lens reverse-image-search URL pointing at the given public
// image. Clicking the link opens Lens in a new tab; no API call from us.
export function buildLensUrl(imageUrl: string): string {
  return `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;
}
