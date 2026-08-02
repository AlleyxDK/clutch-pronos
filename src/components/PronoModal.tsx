import { useState } from 'react'
import type { Match, Prono } from '../lib/types'
import { generateScoreOptions } from '../lib/scores'
import Modal from './Modal'
import styles from './PronoModal.module.css'

interface PronoModalProps {
  match: Match
  existingProno: Prono | null
  onSubmit: (score: string, mvp: string) => void
  onClose: () => void
}

function PronoModal({ match, existingProno, onSubmit, onClose }: PronoModalProps) {
  const [selectedScore, setSelectedScore] = useState<string | null>(existingProno?.score ?? null)
  const [selectedMvp, setSelectedMvp] = useState<string>(existingProno?.mvp ?? '')

  const scoreOptions = generateScoreOptions(match)
  const canSubmit = selectedScore !== null && selectedMvp !== ''

  const handleValidate = () => {
    if (selectedScore === null || selectedMvp === '') return
    onSubmit(selectedScore, selectedMvp)
    onClose()
  }

  return (
    <Modal
      title={`${match.team_a.name} vs ${match.team_b.name}`}
      subtitle={`${match.tournament} · ${match.stage}`}
      onClose={onClose}
    >
      <div className={styles.pronoHead}>
        <span className={styles.pronoLabel}>Ton prono</span>
        <span className={styles.pronoHint}>
          Bonus <span className={styles.hintAccent}>rareté</span> selon le % de joueurs sur ton
          pick.
        </span>
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>
          <span>Score en maps</span>
          <span className={styles.fieldNote}>6 issues possibles</span>
        </div>

        <div className={styles.chips}>
          {scoreOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`${styles.chip} ${selectedScore === opt.key ? styles.chipActive : ''}`}
              onClick={() => setSelectedScore(opt.key)}
            >
              <span className={styles.chipMain}>
                {opt.teamName} {opt.scoreDisplay}
              </span>
              <span className={styles.chipNote}>— pts</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>
          <span>MVP</span>
          <span className={styles.fieldNote}>Bonus rareté</span>
        </div>

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

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={!canSubmit}
          onClick={handleValidate}
        >
          Valider mon prono
        </button>
      </div>
    </Modal>
  )
}

export default PronoModal
