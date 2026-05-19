'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Language, Translations } from '@/i18n'
import styles from './collection.module.css'

interface Obj {
  id: number
  name_es: string
  name_en: string
  image_path: string
  is_seed: boolean
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
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const getName = (obj: Obj) => lang === 'es' ? obj.name_es : obj.name_en

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

  function resetForm() {
    setNameEs('')
    setNameEn('')
    setPreview(null)
    setFile(null)
    setHintPrefill(null)
    setShowForm(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setSaving(true)
    const fd = new FormData()
    fd.append('name_es', nameEs)
    fd.append('name_en', nameEn)
    fd.append('image', file)

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

  // Agrupar hints por categoría
  const hintsByCategory = hints.reduce<Record<string, Hint[]>>((acc, h) => {
    const cat = lang === 'es' ? h.category_es : h.category_en
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(h)
    return acc
  }, {})

  return (
    <>
      {/* Grid de objetos */}
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
              {obj.is_seed && (
                <span className="badge badge--accent">{tr.seed_badge}</span>
              )}
              {!obj.is_seed && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(obj.id)}
                  title="Eliminar"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Tarjeta agregar */}
          <button
            className={`card card--hover ${styles.addCard}`}
            onClick={() => setShowForm(true)}
          >
            <span className={styles.addIcon}>+</span>
            <span className="text-body text-primary">{tr.add_object}</span>
          </button>
        </div>
      )}

      {/* Botón hints */}
      <div className="flex flex-center mt-xl">
        <button className="btn btn--ghost" onClick={() => setShowHints(!showHints)}>
          💡 {tr.hint_title}
        </button>
      </div>

      {/* Panel hints */}
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

      {/* Modal agregar objeto */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <div className={`card p-lg ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-heading mb-lg">{tr.add_object_title}</h2>

            <form onSubmit={handleSave} className={styles.form}>
              <div className="field">
                <label>{tr.name_es_label}</label>
                <input
                  className="input"
                  value={nameEs}
                  onChange={(e) => setNameEs(e.target.value)}
                  required
                  placeholder="ej: Zapatilla"
                />
              </div>
              <div className="field">
                <label>{tr.name_en_label}</label>
                <input
                  className="input"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  placeholder="eg: Sneaker"
                />
              </div>

              {/* Preview imagen */}
              {preview && (
                <div className={styles.previewWrap}>
                  <Image src={preview} alt="Preview" fill style={{ objectFit: 'cover' }} />
                </div>
              )}

              <div className="flex flex-gap-md">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => fileRef.current?.click()}
                >
                  🖼 {tr.upload_image}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => cameraRef.current?.click()}
                >
                  📷 {tr.take_photo}
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <div className="flex flex-gap-md mt-sm">
                <button type="button" className="btn btn--ghost" onClick={resetForm}>
                  {tr.cancel}
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving || !file || !nameEs || !nameEn}
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
