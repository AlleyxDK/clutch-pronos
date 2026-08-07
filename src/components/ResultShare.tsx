import styles from './ResultShare.module.css'

interface ResultShareProps {
  count: number
  total: number
}

/*
 * Ajout hors spec: le « N% ont trouvé » est demandé à l'identique dans
 * MatchCard et MatchHero. Un composant partagé évite que les deux rendus
 * divergent au premier ajustement de style.
 */
function ResultShare({ count, total }: ResultShareProps) {
  if (total <= 0) return null

  const pct = Math.round((count / total) * 100)

  return (
    <p className={styles.share}>
      <span className={styles.pct}>{pct}%</span> ont trouvé
    </p>
  )
}

export default ResultShare
