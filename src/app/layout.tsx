import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Mis Objetos',
  description: 'Aprende jugando con tu hijo',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const theme = session?.theme ?? 'blue'

  return (
    <html lang={session?.language ?? 'es'} className={`theme-${theme}`}>
      <body>{children}</body>
    </html>
  )
}
