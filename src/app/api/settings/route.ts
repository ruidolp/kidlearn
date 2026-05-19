import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { rows } = await pool.query(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [session.userId]
  )
  return NextResponse.json(rows[0] ?? { session_size: 5 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { session_size } = await req.json()
  const size = Math.max(2, Math.min(20, parseInt(session_size)))

  await pool.query(
    `INSERT INTO user_settings (user_id, session_size)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET session_size = $2, updated_at = NOW()`,
    [session.userId, size]
  )
  return NextResponse.json({ ok: true })
}
