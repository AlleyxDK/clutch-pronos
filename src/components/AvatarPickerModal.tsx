import { useState } from 'react'
import type { AvatarKind, Profile } from '../lib/types'
import { SPECIAL_AVATARS } from '../lib/specialAvatars'
import { unlockedCosmetics } from '../lib/trophies'
import Modal from './Modal'
import Avatar from './Avatar'
import styles from './AvatarPickerModal.module.css'

interface AvatarPickerModalProps {
  profile: Profile
  userId: string
  trophyIds: string[]
  onSave: (avatar: AvatarKind) => Promise<void>
  onClose: () => void
}

const PREVIEW_SIZE = 88

function AvatarPickerModal({
  profile,
  userId,
  trophyIds,
  onSave,
  onClose,
}: AvatarPickerModalProps) {
  const [tab, setTab] = useState<'procedural' | 'unlocked'>('procedural')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpecial, setSelectedSpecial] = useState<string | null>(
    profile.avatar?.type === 'special' ? profile.avatar.id : null,
  )

  const availableIds = unlockedCosmetics(trophyIds).avatars.filter(
    (id) => SPECIAL_AVATARS[id] !== undefined,
  )

  const apply = async (avatar: AvatarKind) => {
    setSaving(true)
    setError(null)
    try {
      await onSave(avatar)
      onClose()
    } catch (err) {
      console.error('AvatarPickerModal: enregistrement échoué', err)
      setError("L'avatar n'a pas pu être enregistré. Réessaie.")
      setSaving(false)
    }
  }

  return (
    <Modal title="Changer d'avatar" onClose={onClose} maxWidth="480px">
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'procedural' ? styles.tabActive : ''}`}
          onClick={() => setTab('procedural')}
        >
          Procédural
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'unlocked' ? styles.tabActive : ''}`}
          onClick={() => setTab('unlocked')}
        >
          Débloqués
        </button>
      </div>

      {tab === 'procedural' ? (
        <div className={styles.proceduralPane}>
          {/* Un profil forcé sur la graine uid : c'est l'avatar par défaut. */}
          <Avatar
            profile={{ ...profile, avatar: { type: 'dicebear', seed: userId } }}
            size={PREVIEW_SIZE}
          />
          <p className={styles.hint}>
            Ton avatar généré à partir de ton compte. Toujours le même, unique.
          </p>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={saving}
            onClick={() => apply({ type: 'dicebear', seed: userId })}
          >
            Utiliser celui-ci
          </button>
        </div>
      ) : availableIds.length === 0 ? (
        <p className={styles.empty}>
          Aucun avatar spécial débloqué pour l'instant. Continue à pronostiquer !
        </p>
      ) : (
        <>
          <div className={styles.grid}>
            {availableIds.map((id) => {
              const special = SPECIAL_AVATARS[id]
              const active = selectedSpecial === id

              return (
                <button
                  key={id}
                  type="button"
                  className={`${styles.tile} ${active ? styles.tileActive : ''}`}
                  onClick={() => setSelectedSpecial(id)}
                  aria-pressed={active}
                >
                  <span className={styles.tileArt}>{special.render(56)}</span>
                  <span className={styles.tileName}>{special.name}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            disabled={saving || selectedSpecial === null}
            onClick={() => {
              if (selectedSpecial === null) return
              apply({ type: 'special', id: selectedSpecial })
            }}
          >
            Choisir
          </button>
        </>
      )}

      {error !== null && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}

export default AvatarPickerModal
