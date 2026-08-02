import { useMemo } from 'react'
import type { Match, Prono } from '../lib/types'
import { seedMatchesToFirestore } from '../lib/seedMatches'
import { pseudoInitials } from '../lib/initials'
import { calculatePoints } from '../lib/points'
import { isAdmin } from '../lib/admin'
import styles from './Nav.module.css'

interface NavProps {
  pseudo: string
  matches: Match[]
  pronos: Record<string, Prono>
}

function Nav({ pseudo, matches, pronos }: NavProps) {
  const totalPoints = useMemo(() => {
    let sum = 0
    for (const match of matches) {
      if (!match.result) continue
      const p = pronos[match.id]
      if (!p) continue
      sum += calculatePoints(match, p).total
    }
    return sum
  }, [matches, pronos])

  const handleSeed = async () => {
    try {
      await seedMatchesToFirestore()
      alert('Seed OK')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Seed échoué')
    }
  }

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.mark} />
          <span className={styles.wordmark}>
            Clutch<span className={styles.dot}>.</span>
          </span>
        </div>

        <div className={styles.right}>
          {isAdmin() && (
            <button type="button" className={styles.seed} onClick={handleSeed}>
              Seed matches
            </button>
          )}

          <div className={styles.pill}>
            <span className={styles.avatar}>{pseudoInitials(pseudo)}</span>
            <span className={styles.identity}>
              <span className={styles.username}>{pseudo}</span>
              <span className={styles.points}>{totalPoints} pts</span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Nav
