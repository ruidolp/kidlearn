export function toProxyUrl(imagePath: string): string {
  if (!imagePath.startsWith('https://res.cloudinary.com/')) return imagePath
  return `/api/images?k=${Buffer.from(imagePath).toString('base64url')}`
}
