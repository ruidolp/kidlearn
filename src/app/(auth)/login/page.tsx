'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [needsName, setNeedsName] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: needsName ? name : undefined }),
    })
    const data = await res.json()
    setLoading(false)

    if (data.needsName) {
      setNeedsName(true)
      return
    }
    if (!res.ok) {
      setError(data.error ?? 'Error al ingresar')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🌍</div>
        <h1 className="text-title text-center mb-md">
          {needsName ? '¡Hola! ¿Cómo te llamas?' : 'Bienvenido'}
        </h1>
        <p className="text-body text-light text-center mb-lg">
          {needsName
            ? 'Es tu primera vez. Ingresa tu nombre para continuar.'
            : 'Ingresa tu email para continuar'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!needsName && (
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          {needsName && (
            <div className="field">
              <label htmlFor="name">Tu nombre</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="¿Cómo te llamas?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          {error && <p className="error-msg text-center">{error}</p>}

          <button
            type="submit"
            className="btn btn--primary btn--lg"
            disabled={loading}
          >
            {loading ? 'Cargando...' : needsName ? 'Empezar →' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
