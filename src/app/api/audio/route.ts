import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase, STORAGE_BUCKET, STORAGE_BUCKET_TTS } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const k = req.nextUrl.searchParams.get('k')
  if (!k) return new NextResponse('Parámetro requerido', { status: 400 })

  let decoded: string
  try {
    decoded = Buffer.from(k, 'base64url').toString('utf-8')
  } catch {
    return new NextResponse('Parámetro inválido', { status: 400 })
  }

  let bucket: string
  let path: string

  if (decoded.startsWith('tts:')) {
    bucket = STORAGE_BUCKET_TTS
    path = decoded.slice(4)
  } else {
    bucket = STORAGE_BUCKET
    path = decoded
    if (!path.startsWith(`${session.userId}/`)) {
      return new NextResponse('No autorizado', { status: 403 })
    }
  }

  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error || !data) return new NextResponse('Audio no encontrado', { status: 404 })

  return new NextResponse(data, {
    headers: {
      'Content-Type': data.type || 'audio/mpeg',
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
