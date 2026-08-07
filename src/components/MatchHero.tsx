import type { Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import { scoreLabelFromKey, getScoreParts } from '../lib/scores'
import { isMatchLocked, isMatchResulted } from '../lib/matchStatus'
import { calculatePoints } from '../lib/points'
import { pseudoInitials } from '../lib/initials'
import Countdown from './Countdown'
import TeamBlock from './TeamBlock'
import ResultShare from './ResultShare'
import styles from './MatchHero.module.css'

interface MatchHeroProps {
  match: Match
  existingProno: Prono | null
  onPronoClick: (matchId: string) => void
  revealedPronos: Record<string, RevealedPronoState>
  friendProfiles: Record<string, Profile>
  isVisitor: boolean
  onOpenAuth: (context: string) => void
}

// Seules les entrées « ready » sont affichables : les autres sont en cours de
// chargement, absentes, ou en erreur.
function revealedFor(revealedPronos: Record<string, RevealedPronoState>, matchId: string) {
  const suffix = `__${matchId}`

  return Object.entries(revealedPronos).flatMap(([key, state]) => {
    if (!key.endsWith(suffix) || state.status !== 'ready') return []
    return [{ friendId: key.slice(0, -suffix.length), prono: state.prono }]
  })
}

function MatchHero({
  match,
  existingProno,
  onPronoClick,
  revealedPronos,
  friendProfiles,
  isVisitor,
  onOpenAuth,
}: MatchHeroProps) {
  const locked = isMatchLocked(match)
  const resulted = isMatchResulted(match)
  const revealed = revealedFor(revealedPronos, match.id)

  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.game}>
          <svg className={styles.gameIcon} viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="6" cy="6" r="1.75" fill="currentColor" />
          </svg>
          League of Legends
        </span>

        <span className={styles.tournament}>{match.tournament}</span>
        <span className={styles.stage}>{match.stage}</span>

        <span className={styles.live}>
          <span className={styles.liveDot} />
          Points vivants
        </span>
      </div>

      <div className={styles.body}>
        <TeamBlock team={match.team_a} />

        <div className={styles.center}>
          {resulted && match.result ? (
            /* Ajout hors spec: score et MVP regroupés dans un bloc, sinon le
               gap de 20px de .center s'ajouterait au margin-top de 8px. */
            <div className={styles.resultBlock}>
              <span className={styles.scoreBlock}>
                <span>{getScoreParts(match.result.score).teamAGames}</span>
                <span className={styles.scoreDash}>–</span>
                <span>{getScoreParts(match.result.score).teamBGames}</span>
              </span>

              {(match.result.aggregates?.totalPronos ?? 0) > 0 && (
                <ResultShare
                  count={match.result.aggregates.scoreCounts[match.result.score] ?? 0}
                  total={match.result.aggregates.totalPronos}
                />
              )}

              {/* Un match sans MVP sélectionnable a result.mvp === ''. */}
              {match.result.mvp !== '' && (
                <>
                  <span className={styles.mvpLine}>MVP · {match.result.mvp.split(' (')[0]}</span>
                  {(match.result.aggregates?.totalPronos ?? 0) > 0 && (
                    <ResultShare
                      count={match.result.aggregates.mvpCounts[match.result.mvp] ?? 0}
                      total={match.result.aggregates.totalPronos}
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <span className={styles.vs}>VS</span>
              {locked ? (
                <span className={styles.kickoffPassed}>Match en cours</span>
              ) : (
                <Countdown targetTime={match.start_time} />
              )}
            </>
          )}
        </div>

        <TeamBlock team={match.team_b} />
      </div>

      <div className={styles.heroCta}>
        <span className={styles.heroCtaStatus}>
          {isVisitor ? (
            <span className={styles.heroCtaVisitor}>
              Connecte-toi pour pronostiquer ce match.
            </span>
          ) : resulted ? (
            existingProno ? (
              <b className={styles.heroCtaGain}>
                Tu gagnes {calculatePoints(match, existingProno).total} pts
              </b>
            ) : (
              <span className={styles.heroCtaMuted}>Tu n'as pas pronostiqué ce match</span>
            )
          ) : locked ? (
            existingProno === null ? (
              <span className={styles.heroCtaMuted}>🔒 Match verrouillé · Pas de prono</span>
            ) : (
              <>
                🔒 Ton prono :{' '}
                <b className={styles.heroCtaValue}>
                  {scoreLabelFromKey(match, existingProno.score)}
                </b>
                {/* Ajout hors spec: sans cette garde, un prono sans MVP
                    (match PandaScore) affiche un « · MVP » orphelin. */}
                {existingProno.mvp !== '' && (
                  <>
                    {' '}
                    · MVP <b className={styles.heroCtaValue}>{existingProno.mvp.split(' (')[0]}</b>
                  </>
                )}
              </>
            )
          ) : existingProno === null ? (
            "Tu n'as pas encore pronostiqué ce match."
          ) : (
            <>
              Ton prono :{' '}
              <b className={styles.heroCtaValue}>
                {scoreLabelFromKey(match, existingProno.score)}
              </b>
              {existingProno.mvp !== '' && (
                <>
                  {' '}
                  · MVP <b className={styles.heroCtaValue}>{existingProno.mvp.split(' (')[0]}</b>
                </>
              )}
            </>
          )}
        </span>

        {isVisitor ? (
          <button
            type="button"
            className={styles.btnVisitor}
            onClick={() => onOpenAuth('Rejoins Clutch pour pronostiquer.')}
          >
            Créer un compte
          </button>
        ) : (
          !locked &&
          !resulted && (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => onPronoClick(match.id)}
            >
              {existingProno === null ? 'Faire mon prono' : 'Modifier'}
            </button>
          )
        )}
      </div>

      {(locked || resulted) && revealed.length > 0 && (
        <div className={styles.revealPanel}>
          <span className={styles.revealTitle}>Ce que les potes ont pické</span>

          <div className={styles.revealList}>
            {revealed.map(({ friendId, prono }) => {
              const profile = friendProfiles[friendId]

              return (
                <div key={friendId} className={styles.revealRow}>
                  <span className={styles.revealAvatar}>
                    {profile ? pseudoInitials(profile.pseudo) : '··'}
                  </span>

                  <span className={styles.revealInfo}>
                    <span
                      className={profile ? styles.revealPseudo : styles.revealPseudoPending}
                    >
                      {profile ? profile.pseudo : 'Chargement…'}
                    </span>
                    <span className={styles.revealPick}>
                      {scoreLabelFromKey(match, prono.score)}
                      {prono.mvp !== '' && ` · MVP ${prono.mvp.split(' (')[0]}`}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}

export default MatchHero
