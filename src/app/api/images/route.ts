import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const ALLOWED_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const k = req.nextUrl.searchParams.get('k')
  if (!k) return new NextResponse('Parámetro requerido', { status: 400 })

  let url: string
  try {
    url = Buffer.from(k, 'base64url').toString('utf-8')
  } catch {
    return new NextResponse('Parámetro inválido', { status: 400 })
  }

  if (!url.startsWith(ALLOWED_PREFIX)) {
    return new NextResponse('URL no permitida', { status: 403 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) return new NextResponse('Error al obtener imagen', { status: 502 })

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
