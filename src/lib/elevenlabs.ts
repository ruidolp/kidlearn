import { supabase, STORAGE_BUCKET_TTS } from './supabase'

const API_KEY = process.env.ELEVENLABS_API_KEY
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID

function normalizeName(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function generateTTSAudio(word: string, lang: string): Promise<string | null> {
  if (!API_KEY || !VOICE_ID) return null

  const normalized = normalizeName(word)
  if (!normalized) return null

  const storagePath = `${lang}/${normalized}.mp3`

  // Verificar si ya existe en el bucket TTS
  const { data: files } = await supabase.storage
    .from(STORAGE_BUCKET_TTS)
    .list(lang, { search: `${normalized}.mp3` })

  if (files && files.some((f) => f.name === `${normalized}.mp3`)) {
    return `tts:${storagePath}`
  }

  // Generar con ElevenLabs
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: word,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) return null

  const buffer = Buffer.from(await res.arrayBuffer())
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET_TTS)
    .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: false })

  if (error) return null
  return `tts:${storagePath}`
}
