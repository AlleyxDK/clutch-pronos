import type { Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import { isMatchLocked, isMatchResulted } from '../lib/matchStatus'
import MatchHero from './MatchHero'
import styles from './Hero.module.css'

interface HeroProps {
  match: Match
  existingProno: Prono | null
  onPronoClick: (matchId: string) => void
  revealedPronos: Record<string, RevealedPronoState>
  friendProfiles: Record<string, Profile>
}

function Hero({
  match,
  existingProno,
  onPronoClick,
  revealedPronos,
  friendProfiles,
}: HeroProps) {
  const locked = isMatchLocked(match)
  const resulted = isMatchResulted(match)
  const heading = `${match.stage.split(' · ')[0]} · ${match.tournament.split(' · ')[0]}.`
  const teams = `Bo${match.bo} entre ${match.team_a.name} et ${match.team_b.name}.`

  let eyebrow = 'Le match qui arrive'
  let accent = 'Choisis ton camp.'
  let lede = `${teams} Un seul choix : le score. Il définit qui gagne, et sa rareté définit ton bonus.`

  if (resulted) {
    eyebrow = 'Match joué'
    accent = 'Verdict.'
    // Le score et le MVP vivent désormais dans la carte, plus besoin de les
    // répéter ici.
    lede = teams
  } else if (locked) {
    eyebrow = 'Le match en cours'
    accent = 'Les jeux sont faits.'
    lede = `${teams} Les picks des potes sont ci-dessous.`
  }

  return (
    <section className={styles.hero}>
      <div className="container">
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          {eyebrow}
        </p>

        <h1 className={styles.title}>
          {heading} <em className={styles.titleAccent}>{accent}</em>
        </h1>

        <p className={styles.lede}>{lede}</p>

        <MatchHero
          match={match}
          existingProno={existingProno}
          onPronoClick={onPronoClick}
          revealedPronos={revealedPronos}
          friendProfiles={friendProfiles}
        />
      </div>
    </section>
  )
}

export default Hero
