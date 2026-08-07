import { useState } from 'react'
import type { Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import {
  startOfDay,
  next7Days,
  formatDayLabel,
  toDateInputValue,
  fromDateInputValue,
} from '../lib/dateUtils'
import MatchCard from './MatchCard'
import styles from './MatchesSection.module.css'

/* Reintro possible : filtre par compétition.
   La barre Tous / EWC / LEC / LCK vivait ici. La navigation par jour la
   remplace ; si on la réintroduit un jour, elle devra se combiner au jour
   sélectionné, pas s'y substituer. */

interface MatchesSectionProps {
  matches: Match[]
  pronos: Record<string, Prono>
  onPronoClick: (matchId: string) => void
  revealedPronos: Record<string, RevealedPronoState>
  friendProfiles: Record<string, Profile>
  onOpenResult: (matchId: string) => void
}

// Un match est « en attente » tant qu'aucun résultat n'a été saisi.
function isPending(match: Match): boolean {
  return !match.result
}

function pluralizeCount(count: number): string {
  if (count === 0) return 'aucun'
  return count === 1 ? '1 match' : `${count} matches`
}

function MatchesSection({
  matches,
  pronos,
  onPronoClick,
  revealedPronos,
  friendProfiles,
  onOpenResult,
}: MatchesSectionProps) {
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    // Default : aujourd'hui, ou premier jour avec matches non-résultés si aucun aujourd'hui
    const today = startOfDay(Date.now())
    const matchesToday = matches.filter((m) => isPending(m) && startOfDay(m.start_time) === today)
    if (matchesToday.length > 0) return today

    const upcoming = matches.filter(isPending).sort((a, b) => a.start_time - b.start_time)
    if (upcoming.length > 0) return startOfDay(upcoming[0].start_time)
    return today
  })

  const day7 = next7Days()
  // Si l'utilisateur a sauté à une date hors fenêtre via l'input, on l'ajoute
  // aux tabs pour qu'elle reste visible et désélectionnable.
  const days = day7.includes(selectedDay)
    ? day7
    : [...day7, selectedDay].sort((a, b) => a - b)

  const dayCounts = days.map(
    (day) => matches.filter((m) => isPending(m) && startOfDay(m.start_time) === day).length,
  )

  const filteredMatches = matches
    .filter((m) => isPending(m) && startOfDay(m.start_time) === selectedDay)
    // Ajout hors spec: tri chronologique. Sans lui, l'ordre d'une journée
    // dépend de l'ordre d'arrivée Firestore, qui n'est pas stable.
    .sort((a, b) => a.start_time - b.start_time)

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <h2 className={styles.title}>Les matches</h2>
            <p className={styles.subtitle}>
              Prono avant le kick-off. Après, le score est verrouillé.
            </p>
          </div>

          <input
            type="date"
            className={styles.datePicker}
            value={toDateInputValue(selectedDay)}
            onChange={(event) => {
              // Le champ peut être vidé par l'utilisateur : on ignore alors
              // la saisie plutôt que de basculer sur un NaN.
              if (event.target.value === '') return
              setSelectedDay(fromDateInputValue(event.target.value))
            }}
            aria-label="Choisir une date"
          />
        </div>

        <div className={styles.dayTabs}>
          {days.map((day, index) => {
            const active = day === selectedDay

            return (
              <button
                key={day}
                type="button"
                className={`${styles.dayTab} ${active ? styles.dayTabActive : ''}`}
                onClick={() => setSelectedDay(day)}
                aria-pressed={active}
              >
                <span className={styles.dayTabLabel}>{formatDayLabel(day)}</span>
                <span className={styles.dayTabCount}>{pluralizeCount(dayCounts[index])}</span>
              </button>
            )
          })}
        </div>

        {filteredMatches.length === 0 ? (
          <div className={styles.empty}>Aucun match ce jour. Regarde un autre jour.</div>
        ) : (
          <div className={styles.grid}>
            {filteredMatches.map((match) => (
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
        )}
      </div>
    </section>
  )
}

export default MatchesSection
