import { useState } from 'react'
import type { Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import MatchCard from './MatchCard'
import styles from './MatchesSection.module.css'

type Filter = 'all' | 'ewc' | 'lec' | 'lck'

interface MatchesSectionProps {
  matches: Match[]
  pronos: Record<string, Prono>
  onPronoClick: (matchId: string) => void
  revealedPronos: Record<string, RevealedPronoState>
  friendProfiles: Record<string, Profile>
  onOpenResult: (matchId: string) => void
}

const TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'ewc', label: 'EWC' },
  { id: 'lec', label: 'LEC' },
  { id: 'lck', label: 'LCK' },
]

function MatchesSection({
  matches,
  pronos,
  onPronoClick,
  revealedPronos,
  friendProfiles,
  onOpenResult,
}: MatchesSectionProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = filter === 'all' ? matches : matches.filter((m) => m.competition === filter)

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <h2 className={styles.title}>Les matches à ne pas rater</h2>
            <p className={styles.subtitle}>
              Choisis un score, il définit le vainqueur. Bonus si ton pick est rare.
            </p>
          </div>

          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${filter === tab.id ? styles.tabActive : ''}`}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {visible.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              existingProno={pronos[match.id] ?? null}
              onPronoClick={onPronoClick}
              revealedPronos={revealedPronos}
              friendProfiles={friendProfiles}
              onOpenResult={onOpenResult}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default MatchesSection
