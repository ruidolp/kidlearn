import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/verify', '/api/auth/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas de API y archivos estáticos no bloqueadas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/seed') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api/auth') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('mo_session')?.value

  if (!token || !verifyToken(token)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
