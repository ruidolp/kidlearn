'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Language, Translations } from '@/i18n'
import { useTTS } from '@/components/tts'
import { SuccessAnimation } from '@/components/success-animation'
import styles from './game.module.css'

interface Obj {
  id: number
  name_es: string
  name_en: string
  image_path: string
  audio_url_es: string | null
  audio_url_en: string | null
}

interface GameState {
  sessionId: number
  objects: Obj[]
  language: Language
}

type Phase = 'loading' | 'error' | 'landscape' | 'playing' | 'success' | 'wrong' | 'summary'

interface Props {
  lang: Language
  tr: Translations
}

export function GameClient({ lang, tr }: Props) {
  const router = useRouter()
  const { speak } = useTTS(lang)

  const [phase, setPhase] = useState<Phase>('loading')
  const [game, setGame] = useState<GameState | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [showLandscape, setShowLandscape] = useState(false)
  const sessionStarted = useRef(false)
  // IDs de objetos en los que el usuario falló al menos una vez en esta sesión
  const failedObjectIds = useRef<Set<number>>(new Set())

  // Detectar mobile en portrait
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const isPortrait = window.innerHeight > window.innerWidth
    if (isMobile && isPortrait) setShowLandscape(true)
  }, [])

  const startGame = useCallback(async () => {
    sessionStarted.current = true
    setPhase('loading')
    setCurrentIndex(0)
    setWrongCount(0)
    failedObjectIds.current = new Set()

    const res = await fetch('/api/game/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: 'mundo-cercano' }),
    })
    const data = await res.json()

    if (!res.ok) {
      setPhase('error')
      return
    }
    setGame(data)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (sessionStarted.current) return
    sessionStarted.current = true
    startGame()
  }, [startGame])

  // Leer la palabra cuando cambia el objeto actual
  useEffect(() => {
    if (phase !== 'playing' || !game) return
    const obj = game.objects[currentIndex]
    const word = lang === 'es' ? obj.name_es : obj.name_en
    const audioUrl = lang === 'es' ? obj.audio_url_es : obj.audio_url_en
    const timer = setTimeout(() => speak(word, audioUrl, 3), 400)
    return () => clearTimeout(timer)
  }, [phase, currentIndex, game, lang, speak])

  // Generar par (correcto + distractor) para el objeto actual
  function getPair(): [Obj, Obj, number] | null {
    if (!game) return null
    const correct = game.objects[currentIndex]
    // Distractor: otro objeto aleatorio de la lista
    const others = game.objects.filter((_, i) => i !== currentIndex)
    const distractor = others[Math.floor(Math.random() * others.length)]
    // Posición aleatoria del correcto (0 = izquierda, 1 = derecha)
    const pos = Math.random() < 0.5 ? 0 : 1
    const pair: [Obj, Obj] = pos === 0 ? [correct, distractor] : [distractor, correct]
    return [pair[0], pair[1], pos]
  }

  const [pair, setPair] = useState<[Obj, Obj, number] | null>(null)

  useEffect(() => {
    if (phase === 'playing' && game) setPair(getPair())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, game])

  async function handleChoice(chosenIndex: number) {
    if (!game || !pair) return
    const [, , correctPos] = pair
    const isCorrect = chosenIndex === correctPos
    const obj = game.objects[currentIndex]

    // Registrar resultado
    await fetch('/api/game/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: game.sessionId, objectId: obj.id, correct: isCorrect }),
    })

    if (isCorrect) {
      setPhase('success')
    } else {
      failedObjectIds.current.add(obj.id)
      setWrongCount((c) => c + 1)
      setPhase('wrong')
      setTimeout(() => setPhase('playing'), 1200)
    }
  }

  async function handleSuccessComplete() {
    if (!game) return
    const nextIndex = currentIndex + 1
    if (nextIndex >= game.objects.length) {
      const firstTryCorrect = game.objects.length - failedObjectIds.current.size
      await fetch('/api/game/result', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: game.sessionId,
          correctCount: firstTryCorrect,
          wrongCount: wrongCount,
        }),
      })
      setPhase('summary')
    } else {
      setCurrentIndex(nextIndex)
      setPhase('playing')
    }
  }

  if (showLandscape && phase !== 'summary') {
    return (
      <div className={styles.landscapeTip}>
        <p className="text-heading text-center mb-lg">{tr.landscape_tip}</p>
        <p className={styles.rotateIcon}>📱</p>
        <button className="btn btn--primary btn--lg mt-lg" onClick={() => setShowLandscape(false)}>
          {tr.landscape_btn}
        </button>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <p className="text-heading text-light">{tr.loading}</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex-center flex-col" style={{ minHeight: '60vh', gap: '1.5rem' }}>
        <p className="text-heading text-center">{tr.not_enough_objects}</p>
        <button className="btn btn--primary" onClick={() => router.push('/mundo-cercano')}>
          {tr.go_collection}
        </button>
      </div>
    )
  }

  if (phase === 'summary') {
    const total = game?.objects.length ?? 0
    const firstTryCorrect = total - failedObjectIds.current.size
    const pct = total > 0 ? Math.round((firstTryCorrect / total) * 100) : 0
    return (
      <div className={`flex-center flex-col ${styles.summary}`}>
        <div className={`card p-lg ${styles.summaryCard}`}>
          <p className="text-display text-center">
            {pct >= 80 ? '🏆' : pct >= 50 ? '😊' : '💪'}
          </p>
          <h2 className="text-title text-center mt-sm">{tr.session_summary}</h2>
          <div className={styles.summaryStats}>
            <div className={styles.statItem}>
              <span className="text-display text-primary">{firstTryCorrect}</span>
              <span className="text-body text-light">{tr.session_correct}</span>
            </div>
            <div className={styles.statItem}>
              <span className="text-display">{total}</span>
              <span className="text-body text-light">{tr.session_total}</span>
            </div>
            <div className={styles.statItem}>
              <span className="text-display" style={{ color: wrongCount > 0 ? 'var(--color-error)' : undefined }}>
                {wrongCount}
              </span>
              <span className="text-body text-light">{tr.session_wrong}</span>
            </div>
          </div>
          <div className="progress-bar mt-lg">
            <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-small text-light text-center mt-sm">{pct}% {tr.stats_accuracy.toLowerCase()}</p>
          <div className="flex flex-gap-md mt-xl" style={{ justifyContent: 'center' }}>
            <button className="btn btn--accent btn--lg" onClick={startGame}>
              ▶️ {tr.play_again}
            </button>
            <button className="btn btn--ghost" onClick={() => router.push('/mundo-cercano')}>
              {tr.go_collection}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!game || !pair) return null

  const [left, right, correctPos] = pair
  const currentObj = game.objects[currentIndex]
  const currentWord = lang === 'es' ? currentObj.name_es : currentObj.name_en

  return (
    <div className={styles.gameWrap}>
      {/* Animación éxito */}
      {phase === 'success' && (
        <SuccessAnimation onComplete={handleSuccessComplete} duration={1400} />
      )}

      {/* Progreso */}
      <div className="container mt-md">
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{ width: `${((currentIndex) / game.objects.length) * 100}%` }}
          />
        </div>
        <p className="text-small text-light text-center mt-sm">
          {currentIndex + 1} / {game.objects.length}
        </p>
      </div>

      {/* Pregunta con TTS */}
      <div className={`${styles.question} mt-lg`}>
        <p className="text-body text-light text-center">{tr.game_question}</p>
        <div className="flex flex-center flex-gap-md mt-sm">
          <h2 className={`text-display text-primary ${styles.wordTitle}`}>{currentWord}</h2>
          <button
            className="btn btn--icon"
            onClick={() => speak(currentWord, lang === 'es' ? currentObj.audio_url_es : currentObj.audio_url_en, 3)}
            title={tr.replay_word}
          >
            🔊
          </button>
        </div>
      </div>

      {/* Opciones */}
      <div className={styles.options}>
        {[left, right].map((obj, i) => (
          <button
            key={obj.id}
            className={`${styles.optionBtn} ${phase === 'wrong' ? styles.optionWrong : ''}`}
            onClick={() => phase === 'playing' && handleChoice(i)}
            disabled={phase !== 'playing'}
          >
            <div className={`circle-img ${styles.circleImg}`}>
              <Image
                src={obj.image_path}
                alt=""
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 600px) 40vw, 200px"
                unoptimized={obj.image_path.startsWith('/api/')}
              />
            </div>
          </button>
        ))}
      </div>

      {phase === 'wrong' && (
        <p className="text-heading text-center" style={{ color: 'var(--color-error)' }}>
          {tr.incorrect}
        </p>
      )}
    </div>
  )
}
