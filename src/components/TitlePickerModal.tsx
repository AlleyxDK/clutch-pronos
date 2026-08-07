import { useState } from 'react'
import type { Profile } from '../lib/types'
import { unlockedCosmetics } from '../lib/trophies'
import Modal from './Modal'
import styles from './TitlePickerModal.module.css'

interface TitlePickerModalProps {
  profile: Profile
  trophyIds: string[]
  // null = aucun titre affiché.
  onSave: (title: string | null) => Promise<void>
  onClose: () => void
}

const NONE = '__none__'

function TitlePickerModal({ profile, trophyIds, onSave, onClose }: TitlePickerModalProps) {
  const [selected, setSelected] = useState<string>(profile.selectedTitle ?? NONE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const titles = unlockedCosmetics(trophyIds).titles

  const handleApply = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(selected === NONE ? null : selected)
      onClose()
    } catch (err) {
      console.error('TitlePickerModal: enregistrement échoué', err)
      setError("Le titre n'a pas pu être enregistré. Réessaie.")
      setSaving(false)
    }
  }

  return (
    <Modal title="Changer de titre" onClose={onClose} maxWidth="440px">
      <div className={styles.list}>
        <button
          type="button"
          className={`${styles.row} ${selected === NONE ? styles.rowActive : ''}`}
          onClick={() => setSelected(NONE)}
          aria-pressed={selected === NONE}
        >
          Aucun
        </button>

        {titles.map((title) => {
          const active = selected === title

          return (
            <button
              key={title}
              type="button"
              className={`${styles.row} ${active ? styles.rowActive : ''}`}
              onClick={() => setSelected(title)}
              aria-pressed={active}
            >
              {title}
            </button>
          )
        })}
      </div>

      {titles.length === 0 && (
        <p className={styles.empty}>
          Aucun titre débloqué pour l'instant. Les trophées en donnent.
        </p>
      )}

      {error !== null && <p className={styles.error}>{error}</p>}

      <button
        type="button"
        className={styles.btnPrimary}
        disabled={saving}
        onClick={handleApply}
      >
        {saving ? 'Enregistrement…' : 'Appliquer'}
      </button>
    </Modal>
  )
}

export default TitlePickerModal
