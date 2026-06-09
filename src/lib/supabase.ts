import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'misobjetos'
export const STORAGE_BUCKET_TTS = process.env.SUPABASE_STORAGE_BUCKET_TTS ?? 'misobjetos-tts'
