import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toProxyUrl } from '@/lib/image-proxy'
import { toAudioProxyUrl } from '@/lib/audio-proxy'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { generateTTSAudio } from '@/lib/elevenlabs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { rows } = await pool.query(
    `SELECT * FROM objects
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [session.userId]
  )
  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      image_path: toProxyUrl(r.image_path),
      audio_url_es: r.audio_url_es ? toAudioProxyUrl(r.audio_url_es) : null,
      audio_url_en: r.audio_url_en ? toAudioProxyUrl(r.audio_url_en) : null,
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const nameEs = (formData.get('name_es') as string | null)?.trim() || null
  const nameEn = (formData.get('name_en') as string | null)?.trim() || null
  const lang = (formData.get('lang') as string) || 'es'
  const file = formData.get('image') as File | null
  const audioFile = formData.get('audio') as File | null

  const activeName = lang === 'es' ? nameEs : nameEn
  if (!activeName) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
  }

  // Si solo vino un nombre, usar el mismo para el otro campo
  const hasBothNames = !!nameEs && !!nameEn
  const finalNameEs = nameEs ?? activeName
  const finalNameEn = nameEn ?? activeName

  // Subir imagen
  const ext = file.name.split('.').pop() ?? 'jpg'
  const imgPath = `${session.userId}/${crypto.randomUUID()}.${ext}`
  const { error: imgError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(imgPath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    })
  if (imgError) return NextResponse.json({ error: imgError.message }, { status: 500 })

  let audioUrlEs: string | null = null
  let audioUrlEn: string | null = null

  // Grabación del usuario tiene prioridad para el idioma activo
  if (audioFile && audioFile.size > 0) {
    const audioPath = `${session.userId}/audio/${crypto.randomUUID()}.webm`
    const { error: audioError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(audioPath, Buffer.from(await audioFile.arrayBuffer()), {
        contentType: 'audio/webm',
        upsert: false,
      })
    if (!audioError) {
      if (lang === 'es') audioUrlEs = audioPath
      else audioUrlEn = audioPath
    }
  }

  // ElevenLabs: solo para idiomas sin grabación y donde tenemos nombre propio
  const ttsJobs: Promise<void>[] = []
  if (!audioUrlEs && (lang === 'es' || hasBothNames)) {
    ttsJobs.push(generateTTSAudio(finalNameEs, 'es').then((p) => { audioUrlEs = p }))
  }
  if (!audioUrlEn && (lang === 'en' || hasBothNames)) {
    ttsJobs.push(generateTTSAudio(finalNameEn, 'en').then((p) => { audioUrlEn = p }))
  }
  await Promise.all(ttsJobs)

  const { rows } = await pool.query(
    `INSERT INTO objects (user_id, name_es, name_en, image_path, audio_url_es, audio_url_en)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [session.userId, finalNameEs, finalNameEn, imgPath, audioUrlEs, audioUrlEn]
  )

  const obj = rows[0]
  return NextResponse.json(
    {
      ...obj,
      image_path: toProxyUrl(obj.image_path),
      audio_url_es: obj.audio_url_es ? toAudioProxyUrl(obj.audio_url_es) : null,
      audio_url_en: obj.audio_url_en ? toAudioProxyUrl(obj.audio_url_en) : null,
    },
    { status: 201 }
  )
}
