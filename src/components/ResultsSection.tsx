import type { Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import MatchCard from './MatchCard'
import styles from './ResultsSection.module.css'

interface ResultsSectionProps {
  matches: Match[]
  pronos: Record<string, Prono>
  revealedPronos: Record<string, RevealedPronoState>
  friendProfiles: Record<string, Profile>
  onOpenResult: (matchId: string) => void
}

const MAX_RESULTS = 20

// Ajout hors spec: MatchCard exige onPronoClick, mais une carte résultée ne
// rend jamais le bouton de prono. Plutôt que de rendre la prop optionnelle
// dans MatchCard (ce qui masquerait un vrai oubli ailleurs), on passe un
// no-op explicite, défini hors composant pour rester stable entre les rendus.
const noop = () => {}

function ResultsSection({
  matches,
  pronos,
  revealedPronos,
  friendProfiles,
  onOpenResult,
}: ResultsSectionProps) {
  const now = Date.now()
  const pastMatches = matches
    .filter((m) => m.start_time < now) // tous les matches passés
    .sort((a, b) => {
      // Résultats saisis en premier (par submittedAt desc),
      // puis matches sans résultat (par start_time desc).
      const aTime = a.result?.submittedAt ?? a.start_time
      const bTime = b.result?.submittedAt ?? b.start_time
      return bTime - aTime
    })
    .slice(0, MAX_RESULTS)

  // Rien de passé : la section n'existe pas, plutôt qu'un état vide de plus.
  if (pastMatches.length === 0) return null

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <h2 className={styles.title}>Les derniers résultats</h2>
            <p className={styles.subtitle}>
              Ce qui s'est joué récemment. Les points sont validés dès qu'un résultat est saisi.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {pastMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              existingProno={pronos[match.id] ?? null}
              onPronoClick={noop}
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

export default ResultsSection
