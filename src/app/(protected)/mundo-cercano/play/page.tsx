import { getSession } from '@/lib/auth'
import { t } from '@/i18n'
import { Language } from '@/i18n'
import { GameClient } from './GameClient'

export default async function PlayPage() {
  const session = await getSession()
  const tr = t(session!.language as Language)
  const lang = session!.language as Language

  return <GameClient lang={lang} tr={tr} />
}
