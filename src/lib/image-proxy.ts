export function toProxyUrl(imagePath: string): string {
  // Rutas locales de seed no necesitan proxy
  if (imagePath.startsWith('/')) return imagePath
  return `/api/images?k=${Buffer.from(imagePath).toString('base64url')}`
}
