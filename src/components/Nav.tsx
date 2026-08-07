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
  onSignOut: () => void
}

function Nav({ pseudo, matches, pronos, onSignOut }: NavProps) {
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

          <button
            type="button"
            className={styles.signOut}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            onClick={() => {
              if (window.confirm('Se déconnecter ?')) onSignOut()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Nav
