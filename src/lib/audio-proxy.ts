export function toAudioProxyUrl(storagePath: string): string {
  const key = Buffer.from(storagePath).toString('base64url')
  return `/api/audio?k=${key}`
}
