import { useMemo } from 'react'
import type { Match, Profile, Prono } from '../lib/types'
import { seedMatchesToFirestore } from '../lib/seedMatches'
import { calculatePoints } from '../lib/points'
import { computeStreak } from '../lib/streak'
import { effectiveFrame } from '../lib/frames'
import { isAdmin } from '../lib/admin'
import Avatar from './Avatar'
import AvatarFrame from './AvatarFrame'
import styles from './Nav.module.css'

interface NavProps {
  pseudo: string
  matches: Match[]
  pronos: Record<string, Prono>
  onSignOut: () => void
  isVisitor?: boolean
  onOpenAuth?: (context: string) => void
  profile?: Profile | null
  // Graine de repli pour l'avatar procédural des profils sans champ `avatar`.
  userId?: string
  onOpenOwnProfile?: () => void
  currentView: 'home' | 'global'
  onViewChange: (view: 'home' | 'global') => void
}

function Nav({
  pseudo,
  matches,
  pronos,
  onSignOut,
  isVisitor,
  onOpenAuth,
  profile,
  userId,
  onOpenOwnProfile,
  currentView,
  onViewChange,
}: NavProps) {
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

  // Le streak recalculé localement est plus frais que celui stocké, mais le
  // stocké prend le relais tant que l'effect de réconciliation n'a pas tourné.
  const displayStreak = useMemo(() => {
    if (!profile) return 0
    const { current } = computeStreak(matches, pronos)
    return Math.max(current, profile.currentStreak ?? 0)
  }, [matches, pronos, profile])

  // Le cadre suit le choix du joueur ; à défaut il est dérivé du streak.
  const level = effectiveFrame(profile)

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

        <div className={styles.views}>
          <button
            type="button"
            className={`${styles.viewLink} ${currentView === 'home' ? styles.viewLinkActive : ''}`}
            onClick={() => onViewChange('home')}
            aria-current={currentView === 'home' ? 'page' : undefined}
          >
            {/* Le libellé bascule en icône sous 700px, via CSS. */}
            <span className={styles.viewIcon} aria-hidden="true">
              🏠
            </span>
            <span className={styles.viewLabel}>Accueil</span>
          </button>

          <button
            type="button"
            className={`${styles.viewLink} ${currentView === 'global' ? styles.viewLinkActive : ''}`}
            onClick={() => onViewChange('global')}
            aria-current={currentView === 'global' ? 'page' : undefined}
          >
            <span className={styles.viewIcon} aria-hidden="true">
              🏆
            </span>
            <span className={styles.viewLabel}>Clutch Global</span>
          </button>
        </div>

        <div className={styles.right}>
          {isAdmin() && (
            <button type="button" className={styles.seed} onClick={handleSeed}>
              Seed matches
            </button>
          )}

          {isVisitor ? (
            <div className={styles.authActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => onOpenAuth?.('Content de te revoir.')}
              >
                Se connecter
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => onOpenAuth?.('Rejoins Clutch.')}
              >
                Créer un compte
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={styles.pill}
                onClick={onOpenOwnProfile}
                aria-label="Voir mon profil"
              >
                <AvatarFrame size="sm" level={level}>
                  <Avatar
                    profile={profile}
                    size={32}
                    fallbackPseudo={pseudo}
                    fallbackSeed={userId}
                  />
                </AvatarFrame>

                <span className={styles.identity}>
                  <span className={styles.username}>{pseudo}</span>
                  {profile?.selectedTitle !== undefined && (
                    <span className={styles.userTitle}>{profile.selectedTitle}</span>
                  )}
                  <span className={styles.points}>{totalPoints} pts</span>
                </span>

                {displayStreak > 0 && (
                  <span className={styles.streakBadge}>🔥 {displayStreak}</span>
                )}
              </button>

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
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Nav
