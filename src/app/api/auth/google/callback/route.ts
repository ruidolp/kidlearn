import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_cancelled`)
  }

  // Intercambiar código por tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${BASE_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_token`)
  }

  const { access_token } = await tokenRes.json()

  // Obtener datos del usuario de Google
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userRes.ok) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_userinfo`)
  }

  const googleUser = await userRes.json() as {
    sub: string
    email: string
    name: string
    picture: string
  }

  const { sub: googleId, email, name, picture } = googleUser

  // Buscar usuario por google_id o email
  let user = await pool
    .query('SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1', [googleId, email.toLowerCase()])
    .then((r) => r.rows[0])

  if (!user) {
    // Crear usuario nuevo
    const result = await pool.query(
      `INSERT INTO users (email, name, google_id, avatar_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [email.toLowerCase(), name, googleId, picture]
    )
    user = result.rows[0]
    await pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id])
    await pool.query(
      `INSERT INTO objects (user_id, name_es, name_en, image_path)
       SELECT $1, name_es, name_en, image_path FROM objects
       WHERE is_seed = TRUE AND user_id IS NULL`,
      [user.id]
    )
  } else if (!user.google_id) {
    // Vincular cuenta existente (registrada con email+pass) a Google
    await pool.query(
      'UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3',
      [googleId, picture, user.id]
    )
    user.google_id = googleId
    user.avatar_url = picture
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    language: user.language,
    theme: user.theme,
  })

  const res = NextResponse.redirect(`${BASE_URL}/dashboard`)
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
