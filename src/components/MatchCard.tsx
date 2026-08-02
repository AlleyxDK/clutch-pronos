import type { Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import { winnerPts, calculatePoints } from '../lib/points'
import { teamSigil } from '../lib/teams'
import { scoreLabelFromKey } from '../lib/scores'
import { isMatchLocked, isMatchResulted } from '../lib/matchStatus'
import { pseudoInitials } from '../lib/initials'
import { isAdmin } from '../lib/admin'
import { formatMatchTime } from '../lib/format'
import TeamLogo from './TeamLogo'
import FormDots from './FormDots'
import styles from './MatchCard.module.css'

interface MatchCardProps {
  match: Match
  existingProno: Prono | null
  onPronoClick: (matchId: string) => void
  revealedPronos: Record<string, RevealedPronoState>
  friendProfiles: Record<string, Profile>
  onOpenResult: (matchId: string) => void
}

const MAX_PILLS = 3

function formatDeadline(startTime: number): string {
  const date = new Date(startTime)
  const day = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return `le ${day}, ${time}`
}

// Seules les entrées « ready » sont affichables.
function revealedFor(revealedPronos: Record<string, RevealedPronoState>, matchId: string) {
  const suffix = `__${matchId}`

  return Object.entries(revealedPronos).flatMap(([key, state]) => {
    if (!key.endsWith(suffix) || state.status !== 'ready') return []
    return [{ friendId: key.slice(0, -suffix.length), prono: state.prono }]
  })
}

function MatchCard({
  match,
  existingProno,
  onPronoClick,
  revealedPronos,
  friendProfiles,
  onOpenResult,
}: MatchCardProps) {
  const locked = isMatchLocked(match)
  const resulted = isMatchResulted(match)
  const revealed = revealedFor(revealedPronos, match.id)
  const extra = revealed.length - MAX_PILLS

  const pills =
    revealed.length > 0 ? (
      <div className={styles.pills}>
        {revealed.slice(0, MAX_PILLS).map(({ friendId, prono }) => {
          const profile = friendProfiles[friendId]
          const pseudo = profile ? profile.pseudo : '??'

          return (
            <span key={friendId} className={styles.pill}>
              <span className={styles.pillAvatar}>
                {profile ? pseudoInitials(profile.pseudo) : '??'}
              </span>
              <span className={styles.pillText}>
                {pseudo} · {scoreLabelFromKey(match, prono.score)}
              </span>
            </span>
          )
        })}

        {extra > 0 && <span className={`${styles.pill} ${styles.pillMore}`}>+{extra}</span>}
      </div>
    ) : null

  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <div className={styles.metaLeft}>
          <span className={styles.tournament}>{match.tournament}</span>
          <span className={`${styles.time} ${locked ? styles.timeLocked : ''}`}>
            {formatMatchTime(match.start_time)}
          </span>
        </div>
      </div>

      <div className={styles.teams}>
        <div className={styles.team}>
          <TeamLogo sigil={teamSigil(match.team_a.id)} teamId={match.team_a.id} size="sm" />
          <div className={styles.teamInfo}>
            <span className={styles.teamName}>{match.team_a.name}</span>
            <FormDots form={match.team_a.form} />
            <span className={styles.teamPts}>{winnerPts(match.team_a.cote)} pts si vainqueur</span>
          </div>
        </div>

        <span className={styles.vs}>VS</span>

        <div className={`${styles.team} ${styles.right}`}>
          <div className={styles.teamInfo}>
            <span className={styles.teamName}>{match.team_b.name}</span>
            <FormDots form={match.team_b.form} />
            <span className={styles.teamPts}>{winnerPts(match.team_b.cote)} pts si vainqueur</span>
          </div>
          <TeamLogo sigil={teamSigil(match.team_b.id)} teamId={match.team_b.id} size="sm" />
        </div>
      </div>

      {resulted && match.result ? (
        <div className={`${styles.status} ${styles.statusStacked}`}>
          <span className={styles.statusResult}>
            🏆 Résultat : {scoreLabelFromKey(match, match.result.score)} · MVP{' '}
            {match.result.mvp.split(' (')[0]}
          </span>

          {existingProno ? (
            <span className={styles.statusGain}>
              Tu gagnes {calculatePoints(match, existingProno).total} pts
            </span>
          ) : (
            <span className={styles.statusNoProno}>Tu n'as pas pronostiqué ce match</span>
          )}

          {pills}
        </div>
      ) : locked ? (
        <div className={`${styles.status} ${styles.statusStacked}`}>
          <span className={existingProno ? styles.statusLocked : styles.statusNoProno}>
            {existingProno
              ? `🔒 Match verrouillé · Ton prono : ${scoreLabelFromKey(match, existingProno.score)}`
              : '🔒 Match verrouillé · Pas de prono'}
          </span>

          {pills}

          {isAdmin() && (
            <button
              type="button"
              className={styles.adminBtn}
              onClick={() => onOpenResult(match.id)}
            >
              Saisir le résultat
            </button>
          )}
        </div>
      ) : (
        <div className={styles.status}>
          {existingProno ? (
            <span className={styles.statusDone}>
              ✓ Prono fait · {scoreLabelFromKey(match, existingProno.score)}
            </span>
          ) : (
            <span className={styles.deadline}>Prono avant {formatDeadline(match.start_time)}</span>
          )}

          <button type="button" className={styles.btnMini} onClick={() => onPronoClick(match.id)}>
            {existingProno ? 'Modifier' : 'Faire mon prono'}
          </button>
        </div>
      )}
    </article>
  )
}

export default MatchCard
