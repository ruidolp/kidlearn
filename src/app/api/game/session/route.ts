import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toProxyUrl } from '@/lib/image-proxy'
import { toAudioProxyUrl } from '@/lib/audio-proxy'

// Crea una nueva sesión y retorna los objetos a jugar
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const gameId: string = body.game_id ?? 'mundo-cercano'

  const { rows: settings } = await pool.query(
    'SELECT session_size FROM user_settings WHERE user_id = $1',
    [session.userId]
  )
  const sessionSize: number = settings[0]?.session_size ?? 5

  const { rows: objects } = await pool.query(
    `SELECT * FROM objects WHERE user_id = $1 ORDER BY RANDOM()`,
    [session.userId]
  )

  if (objects.length < 2) {
    return NextResponse.json({ error: 'not_enough_objects' }, { status: 422 })
  }

  // Tomar hasta sessionSize objetos aleatorios
  const selected = objects.slice(0, sessionSize)

  const { rows: newSession } = await pool.query(
    `INSERT INTO game_sessions (user_id, game_id, total_objects, language)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [session.userId, gameId, selected.length, session.language]
  )

  return NextResponse.json({
    sessionId: newSession[0].id,
    objects: selected.map((obj) => ({
      ...obj,
      image_path: toProxyUrl(obj.image_path),
      audio_url_es: obj.audio_url_es ? toAudioProxyUrl(obj.audio_url_es) : null,
      audio_url_en: obj.audio_url_en ? toAudioProxyUrl(obj.audio_url_en) : null,
    })),
    language: session.language,
  })
}
