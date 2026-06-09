import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const k = req.nextUrl.searchParams.get('k')
  if (!k) return new NextResponse('Parámetro requerido', { status: 400 })

  let path: string
  try {
    path = Buffer.from(k, 'base64url').toString('utf-8')
  } catch {
    return new NextResponse('Parámetro inválido', { status: 400 })
  }

  // Rutas locales de seed se sirven directamente
  if (path.startsWith('/')) {
    return NextResponse.redirect(new URL(path, req.url))
  }

  // URLs absolutas legacy (ej. Cloudinary) — redirigir directamente
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return NextResponse.redirect(path)
  }

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path)
  if (error || !data) return new NextResponse('Imagen no encontrada', { status: 404 })

  return new NextResponse(data, {
    headers: {
      'Content-Type': data.type || 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
