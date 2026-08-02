import { useState } from 'react'
import type { League } from '../lib/types'
import Modal from './Modal'
import styles from './LeagueCreatedModal.module.css'

interface LeagueCreatedModalProps {
  league: League
  onClose: () => void
}

function LeagueCreatedModal({ league, onClose }: LeagueCreatedModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(league.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copie du code échouée :', err)
      alert(`La copie a échoué. Note le code à la main : ${league.code}`)
    }
  }

  return (
    <Modal
      title="Ligue créée !"
      subtitle="Envoie ce code à tes potes. Ils cliquent Rejoindre et le saisissent."
      onClose={onClose}
    >
      <div className={styles.codeBox}>
        <span className={styles.codeLabel}>Code d'invitation</span>
        <span className={styles.code}>{league.code}</span>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={handleCopy}>
          {copied ? 'Copié !' : 'Copier le code'}
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onClose}>
          C'est bon
        </button>
      </div>
    </Modal>
  )
}

export default LeagueCreatedModal
