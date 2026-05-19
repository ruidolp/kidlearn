'use client'

import { useRouter } from 'next/navigation'
import { Language } from '@/i18n'

interface LangSwitcherProps {
  current: Language
}

export function LangSwitcher({ current }: LangSwitcherProps) {
  const router = useRouter()

  async function setLang(language: Language) {
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    })
    router.refresh()
  }

  return (
    <div className="flex flex-gap-sm">
      {(['es', 'en'] as Language[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLang(lang)}
          className={`btn btn--sm ${current === lang ? 'btn--primary' : 'btn--ghost'}`}
          aria-pressed={current === lang}
        >
          {lang === 'es' ? 'ES' : 'EN'}
        </button>
      ))}
    </div>
  )
}
