import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession, signToken, COOKIE_NAME } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(session)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (body.theme && ['blue', 'pink', 'green'].includes(body.theme)) {
    fields.push(`theme = $${idx++}`)
    values.push(body.theme)
  }
  if (body.language && ['es', 'en'].includes(body.language)) {
    fields.push(`language = $${idx++}`)
    values.push(body.language)
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  values.push(session.userId)
  const updated = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  const user = updated.rows[0]

  const newToken = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    language: user.language,
    theme: user.theme,
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
