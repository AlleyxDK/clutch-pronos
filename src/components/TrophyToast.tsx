import { useEffect } from 'react'
import type { TrophyDefinition } from '../lib/trophies'
import styles from './TrophyToast.module.css'

interface TrophyToastProps {
  trophy: TrophyDefinition | null
  onDismiss: () => void
}

const DISMISS_MS = 5000

function TrophyToast({ trophy, onDismiss }: TrophyToastProps) {
  const trophyId = trophy?.id ?? null

  useEffect(() => {
    if (trophyId === null) return

    const id = setTimeout(onDismiss, DISMISS_MS)
    return () => clearTimeout(id)
    // trophyId et non trophy : le timer doit repartir de zéro à chaque
    // trophée, pas à chaque nouvelle référence d'objet.
  }, [trophyId, onDismiss])

  if (!trophy) return null

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.icon}>{trophy.icon}</span>

      <span className={styles.body}>
        <span className={styles.kicker}>Nouveau trophée débloqué !</span>
        <span className={styles.name}>{trophy.name}</span>
      </span>
    </div>
  )
}

export default TrophyToast
