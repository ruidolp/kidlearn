import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toProxyUrl } from '@/lib/image-proxy'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { rows } = await pool.query(
    `SELECT * FROM objects
     WHERE user_id = $1 OR is_seed = TRUE
     ORDER BY is_seed DESC, created_at ASC`,
    [session.userId]
  )
  return NextResponse.json(rows.map(r => ({ ...r, image_path: toProxyUrl(r.image_path) })))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const nameEs = formData.get('name_es') as string
  const nameEn = formData.get('name_en') as string
  const file = formData.get('image') as File | null

  if (!nameEs || !nameEn) {
    return NextResponse.json({ error: 'Nombres requeridos' }, { status: 400 })
  }

  let imagePath = '/seed/placeholder.jpg'

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'misobjetos' }, (error, result) => {
          if (error || !result) return reject(error)
          resolve(result)
        })
        .end(buffer)
    })
    imagePath = uploaded.secure_url
  }

  const { rows } = await pool.query(
    `INSERT INTO objects (user_id, name_es, name_en, image_path)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [session.userId, nameEs.trim(), nameEn.trim(), imagePath]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
