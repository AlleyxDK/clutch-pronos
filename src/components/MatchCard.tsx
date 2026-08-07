import type { Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import { winnerPts, calculatePoints } from '../lib/points'
import { teamSigil } from '../lib/teams'
import { scoreLabelFromKey, getScoreParts } from '../lib/scores'
import { isMatchLocked, isMatchResulted, isMatchFinished } from '../lib/matchStatus'
import { pseudoInitials } from '../lib/initials'
import { isAdmin } from '../lib/admin'
import { formatMatchTime } from '../lib/format'
import TeamLogo from './TeamLogo'
import FormDots from './FormDots'
import ResultShare from './ResultShare'
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
  const finished = isMatchFinished(match)
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

  // Zone centrale : « VS » avant le match, le score une fois le résultat saisi.
  let center = <span className={styles.vs}>VS</span>

  if (resulted && match.result) {
    const result = match.result
    const parts = getScoreParts(result.score)
    const agg = result.aggregates
    const total = agg?.totalPronos ?? 0

    center = (
      <div className={styles.resultCenter}>
        <span className={styles.resultScore}>
          <span>{parts.teamAGames}</span>
          <span className={styles.resultDash}>–</span>
          <span>{parts.teamBGames}</span>
        </span>

        {total > 0 && <ResultShare count={agg.scoreCounts[result.score] ?? 0} total={total} />}

        {/* Un match sans MVP sélectionnable a result.mvp === '' : on n'affiche
            ni la ligne MVP ni son pourcentage. */}
        {result.mvp !== '' && (
          <>
            <span className={styles.resultMvp}>MVP · {result.mvp.split(' (')[0]}</span>
            {total > 0 && <ResultShare count={agg.mvpCounts[result.mvp] ?? 0} total={total} />}
          </>
        )}
      </div>
    )
  }

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
          <TeamLogo
            sigil={teamSigil(match.team_a.name)}
            teamId={match.team_a.id}
            size="sm"
            imageUrl={match.team_a.image_url}
          />
          <div className={styles.teamInfo}>
            <span className={styles.teamName}>{match.team_a.name}</span>
            <FormDots form={match.team_a.form} />
            <span className={styles.teamPts}>{winnerPts(match.team_a.cote)} pts si vainqueur</span>
          </div>
        </div>

        {center}

        <div className={`${styles.team} ${styles.right}`}>
          <div className={styles.teamInfo}>
            <span className={styles.teamName}>{match.team_b.name}</span>
            <FormDots form={match.team_b.form} />
            <span className={styles.teamPts}>{winnerPts(match.team_b.cote)} pts si vainqueur</span>
          </div>
          <TeamLogo
            sigil={teamSigil(match.team_b.name)}
            teamId={match.team_b.id}
            size="sm"
            imageUrl={match.team_b.image_url}
          />
        </div>
      </div>

      {resulted && match.result ? (
        <div className={`${styles.status} ${styles.statusStacked}`}>
          {existingProno ? (
            <span className={styles.statusGain}>
              Tu gagnes {calculatePoints(match, existingProno).total} pts
            </span>
          ) : (
            <span className={styles.statusNoProno}>Tu n'as pas pronostiqué</span>
          )}

          {pills}
        </div>
      ) : locked ? (
        <div className={`${styles.status} ${styles.statusStacked}`}>
          {/* Un match dont la fenêtre de jeu est écoulée mais dont personne n'a
              saisi le résultat n'est plus « verrouillé », il est terminé. */}
          {finished && (
            <span className={styles.statusPending}>Match terminé · Résultat non renseigné</span>
          )}

          <span className={existingProno ? styles.statusLocked : styles.statusNoProno}>
            {existingProno
              ? `${finished ? '' : '🔒 Match verrouillé · '}Ton prono : ${scoreLabelFromKey(match, existingProno.score)}`
              : `${finished ? 'Pas de prono' : '🔒 Match verrouillé · Pas de prono'}`}
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
