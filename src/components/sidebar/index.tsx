'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LangSwitcher } from '@/components/lang-switcher'
import { SessionPayload } from '@/lib/auth'
import { Language } from '@/i18n'

interface SidebarProps {
  session: SessionPayload
}

export function Sidebar({ session }: SidebarProps) {
  const [compact, setCompact] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-compact')
    if (stored !== null) setCompact(stored === 'true')
  }, [])

  const toggleCompact = () => {
    setCompact(prev => {
      const next = !prev
      localStorage.setItem('sidebar-compact', String(next))
      return next
    })
  }

  return (
    <>
      <button
        className="sidebar-mobile-btn btn btn--icon"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <span className="drawer-toggle__bar" />
        <span className="drawer-toggle__bar" />
        <span className="drawer-toggle__bar" />
      </button>

      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar${compact ? ' sidebar--compact' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}
        aria-label="Menú principal"
      >
        <div className="sidebar__header">
          <Link href="/dashboard" className="sidebar__logo-link" onClick={() => setMobileOpen(false)}>
            {compact ? (
              <span className="sidebar__logo-abbr">MO</span>
            ) : (
              <Image
                src="/images/logo.webp"
                alt="Mis Objetos"
                width={400}
                height={134}
                style={{ width: '160px', height: 'auto', display: 'block' }}
                priority
              />
            )}
          </Link>
          <button
            className="sidebar__toggle btn btn--icon"
            onClick={toggleCompact}
            title={compact ? 'Expandir menú' : 'Contraer menú'}
          >
            {compact ? '›' : '‹'}
          </button>
        </div>

        <div className="sidebar__user">
          <div className="sidebar__avatar" title={session.name}>
            {session.name.charAt(0).toUpperCase()}
          </div>
          {!compact && (
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{session.name}</p>
              <p className="sidebar__user-email">{session.email}</p>
            </div>
          )}
        </div>

        <nav className="sidebar__nav">
          <Link
            href="/dashboard"
            className="sidebar__link"
            title="Inicio"
            onClick={() => setMobileOpen(false)}
          >
            <span className="sidebar__link-icon">🏠</span>
            {!compact && <span className="sidebar__link-text">Inicio</span>}
          </Link>
          <Link
            href="/settings"
            className="sidebar__link"
            title="Configuración"
            onClick={() => setMobileOpen(false)}
          >
            <span className="sidebar__link-icon">⚙️</span>
            {!compact && <span className="sidebar__link-text">Configuración</span>}
          </Link>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__controls">
            <LangSwitcher current={session.language as Language} />
            <ThemeSwitcher current={session.theme} />
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="btn btn--ghost sidebar__logout"
              title="Cerrar sesión"
            >
              <span>👋</span>
              {!compact && <span>Cerrar sesión</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
