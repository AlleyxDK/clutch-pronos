import { useState } from 'react'
import Modal from './Modal'
import styles from './JoinLeagueModal.module.css'

interface JoinLeagueModalProps {
  onJoin: (code: string) => Promise<{ id: string }>
  onClose: () => void
}

function JoinLeagueModal({ onJoin, onClose }: JoinLeagueModalProps) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      await onJoin(code)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Rejoindre une ligue"
      subtitle="Entre le code à 6 caractères que ton pote t'a envoyé."
      onClose={onClose}
    >
      <div className={styles.field}>
        <input
          className={styles.input}
          type="text"
          placeholder="K7QM4X"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
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
          {submitting ? 'Connexion...' : 'Rejoindre'}
        </button>
      </div>
    </Modal>
  )
}

export default JoinLeagueModal
