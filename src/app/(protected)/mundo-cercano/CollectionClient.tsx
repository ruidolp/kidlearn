'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Language, Translations } from '@/i18n'
import styles from './collection.module.css'

interface Obj {
  id: number
  name_es: string
  name_en: string
  image_path: string
  audio_url_es: string | null
  audio_url_en: string | null
}

interface Hint {
  id: number
  name_es: string
  name_en: string
  category_es: string
  category_en: string
}

interface Props {
  initialObjects: Obj[]
  hints: Hint[]
  lang: Language
  tr: Translations
}

type RecordState = 'idle' | 'recording' | 'recorded'

export function CollectionClient({ initialObjects, hints, lang, tr }: Props) {
  const [objects, setObjects] = useState<Obj[]>(initialObjects)
  const [showForm, setShowForm] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [nameEs, setNameEs] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [hintPrefill, setHintPrefill] = useState<{ es: string; en: string } | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Estado de grabación de voz
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const getName = (obj: Obj) => lang === 'es' ? obj.name_es : obj.name_en
  const activeName = lang === 'es' ? nameEs : nameEn

  function setActiveName(v: string) {
    if (lang === 'es') {
      setNameEs(v)
      if (!hintPrefill) setNameEn(v)
    } else {
      setNameEn(v)
      if (!hintPrefill) setNameEs(v)
    }
  }

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function openHint(hint: Hint) {
    setHintPrefill({ es: hint.name_es, en: hint.name_en })
    setNameEs(hint.name_es)
    setNameEn(hint.name_en)
    setShowHints(false)
    setShowForm(true)
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioPreviewUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
        setRecordState('recorded')
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecordState('recording')
    } catch {
      alert(tr.mic_error)
    }
  }, [tr.mic_error])

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  function reRecord() {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
    setAudioBlob(null)
    setAudioPreviewUrl(null)
    setRecordState('idle')
  }

  function playPreview() {
    if (!audioPreviewUrl) return
    new Audio(audioPreviewUrl).play()
  }

  function resetForm() {
    if (recordState === 'recording') mediaRecorderRef.current?.stop()
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
    setNameEs('')
    setNameEn('')
    setPreview(null)
    setFile(null)
    setHintPrefill(null)
    setShowForm(false)
    setAudioBlob(null)
    setAudioPreviewUrl(null)
    setRecordState('idle')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setSaving(true)

    const fd = new FormData()
    fd.append('lang', lang)
    fd.append('image', file)

    if (hintPrefill) {
      fd.append('name_es', nameEs)
      fd.append('name_en', nameEn)
    } else {
      fd.append(lang === 'es' ? 'name_es' : 'name_en', activeName)
    }

    if (audioBlob) {
      fd.append('audio', audioBlob, 'recording.webm')
    }

    const res = await fetch('/api/objects', { method: 'POST', body: fd })
    if (res.ok) {
      const obj = await res.json()
      setObjects((prev) => [...prev, obj])
      resetForm()
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    await fetch(`/api/objects/${id}`, { method: 'DELETE' })
    setObjects((prev) => prev.filter((o) => o.id !== id))
  }

  const hintsByCategory = hints.reduce<Record<string, Hint[]>>((acc, h) => {
    const cat = lang === 'es' ? h.category_es : h.category_en
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(h)
    return acc
  }, {})

  const nameLabel = lang === 'es' ? tr.name_es_label : tr.name_en_label

  return (
    <>
      {objects.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📦</span>
          <p className="text-heading">{tr.collection_empty}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {objects.map((obj) => (
            <div key={obj.id} className={`card ${styles.objCard}`}>
              <div className={styles.imgWrap}>
                <Image
                  src={obj.image_path}
                  alt={getName(obj)}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="160px"
                  unoptimized={obj.image_path.startsWith('/api/')}
                />
              </div>
              <p className="text-body text-center" style={{ marginTop: '0.5rem' }}>
                {getName(obj)}
              </p>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(obj.id)}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            className={`card card--hover ${styles.addCard}`}
            onClick={() => setShowForm(true)}
          >
            <span className={styles.addIcon}>+</span>
            <span className="text-body text-primary">{tr.add_object}</span>
          </button>
        </div>
      )}

      <div className="flex flex-center mt-xl">
        <button className="btn btn--ghost" onClick={() => setShowHints(!showHints)}>
          💡 {tr.hint_title}
        </button>
      </div>

      {showHints && (
        <div className={`card p-card mt-md ${styles.hintsPanel}`}>
          <p className="text-body text-light mb-md">{tr.hint_subtitle}</p>
          {Object.entries(hintsByCategory).map(([cat, words]) => (
            <div key={cat} className="mb-md">
              <p className="text-small text-light mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cat}
              </p>
              <div className="flex flex-wrap flex-gap-sm">
                {words.map((h) => (
                  <button
                    key={h.id}
                    className="badge badge--primary"
                    style={{ cursor: 'pointer', fontSize: '1rem', padding: '0.4rem 1rem' }}
                    onClick={() => openHint(h)}
                  >
                    + {lang === 'es' ? h.name_es : h.name_en}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <div className={`card p-lg ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-heading mb-lg">{tr.add_object_title}</h2>

            <form onSubmit={handleSave} className={styles.form}>
              {/* Solo el idioma activo */}
              <div className="field">
                <label>{nameLabel}</label>
                <input
                  className="input"
                  value={activeName}
                  onChange={(e) => setActiveName(e.target.value)}
                  required
                  placeholder={lang === 'es' ? 'ej: Zapatilla' : 'eg: Sneaker'}
                />
              </div>

              {/* Grabación de voz */}
              <div className={styles.recordSection}>
                <span className={styles.recordLabel}>{tr.record_audio_label}</span>

                {recordState === 'idle' && (
                  <div className={styles.recordControls}>
                    <button
                      type="button"
                      className={styles.recordBtn}
                      onClick={startRecording}
                    >
                      🎤 {tr.record_btn}
                    </button>
                    <span className={styles.recordHint}>{tr.recording_hint}</span>
                  </div>
                )}

                {recordState === 'recording' && (
                  <div className={styles.recordControls}>
                    <div className={styles.recordingDot} />
                    <button
                      type="button"
                      className={`${styles.recordBtn} ${styles['recordBtn--stop']}`}
                      onClick={stopRecording}
                    >
                      ⏹ {tr.stop_btn}
                    </button>
                  </div>
                )}

                {recordState === 'recorded' && (
                  <div className={styles.recordedControls}>
                    <button
                      type="button"
                      className={styles.recordBtn}
                      onClick={playPreview}
                    >
                      ▶ {tr.play_recording}
                    </button>
                    <button
                      type="button"
                      className={`${styles.recordBtn} ${styles['recordBtn--stop']}`}
                      onClick={reRecord}
                    >
                      🔄 {tr.re_record_btn}
                    </button>
                  </div>
                )}
              </div>

              {/* Imagen */}
              <button
                type="button"
                className={styles.imagePickerTrigger}
                onClick={() => setShowImagePicker(true)}
              >
                {preview ? (
                  <div className={styles.previewWrap} style={{ position: 'relative', width: '100%', paddingBottom: '60%' }}>
                    <Image src={preview} alt="Preview" fill style={{ objectFit: 'cover' }} />
                    <div className={styles.previewEditBadge}>✏️</div>
                  </div>
                ) : (
                  <div className={styles.imagePickerEmpty}>
                    <span className={styles.imagePickerIcon}>📷</span>
                    <span className={styles.imagePickerLabel}>{tr.upload_image}</span>
                  </div>
                )}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { e.target.files?.[0] && handleFile(e.target.files[0]); setShowImagePicker(false) }}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => { e.target.files?.[0] && handleFile(e.target.files[0]); setShowImagePicker(false) }}
              />

              {showImagePicker && (
                <div className={styles.pickerOverlay} onClick={() => setShowImagePicker(false)}>
                  <div className={styles.pickerSheet} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.pickerOption}
                      onClick={() => { cameraRef.current?.click() }}
                    >
                      <span className={styles.pickerOptionIcon}>📷</span>
                      <span>{tr.take_photo}</span>
                    </button>
                    <div className={styles.pickerDivider} />
                    <button
                      type="button"
                      className={styles.pickerOption}
                      onClick={() => { fileRef.current?.click() }}
                    >
                      <span className={styles.pickerOptionIcon}>🖼️</span>
                      <span>{tr.upload_image}</span>
                    </button>
                    <div className={styles.pickerDivider} />
                    <button
                      type="button"
                      className={`${styles.pickerOption} ${styles.pickerCancel}`}
                      onClick={() => setShowImagePicker(false)}
                    >
                      {tr.cancel}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-gap-md mt-sm">
                <button type="button" className="btn btn--ghost" onClick={resetForm}>
                  {tr.cancel}
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving || !file || !activeName}
                >
                  {saving ? tr.loading : tr.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
