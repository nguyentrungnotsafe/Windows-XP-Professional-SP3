export function resolvePublicAssetUrl(assetPath: string): string {
  const normalizedPath = assetPath.replace(/^\/+/, '');
  const env = (import.meta as { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL ?? '/';
  if (base === './' || base === '.') {
    return `./${normalizedPath}`;
  }
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${normalizedPath}`;
}
