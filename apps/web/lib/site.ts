const DEFAULT_SITE_URL = 'http://localhost:3000';

export const siteName = 'Dakshinkali Electronics';

export const siteDescription =
  'Shop televisions, refrigerators, water geysers, air conditioners, audio gear, and computers from Dakshinkali Electronics.';

function normalizeSiteUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
}

export function getSiteUrl() {
  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : DEFAULT_SITE_URL),
  );
}
