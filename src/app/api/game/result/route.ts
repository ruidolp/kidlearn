import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { sessionId, objectId, correct } = await req.json()

  // Registrar resultado individual
  await pool.query(
    `INSERT INTO game_results (session_id, object_id, correct) VALUES ($1, $2, $3)`,
    [sessionId, objectId, correct]
  )

  // Upsert stats del objeto
  const existing = await pool.query(
    `SELECT * FROM object_stats WHERE user_id = $1 AND object_id = $2`,
    [session.userId, objectId]
  )

  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO object_stats
         (user_id, object_id, impressions, correct_total, current_streak, max_streak, last_played_at)
       VALUES ($1, $2, 1, $3, $4, $4, NOW())`,
      [session.userId, objectId, correct ? 1 : 0, correct ? 1 : 0]
    )
  } else {
    const s = existing.rows[0]
    const newStreak = correct ? s.current_streak + 1 : 0
    const newMaxStreak = Math.max(s.max_streak, newStreak)
    await pool.query(
      `UPDATE object_stats SET
         impressions    = impressions + 1,
         correct_total  = correct_total + $1,
         current_streak = $2,
         max_streak     = $3,
         last_played_at = NOW()
       WHERE user_id = $4 AND object_id = $5`,
      [correct ? 1 : 0, newStreak, newMaxStreak, session.userId, objectId]
    )
  }

  return NextResponse.json({ ok: true })
}

// Finalizar sesión
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { sessionId, correctCount, wrongCount = 0 } = await req.json()
  await pool.query(
    `UPDATE game_sessions SET correct_count = $1, wrong_count = $2, finished_at = NOW() WHERE id = $3 AND user_id = $4`,
    [correctCount, wrongCount, sessionId, session.userId]
  )
  return NextResponse.json({ ok: true })
}
