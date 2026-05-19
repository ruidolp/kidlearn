'use client'

import { useCallback } from 'react'
import { Language } from '@/i18n'

const LANG_MAP: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US',
}

export function useTTS(language: Language) {
  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = LANG_MAP[language]
      utterance.rate = 0.85
      utterance.pitch = 1.1
      window.speechSynthesis.speak(utterance)
    },
    [language]
  )

  return { speak }
}

interface TTSButtonProps {
  text: string
  language: Language
  label?: string
  className?: string
}

export function TTSButton({ text, language, label, className }: TTSButtonProps) {
  const { speak } = useTTS(language)

  return (
    <button
      type="button"
      className={`btn btn--icon ${className ?? ''}`}
      onClick={() => speak(text)}
      title={label ?? 'Escuchar'}
      aria-label={label ?? 'Escuchar'}
    >
      🔊
    </button>
  )
}
