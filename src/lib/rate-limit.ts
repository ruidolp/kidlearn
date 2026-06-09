import { NextRequest, NextResponse } from 'next/server'

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Limpia entradas expiradas periódicamente para no acumular memoria
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, win] of store) {
      if (win.resetAt < now) store.delete(key)
    }
  }, 60_000)
}

interface Options {
  /** Máximo de requests permitidos en el intervalo */
  limit: number
  /** Duración de la ventana en segundos */
  windowSec: number
}

/**
 * Verifica el rate limit para una clave (ej: IP o userId).
 * Retorna null si está dentro del límite, o un NextResponse 429 si lo superó.
 */
export function checkRateLimit(
  req: NextRequest,
  { limit, windowSec }: Options,
  keyPrefix = ''
): NextResponse | null {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const key = `${keyPrefix}:${ip}`
  const now = Date.now()
  const windowMs = windowSec * 1000

  const win = store.get(key)

  if (!win || win.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  win.count++

  if (win.count > limit) {
    const retryAfter = Math.ceil((win.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta más tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(win.resetAt / 1000)),
        },
      }
    )
  }

  return null
}
