import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const PUBLIC_PATHS = ['/', '/login', '/verify', '/api/auth/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas de API y archivos estáticos no bloqueadas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/seed') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/images/') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next()
  }

  // Rate limit general para API autenticada
  if (pathname.startsWith('/api/')) {
    const limited = checkRateLimit(request, { limit: 200, windowSec: 60 }, 'api')
    if (limited) return limited
  }

  const token = request.cookies.get('mo_session')?.value

  if (!token || !verifyToken(token)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
