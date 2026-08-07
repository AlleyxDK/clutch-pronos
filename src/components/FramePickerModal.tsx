import { useState } from 'react'
import type { FrameKind, Profile } from '../lib/types'
import { FRAME_LABELS, STREAK_FRAMES, effectiveFrame } from '../lib/frames'
import { unlockedCosmetics } from '../lib/trophies'
import Modal from './Modal'
import Avatar from './Avatar'
import AvatarFrame from './AvatarFrame'
import styles from './FramePickerModal.module.css'

interface FramePickerModalProps {
  profile: Profile
  trophyIds: string[]
  // null = retour au cadre automatique (dérivé du streak).
  onSave: (frame: FrameKind | null) => Promise<void>
  onClose: () => void
}

const AUTO = '__auto__'

function FramePickerModal({ profile, trophyIds, onSave, onClose }: FramePickerModalProps) {
  const [selected, setSelected] = useState<FrameKind | typeof AUTO>(
    profile.selectedFrame ?? AUTO,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streak = profile.currentStreak ?? 0
  const trophyFrames = unlockedCosmetics(trophyIds).frames

  // 'none' est toujours proposé ; les cadres de streak selon le streak courant ;
  // les cadres de trophée selon ce qui est débloqué.
  const available: FrameKind[] = [
    'none',
    ...STREAK_FRAMES.filter((f) => streak >= f.minStreak).map((f) => f.kind),
    ...trophyFrames,
  ]

  const handleApply = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(selected === AUTO ? null : selected)
      onClose()
    } catch (err) {
      console.error('FramePickerModal: enregistrement échoué', err)
      setError("Le cadre n'a pas pu être enregistré. Réessaie.")
      setSaving(false)
    }
  }

  // Aperçu : l'avatar réel du joueur, sans son cadre, pour juger du rendu.
  const preview = <Avatar profile={profile} size={32} />

  return (
    <Modal title="Changer de cadre" onClose={onClose} maxWidth="480px">
      <button
        type="button"
        className={`${styles.autoRow} ${selected === AUTO ? styles.autoRowActive : ''}`}
        onClick={() => setSelected(AUTO)}
        aria-pressed={selected === AUTO}
      >
        <AvatarFrame size="sm" level={effectiveFrame({ ...profile, selectedFrame: undefined })}>
          {preview}
        </AvatarFrame>
        <span className={styles.autoText}>
          <span className={styles.autoTitle}>Automatique</span>
          <span className={styles.autoNote}>Suit ton streak ({streak} jours)</span>
        </span>
      </button>

      <div className={styles.grid}>
        {available.map((kind) => {
          const active = selected === kind

          return (
            <button
              key={kind}
              type="button"
              className={`${styles.tile} ${active ? styles.tileActive : ''}`}
              onClick={() => setSelected(kind)}
              aria-pressed={active}
            >
              <AvatarFrame size="sm" level={kind}>
                {preview}
              </AvatarFrame>
              <span className={styles.tileName}>{FRAME_LABELS[kind]}</span>
            </button>
          )
        })}
      </div>

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

export default FramePickerModal
