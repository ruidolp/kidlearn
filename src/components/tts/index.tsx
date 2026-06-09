'use client'

import { useCallback } from 'react'
import { Language } from '@/i18n'

const LANG_MAP: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US',
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function useTTS(language: Language) {
  const speak = useCallback(
    async (text: string, audioUrl?: string | null, times = 1) => {
      for (let i = 0; i < times; i++) {
        if (i > 0) await delay(2000)

        // Prioridad 1: URL de audio (grabación del usuario o ElevenLabs)
        if (audioUrl) {
          try {
            await new Promise<void>((resolve, reject) => {
              const audio = new Audio(audioUrl)
              audio.onended = () => resolve()
              audio.onerror = () => reject()
              audio.play().catch(reject)
            })
            continue
          } catch {
            // fallback a Web Speech si falla la reproducción
          }
        }

        // Prioridad 2: Web Speech API
        if (typeof window === 'undefined' || !window.speechSynthesis) return
        window.speechSynthesis.cancel()
        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = LANG_MAP[language]
          utterance.rate = 0.85
          utterance.pitch = 1.1
          utterance.onend = () => resolve()
          utterance.onerror = () => resolve()
          window.speechSynthesis.speak(utterance)
        })
      }
    },
    [language]
  )

  return { speak }
}

interface TTSButtonProps {
  text: string
  audioUrl?: string | null
  language: Language
  label?: string
  className?: string
}

export function TTSButton({ text, audioUrl, language, label, className }: TTSButtonProps) {
  const { speak } = useTTS(language)

  return (
    <button
      type="button"
      className={`btn btn--icon ${className ?? ''}`}
      onClick={() => speak(text, audioUrl)}
      title={label ?? 'Escuchar'}
      aria-label={label ?? 'Escuchar'}
    >
      🔊
    </button>
  )
}
