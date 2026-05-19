'use client'

import { useEffect } from 'react'
import styles from './success-animation.module.css'

interface SuccessAnimationProps {
  onComplete?: () => void
  duration?: number  // ms
}

export function SuccessAnimation({ onComplete, duration = 1600 }: SuccessAnimationProps) {
  useEffect(() => {
    // Sonido de éxito usando Web Audio API (sin archivos externos)
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const start = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0.25, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
        osc.start(start)
        osc.stop(start + 0.35)
      })
    } catch {
      // El navegador puede bloquear AudioContext sin interacción; se ignora
    }

    if (onComplete) {
      const timer = setTimeout(onComplete, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onComplete])

  return (
    <div className={styles.overlay} role="status" aria-live="assertive">
      <div className={styles.burst}>
        {['⭐', '✨', '🌟', '💫', '⭐', '✨'].map((star, i) => (
          <span key={i} className={styles.star} style={{ '--i': i } as React.CSSProperties}>
            {star}
          </span>
        ))}
      </div>
      <div className={styles.circle}>
        <span className={styles.check}>✓</span>
      </div>
    </div>
  )
}
