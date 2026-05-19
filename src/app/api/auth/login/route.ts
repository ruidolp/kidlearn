import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, name } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  let user = await pool
    .query('SELECT * FROM users WHERE email = $1', [normalizedEmail])
    .then((r) => r.rows[0])

  if (!user) {
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ needsName: true }, { status: 200 })
    }
    const result = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [normalizedEmail, name.trim()]
    )
    user = result.rows[0]
    await pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id])
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    language: user.language,
    theme: user.theme,
  })

  const res = NextResponse.json({ ok: true, name: user.name })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
