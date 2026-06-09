'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface SideDrawerProps {
  userName: string
  userEmail: string
}

export function SideDrawer({ userName, userEmail }: SideDrawerProps) {
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // Bloquea scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        className="btn btn--icon drawer-toggle"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
      >
        <span className="drawer-toggle__bar" />
        <span className="drawer-toggle__bar" />
        <span className="drawer-toggle__bar" />
      </button>

      {open && <div className="drawer-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />}

      <div
        ref={drawerRef}
        className={`drawer${open ? ' drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="drawer__header">
          <Image src="/images/logo.webp" alt="Mis Objetos" width={400} height={134} style={{ width: '160px', height: 'auto' }} />
          <button className="btn btn--icon" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <div className="drawer__user">
          <div className="drawer__avatar">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <p className="drawer__user-name">{userName}</p>
            <p className="drawer__user-email">{userEmail}</p>
          </div>
        </div>

        <nav className="drawer__nav">
          <Link href="/dashboard" className="drawer__link" onClick={() => setOpen(false)}>
            <span className="drawer__link-icon">🏠</span>
            Inicio
          </Link>
          <Link href="/settings" className="drawer__link" onClick={() => setOpen(false)}>
            <span className="drawer__link-icon">⚙️</span>
            Configuración
          </Link>
        </nav>

        <div className="drawer__footer">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="btn btn--ghost drawer__logout">
              <span>👋</span>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
