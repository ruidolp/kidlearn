import { getSession } from '@/lib/auth'
import { t } from '@/i18n'
import { Language } from '@/i18n'
import { CollectionClient } from './CollectionClient'
import pool from '@/lib/db'
import Link from 'next/link'

export default async function MundoCercanoPage() {
  const session = await getSession()
  const tr = t(session!.language as Language)
  const lang = session!.language as Language

  const { rows: objects } = await pool.query(
    `SELECT * FROM objects WHERE user_id = $1 OR is_seed = TRUE ORDER BY is_seed DESC, created_at ASC`,
    [session!.userId]
  )

  const { rows: hints } = await pool.query(
    'SELECT * FROM hint_words ORDER BY category_es, name_es'
  )

  return (
    <div className="container mt-lg mb-xl">
      <div className="flex flex-between mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title">🌍 {tr.game_mc_name}</h1>
          <p className="text-body text-light">{tr.collection_title}</p>
        </div>
        <div className="flex flex-gap-md">
          <Link href="/mundo-cercano/stats" className="btn btn--ghost">
            📊 {tr.stats_btn}
          </Link>
          <Link href="/mundo-cercano/play" className="btn btn--accent btn--lg">
            ▶️ {tr.play_btn}
          </Link>
        </div>
      </div>

      <CollectionClient
        initialObjects={objects}
        hints={hints}
        lang={lang}
        tr={tr}
      />
    </div>
  )
}
