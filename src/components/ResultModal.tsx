import { useState } from 'react'
import type { Match } from '../lib/types'
import { generateScoreOptions } from '../lib/scores'
import { matchHasMvps } from '../lib/matchStatus'
import Modal from './Modal'
import styles from './ResultModal.module.css'

interface ResultModalProps {
  match: Match
  onSubmit: (score: string, mvp: string) => Promise<void>
  onClose: () => void
}

function ResultModal({ match, onSubmit, onClose }: ResultModalProps) {
  const [selectedScore, setSelectedScore] = useState<string | null>(null)
  const [selectedMvp, setSelectedMvp] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scoreOptions = generateScoreOptions(match)
  const hasMvps = matchHasMvps(match)
  const canSubmit = selectedScore !== null && !(hasMvps && selectedMvp === '')

  const handleSubmit = async () => {
    if (!canSubmit || selectedScore === null) return

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(selectedScore, hasMvps ? selectedMvp : '')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Saisir le résultat"
      subtitle={`${match.team_a.name} vs ${match.team_b.name} · ${match.tournament}`}
      onClose={onClose}
    >
      <div className={styles.field}>
        <span className={styles.label}>Score final</span>

        <div className={styles.chips}>
          {scoreOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`${styles.chip} ${selectedScore === opt.key ? styles.chipActive : ''}`}
              onClick={() => setSelectedScore(opt.key)}
            >
              {opt.teamName} {opt.scoreDisplay}
            </button>
          ))}
        </div>
      </div>

      {hasMvps && (
        <div className={styles.field}>
          <span className={styles.label}>MVP officiel</span>

          <select
            className={styles.select}
            value={selectedMvp}
            onChange={(event) => setSelectedMvp(event.target.value)}
          >
            <option value="">Choisis un joueur…</option>
            {match.mvps.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </div>
      )}

      {error !== null && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Enregistrement...' : 'Enregistrer le résultat'}
        </button>
      </div>
    </Modal>
  )
}

export default ResultModal
