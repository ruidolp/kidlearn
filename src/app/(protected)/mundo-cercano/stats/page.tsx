import { getSession } from '@/lib/auth'
import { t } from '@/i18n'
import { Language } from '@/i18n'
import pool from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import styles from './stats.module.css'
import { toProxyUrl } from '@/lib/image-proxy'

interface Stat {
  object_id: number
  name_es: string
  name_en: string
  image_path: string
  impressions: number
  correct_total: number
  current_streak: number
  max_streak: number
  accuracy_pct: number
}

interface Session {
  id: number
  total_objects: number
  correct_count: number
  wrong_count: number
  language: string
  started_at: string
  finished_at: string | null
}

function isMastered(s: Stat): boolean {
  return s.impressions >= 3 && s.accuracy_pct >= 80 && s.current_streak >= 3
}

function formatDate(dateStr: string, lang: Language): string {
  return new Date(dateStr).toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function StatsPage() {
  const session = await getSession()
  const tr = t(session!.language as Language)
  const lang = session!.language as Language

  const [{ rows: stats }, { rows: sessions }] = await Promise.all([
    pool.query(
      `SELECT
         os.*,
         o.name_es, o.name_en, o.image_path, o.is_seed,
         CASE WHEN os.impressions > 0
           THEN ROUND((os.correct_total::numeric / os.impressions) * 100)
           ELSE 0
         END AS accuracy_pct
       FROM object_stats os
       JOIN objects o ON o.id = os.object_id
       WHERE os.user_id = $1
       ORDER BY accuracy_pct DESC, os.impressions DESC`,
      [session!.userId]
    ),
    pool.query(
      `SELECT id, total_objects, correct_count, wrong_count, language, started_at, finished_at
       FROM game_sessions
       WHERE user_id = $1 AND finished_at IS NOT NULL
       ORDER BY finished_at DESC
       LIMIT 20`,
      [session!.userId]
    ),
  ])

  const mastered = stats.filter(isMastered)
  const learning = stats.filter((s) => !isMastered(s))

  return (
    <div className="container mt-lg mb-xl">
      <div className="flex flex-between mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-title">📊 {tr.stats_title}</h1>
        <Link href="/mundo-cercano" className="btn btn--ghost">
          ← {tr.back}
        </Link>
      </div>

      {stats.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon">🎮</span>
          <p className="text-heading">{tr.stats_no_data}</p>
          <Link href="/mundo-cercano/play" className="btn btn--primary btn--lg mt-md">
            ▶️ {tr.play_btn}
          </Link>
        </div>
      )}

      {mastered.length > 0 && (
        <section className="mb-xl">
          <div className="flex flex-gap-sm mb-md" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>🏆</span>
            <h2 className="text-heading">{tr.stats_mastered}</h2>
            <span className="badge badge--success">{mastered.length}</span>
          </div>
          <div className={`card ${styles.table}`}>
            {mastered.map((s: Stat) => (
              <StatRow key={s.object_id} stat={s} lang={lang} tr={tr} mastered />
            ))}
          </div>
        </section>
      )}

      {learning.length > 0 && (
        <section className="mb-xl">
          <div className="flex flex-gap-sm mb-md" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>📚</span>
            <h2 className="text-heading">{tr.stats_learning}</h2>
            <span className="badge badge--accent">{learning.length}</span>
          </div>
          <div className={`card ${styles.table}`}>
            {learning.map((s: Stat) => (
              <StatRow key={s.object_id} stat={s} lang={lang} tr={tr} mastered={false} />
            ))}
          </div>
        </section>
      )}

      {/* Historial de sesiones */}
      <section>
        <div className="flex flex-gap-sm mb-md" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>🕐</span>
          <h2 className="text-heading">{tr.stats_sessions}</h2>
          <span className="badge">{sessions.length}</span>
        </div>
        {sessions.length === 0 ? (
          <div className={`card p-lg`}>
            <p className="text-body text-light text-center">{tr.stats_sessions_empty}</p>
          </div>
        ) : (
          <div className={`card ${styles.table}`}>
            {sessions.map((s: Session) => {
              const pct = s.total_objects > 0
                ? Math.round((s.correct_count / s.total_objects) * 100)
                : 0
              return (
                <div key={s.id} className={`stat-row ${styles.sessionRow}`}>
                  <div className={styles.sessionDate}>
                    <p className="text-small text-light">
                      {s.finished_at ? formatDate(s.finished_at, lang) : '—'}
                    </p>
                  </div>
                  <div className={styles.sessionMeta}>
                    <span className="text-small text-light" title={tr.stats_session_words}>
                      📝 {s.total_objects}
                    </span>
                    <span className="text-small text-primary" title={tr.stats_session_first_try}>
                      ✅ {s.correct_count}
                    </span>
                    <span
                      className="text-small"
                      style={{ color: s.wrong_count > 0 ? 'var(--color-error)' : 'var(--color-text-light)' }}
                      title={tr.stats_session_errors}
                    >
                      ❌ {s.wrong_count}
                    </span>
                    <span className={`text-small ${pct >= 80 ? 'text-primary' : ''}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StatRow({ stat, lang, tr, mastered }: { stat: Stat; lang: Language; tr: typeof import('@/i18n/es').default; mastered: boolean }) {
  const name = lang === 'es' ? stat.name_es : stat.name_en
  const wrongTotal = stat.impressions - stat.correct_total

  return (
    <div className="stat-row">
      <div className="flex flex-gap-md" style={{ alignItems: 'center', flex: 1 }}>
        <div className={styles.statImg}>
          <Image src={toProxyUrl(stat.image_path)} alt={name} fill style={{ objectFit: 'cover' }} sizes="48px" unoptimized />
        </div>
        <div>
          <p className="text-body">{name}</p>
          {mastered && (
            <span className="badge badge--success" style={{ fontSize: '0.78rem' }}>
              {tr.stats_mastered_badge}
            </span>
          )}
        </div>
      </div>
      <div className={styles.statMeta}>
        <span title={tr.stats_impressions} className="text-small text-light">
          👁 {stat.impressions}
        </span>
        <span title={tr.stats_correct} className="text-small text-primary">
          ✅ {stat.correct_total}
        </span>
        <span
          title={tr.stats_wrong}
          className="text-small"
          style={{ color: wrongTotal > 0 ? 'var(--color-error)' : 'var(--color-text-light)' }}
        >
          ❌ {wrongTotal}
        </span>
        <span title={tr.stats_accuracy} className={`text-small ${stat.accuracy_pct >= 80 ? 'text-primary' : ''}`}>
          🎯 {stat.accuracy_pct}%
        </span>
        <span title={tr.stats_streak} className="text-small text-light">
          🔥 {stat.current_streak}
        </span>
      </div>
    </div>
  )
}
