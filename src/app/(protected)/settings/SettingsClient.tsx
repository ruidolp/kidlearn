'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Language, Translations } from '@/i18n'
import styles from './settings.module.css'

const THEMES = [
  { id: 'blue',  emoji: '🔵', labelKey: 'theme_blue'  as const },
  { id: 'pink',  emoji: '🩷', labelKey: 'theme_pink'  as const },
  { id: 'green', emoji: '🟢', labelKey: 'theme_green' as const },
]

const LANGS = [
  { id: 'es', labelKey: 'lang_es' as const },
  { id: 'en', labelKey: 'lang_en' as const },
]

interface Props {
  lang: Language
  tr: Translations
  theme: string
  sessionSize: number
}

export function SettingsClient({ lang, tr, theme, sessionSize }: Props) {
  const router = useRouter()
  const [size, setSize] = useState(sessionSize)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function changeTheme(newTheme: string) {
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
    })
    router.refresh()
  }

  async function changeLang(newLang: Language) {
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: newLang }),
    })
    router.refresh()
  }

  async function saveSize() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_size: size }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.sections}>
      {/* Idioma */}
      <div className={`card p-card ${styles.section}`}>
        <h2 className="text-heading mb-md">🌐 {tr.settings_language}</h2>
        <div className="flex flex-gap-md">
          {LANGS.map((l) => (
            <button
              key={l.id}
              className={`btn btn--lg ${lang === l.id ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => changeLang(l.id as Language)}
            >
              {tr[l.labelKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Tema */}
      <div className={`card p-card ${styles.section}`}>
        <h2 className="text-heading mb-md">🎨 {tr.settings_theme}</h2>
        <div className="flex flex-gap-md flex-wrap">
          {THEMES.map((th) => (
            <button
              key={th.id}
              className={`btn btn--lg ${theme === th.id ? 'btn--primary' : 'btn--ghost'} ${styles.themeBtn}`}
              onClick={() => changeTheme(th.id)}
            >
              {th.emoji} {tr[th.labelKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Objetos por sesión */}
      <div className={`card p-card ${styles.section}`}>
        <h2 className="text-heading mb-sm">🎯 {tr.settings_session}</h2>
        <p className="text-body text-light mb-md">{tr.settings_session_help}</p>
        <div className="flex flex-gap-md" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="range"
            min={2}
            max={20}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className={styles.range}
          />
          <span className={`text-display text-primary ${styles.rangeValue}`}>{size}</span>
        </div>
        <button
          className="btn btn--primary mt-lg"
          onClick={saveSize}
          disabled={saving}
        >
          {saved ? '✓ Guardado' : saving ? tr.loading : tr.save}
        </button>
      </div>
    </div>
  )
}
