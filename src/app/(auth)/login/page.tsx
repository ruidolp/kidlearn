'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

type Step = 'email' | 'register' | 'password' | 'google_only'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)

    if (data.needsRegistration) { setStep('register'); return }
    if (data.needsPassword)     { setStep('password');  return }
    if (data.googleOnly)        { setStep('google_only'); return }
    if (data.ok) { router.push('/dashboard'); router.refresh(); return }
    setError(data.error ?? 'Error al continuar')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Error al registrarse'); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Contraseña incorrecta'); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🌍</div>

        {step === 'email' && (
          <>
            <h1 className="text-title text-center mb-md">Bienvenido</h1>
            <p className="text-body text-light text-center mb-lg">
              Ingresa tu email para continuar
            </p>
            <form onSubmit={handleEmail} className={styles.form}>
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
              {error && <p className="error-msg text-center">{error}</p>}
              <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
                {loading ? 'Cargando...' : 'Continuar →'}
              </button>
              <div className={styles.divider}><span>o</span></div>
              <a href="/api/auth/google" className={`btn btn--ghost btn--lg ${styles.googleBtn}`}>
                <GoogleIcon />
                Continuar con Google
              </a>
            </form>
          </>
        )}

        {step === 'register' && (
          <>
            <h1 className="text-title text-center mb-md">Crear cuenta</h1>
            <p className="text-body text-light text-center mb-lg">
              Primera vez con <strong>{email}</strong>
            </p>
            <form onSubmit={handleRegister} className={styles.form}>
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
              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && <p className="error-msg text-center">{error}</p>}
              <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setStep('email'); setError('') }}>
                ← Cambiar email
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <h1 className="text-title text-center mb-md">Bienvenido de vuelta</h1>
            <p className="text-body text-light text-center mb-lg">
              Ingresa tu contraseña para <strong>{email}</strong>
            </p>
            <form onSubmit={handlePassword} className={styles.form}>
              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="error-msg text-center">{error}</p>}
              <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar →'}
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setStep('email'); setError('') }}>
                ← Cambiar email
              </button>
            </form>
          </>
        )}

        {step === 'google_only' && (
          <>
            <h1 className="text-title text-center mb-md">Usa Google</h1>
            <p className="text-body text-light text-center mb-lg">
              Tu cuenta <strong>{email}</strong> está vinculada a Google.
            </p>
            <div className={styles.form}>
              <a href="/api/auth/google" className={`btn btn--primary btn--lg ${styles.googleBtn}`}>
                <GoogleIcon />
                Continuar con Google
              </a>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setStep('email'); setError('') }}>
                ← Usar otro email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
