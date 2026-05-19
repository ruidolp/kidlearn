'use client'

import { useRouter } from 'next/navigation'

const THEMES = [
  { id: 'blue',  label: '🔵', color: '#4A90D9' },
  { id: 'pink',  label: '🩷', color: '#E8649A' },
  { id: 'green', label: '🟢', color: '#3DAA6E' },
] as const

interface ThemeSwitcherProps {
  current: string
}

export function ThemeSwitcher({ current }: ThemeSwitcherProps) {
  const router = useRouter()

  async function setTheme(theme: string) {
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
    // Recarga para aplicar el tema desde el servidor
    router.refresh()
  }

  return (
    <div className="flex flex-gap-sm" aria-label="Cambiar tema">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => setTheme(theme.id)}
          className="btn btn--icon"
          style={{
            border: current === theme.id ? `3px solid ${theme.color}` : undefined,
            transform: current === theme.id ? 'scale(1.15)' : undefined,
          }}
          title={theme.id}
          aria-pressed={current === theme.id}
        >
          {theme.label}
        </button>
      ))}
    </div>
  )
}
