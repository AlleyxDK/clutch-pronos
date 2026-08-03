import { useState } from 'react'
import type { CompetitionId, League } from '../lib/types'
import { COMPETITIONS } from '../lib/competitions'
import Modal from './Modal'
import styles from './CreateLeagueModal.module.css'

interface CreateLeagueModalProps {
  onCreate: (name: string, competitionIds: CompetitionId[]) => Promise<League>
  onClose: () => void
  onCreated: (league: League) => void
}

const ALL_COMPETITIONS = Object.keys(COMPETITIONS) as CompetitionId[]

function CreateLeagueModal({ onCreate, onClose, onCreated }: CreateLeagueModalProps) {
  const [name, setName] = useState('')
  const [selectedComps, setSelectedComps] = useState<CompetitionId[]>(['lec', 'lck', 'ewc'])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleComp = (id: CompetitionId) => {
    setError(null)
    setSelectedComps((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const handleSubmit = async () => {
    if (selectedComps.length === 0) {
      setError('Sélectionne au moins une compétition.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const league = await onCreate(name, selectedComps)
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
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Compétitions suivies</span>
        <p className={styles.hint}>
          Seuls les matches de ces circuits compteront dans le classement de la ligue.
        </p>

        <div className={styles.comps}>
          {ALL_COMPETITIONS.map((id) => (
            <button
              key={id}
              type="button"
              className={`${styles.comp} ${selectedComps.includes(id) ? styles.compActive : ''}`}
              onClick={() => toggleComp(id)}
            >
              {COMPETITIONS[id].name}
            </button>
          ))}
        </div>
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
          onClick={handleSubmit}
        >
          {submitting ? 'Création...' : 'Valider'}
        </button>
      </div>
    </Modal>
  )
}

export default CreateLeagueModal
