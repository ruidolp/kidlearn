import Link from 'next/link'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LangSwitcher } from '@/components/lang-switcher'
import { SessionPayload } from '@/lib/auth'
import { Language } from '@/i18n'

interface NavProps {
  session: SessionPayload
}

export function Nav({ session }: NavProps) {
  return (
    <nav className="nav">
      <div className="container nav__inner">
        <Link href="/dashboard" className="nav__logo">
          🌍 Mis Objetos
        </Link>
        <div className="nav__actions">
          <LangSwitcher current={session.language as Language} />
          <ThemeSwitcher current={session.theme} />
          <Link href="/settings" className="btn btn--icon" title="Configuración">⚙️</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="btn btn--ghost btn--sm">
              👋
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
