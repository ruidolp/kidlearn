import { getSession } from '@/lib/auth'
import { t } from '@/i18n'
import { Language } from '@/i18n'
import pool from '@/lib/db'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const session = await getSession()
  const tr = t(session!.language as Language)
  const lang = session!.language as Language

  const { rows } = await pool.query(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [session!.userId]
  )
  const settings = rows[0] ?? { session_size: 5 }

  return (
    <div className="container mt-lg mb-xl">
      <h1 className="text-title mb-xl">⚙️ {tr.settings_title}</h1>
      <SettingsClient
        lang={lang}
        tr={tr}
        theme={session!.theme}
        sessionSize={settings.session_size}
      />
    </div>
  )
}
