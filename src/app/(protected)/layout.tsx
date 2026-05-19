import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Nav } from '@/components/nav'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="page-wrapper">
      <Nav session={session} />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
