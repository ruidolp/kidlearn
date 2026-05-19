import es from './es'
import en from './en'
import { Translations } from './es'

export type Language = 'es' | 'en'

const translations: Record<Language, Translations> = { es, en }

export function t(lang: Language): Translations {
  return translations[lang] ?? translations.es
}

export { es, en }
export type { Translations }
