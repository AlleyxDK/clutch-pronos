import { useState } from 'react'
import Modal from './Modal'
import styles from './EditProfileModal.module.css'

interface EditProfileModalProps {
  currentPseudo: string
  onSave: (newPseudo: string) => Promise<void>
  onClose: () => void
}

function EditProfileModal({ currentPseudo, onSave, onClose }: EditProfileModalProps) {
  const [pseudo, setPseudo] = useState(currentPseudo)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmed = pseudo.trim()

    if (trimmed.length < 2) {
      setError('Le pseudo doit faire au moins 2 caractères.')
      return
    }
    if (trimmed.length > 20) {
      setError('Le pseudo ne peut pas dépasser 20 caractères.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSave(trimmed)
      onClose()
    } catch (err) {
      console.error('EditProfileModal: enregistrement échoué', err)
      setError("Le pseudo n'a pas pu être enregistré. Réessaie.")
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Modifier mon pseudo" onClose={onClose} maxWidth="440px">
      <div className={styles.field}>
        <input
          className={styles.input}
          type="text"
          placeholder="Ton pseudo"
          maxLength={20}
          autoFocus
          value={pseudo}
          onChange={(event) => {
            setPseudo(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSave()
          }}
        />
      </div>

      {error !== null && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={submitting}
          onClick={handleSave}
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  )
}

export default EditProfileModal
