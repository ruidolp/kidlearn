import { getSession } from '@/lib/auth'
import { GAMES } from '@/games/registry'
import { t } from '@/i18n'
import { Language } from '@/i18n'
import Link from 'next/link'
import styles from './dashboard.module.css'

export default async function DashboardPage() {
  const session = await getSession()
  const tr = t(session!.language as Language)

  return (
    <div className="container mt-xl mb-xl">
      <h1 className="text-display text-center mb-sm">{tr.dashboard_title}</h1>
      <p className="text-body text-light text-center mb-xl">{tr.dashboard_subtitle}</p>

      <div className={styles.grid}>
        {GAMES.map((game) => (
          game.available ? (
            <Link key={game.id} href={game.route} className={`card card--hover ${styles.gameCard}`}>
              <span className={styles.gameIcon}>{game.icon}</span>
              <h2 className="text-heading">{tr[game.nameKey]}</h2>
              <p className="text-body text-light">{tr[game.descKey]}</p>
              <span className={`btn btn--primary mt-md ${styles.playBtn}`}>
                {tr.play_btn} →
              </span>
            </Link>
          ) : (
            <div key={game.id} className={`card ${styles.gameCard} ${styles.gameCardSoon}`}>
              <span className={styles.gameIcon}>{game.icon}</span>
              <h2 className="text-heading">{tr[game.nameKey]}</h2>
              <p className="text-body text-light">{tr[game.descKey]}</p>
              <span className={`badge badge--muted mt-md`}>{tr.coming_soon}</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
