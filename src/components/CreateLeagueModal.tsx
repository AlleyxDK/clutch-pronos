import { useState } from 'react'
import type { League } from '../lib/types'
import Modal from './Modal'
import styles from './CreateLeagueModal.module.css'

interface CreateLeagueModalProps {
  onCreate: (name: string) => Promise<League>
  onClose: () => void
  onCreated: (league: League) => void
}

function CreateLeagueModal({ onCreate, onClose, onCreated }: CreateLeagueModalProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const league = await onCreate(name)
      onClose()
      onCreated(league)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Créer une ligue"
      subtitle="Un espace privé avec tes potes. Tu partages le code, ils rejoignent."
      onClose={onClose}
    >
      <div className={styles.field}>
        <span className={styles.label}>Nom de la ligue</span>
        <input
          className={styles.input}
          type="text"
          placeholder="Ex : Les Bros du Dimanche"
          maxLength={40}
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSubmit()
          }}
        />
        {error !== null && <p className={styles.error}>{error}</p>}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Création...' : 'Valider'}
        </button>
      </div>
    </Modal>
  )
}

export default CreateLeagueModal
