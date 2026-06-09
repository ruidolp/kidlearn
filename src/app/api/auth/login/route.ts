import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

function sessionResponse(user: Record<string, unknown>) {
  const token = signToken({
    userId: user.id as number,
    email: user.email as string,
    name: user.name as string,
    language: user.language as string,
    theme: user.theme as string,
  })
  const res = NextResponse.json({ ok: true, name: user.name })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 10, windowSec: 900 }, 'login')
  if (limited) return limited

  const body = await req.json()
  const { email, password, name } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  const user = await pool
    .query('SELECT * FROM users WHERE email = $1', [normalizedEmail])
    .then((r) => r.rows[0])

  // ── Registro de usuario nuevo ──────────────────────────────────────────────
  if (!user) {
    if (!password || !name) {
      return NextResponse.json({ needsRegistration: true })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }
    const hash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [normalizedEmail, name.trim(), hash]
    )
    const newUser = result.rows[0]
    await pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [newUser.id])
    await pool.query(
      `INSERT INTO objects (user_id, name_es, name_en, image_path)
       SELECT $1, name_es, name_en, image_path FROM objects
       WHERE is_seed = TRUE AND user_id IS NULL`,
      [newUser.id]
    )
    return sessionResponse(newUser)
  }

  // ── Usuario que solo tiene Google ──────────────────────────────────────────
  if (user.google_id && !user.password_hash) {
    return NextResponse.json({ googleOnly: true })
  }

  // ── Usuario con contraseña ─────────────────────────────────────────────────
  if (user.password_hash) {
    if (!password) {
      return NextResponse.json({ needsPassword: true })
    }
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }
    return sessionResponse(user)
  }

  // ── Usuario legado (sin contraseña ni Google) — compatibilidad ────────────
  return sessionResponse(user)
}
