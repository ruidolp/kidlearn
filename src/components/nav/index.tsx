import Link from 'next/link'
import Image from 'next/image'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LangSwitcher } from '@/components/lang-switcher'
import { SessionPayload } from '@/lib/auth'
import { Language } from '@/i18n'
import { SideDrawer } from './side-drawer'

interface NavProps {
  session: SessionPayload
}

export function Nav({ session }: NavProps) {
  return (
    <nav className="nav">
      <div className="container nav__inner">
        <div className="nav__left">
          <SideDrawer userName={session.name} userEmail={session.email} />
          <Link href="/dashboard" className="nav__logo">
            <Image
              src="/images/logo.webp"
              alt="Mis Objetos"
              width={400}
              height={134}
              style={{ width: '200px', height: 'auto' }}
              priority
            />
          </Link>
        </div>
        <div className="nav__actions">
          <LangSwitcher current={session.language as Language} />
          <ThemeSwitcher current={session.theme} />
          <Link href="/settings" className="btn btn--icon hide-mobile" title="Configuración">⚙️</Link>
        </div>
      </div>
    </nav>
  )
}
