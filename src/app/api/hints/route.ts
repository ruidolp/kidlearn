import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { rows } = await pool.query('SELECT * FROM hint_words ORDER BY category_es, name_es')
  return NextResponse.json(rows)
}
