import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toProxyUrl } from '@/lib/image-proxy'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { rows } = await pool.query(
    `SELECT
       os.*,
       o.name_es,
       o.name_en,
       o.image_path,
       o.is_seed,
       CASE
         WHEN os.impressions > 0
           THEN ROUND((os.correct_total::numeric / os.impressions) * 100)
         ELSE 0
       END AS accuracy_pct
     FROM object_stats os
     JOIN objects o ON o.id = os.object_id
     WHERE os.user_id = $1
     ORDER BY accuracy_pct DESC, os.impressions DESC`,
    [session.userId]
  )

  return NextResponse.json(rows.map(r => ({ ...r, image_path: toProxyUrl(r.image_path) })))
}
