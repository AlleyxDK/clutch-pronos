import type { ReactNode } from 'react'
import type { League, Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import { calculatePoints } from '../lib/points'
import { pseudoInitials } from '../lib/initials'
import { matchInLeague } from '../lib/leagueCompetitions'
import Modal from './Modal'
import styles from './LeagueDetailModal.module.css'

interface LeagueDetailModalProps {
  league: League
  matches: Match[]
  pronos: Record<string, Prono>
  revealedPronos: Record<string, RevealedPronoState>
  currentUserId: string
  currentUserPseudo: string
  friendProfiles: Record<string, Profile>
  onClose: () => void
}

interface MemberStats {
  total: number
  correctWinners: number
  exactScores: number
  mvpBonuses: number
  hasErrors: boolean
  isPending: boolean
}

const numberFormat = new Intl.NumberFormat('fr-FR')

function LeagueDetailModal({
  league,
  matches,
  pronos,
  revealedPronos,
  currentUserId,
  currentUserPseudo,
  friendProfiles,
  onClose,
}: LeagueDetailModalProps) {
  const computeMemberStats = (userId: string): MemberStats => {
    let total = 0
    let correctWinners = 0
    let exactScores = 0
    let mvpBonuses = 0
    let hasErrors = false
    let allResultedFetchedOrAbsent = true

    const accumulate = (match: Match, prono: Prono) => {
      const pts = calculatePoints(match, prono)
      total += pts.total
      if (pts.winner > 0) correctWinners++
      if (pts.scoreBonus > 0) exactScores++
      if (pts.mvpBonus > 0) mvpBonuses++
    }

    for (const match of matches) {
      if (!matchInLeague(match, league)) continue
      if (!match.result) continue

      /*
       * Ajout hors spec: l'utilisateur courant est traité à part. Ses pronos
       * viennent d'un onSnapshot fiable, donc l'absence d'un prono signifie
       * « pas de pronostic », jamais « pas encore chargé ».
       */
      if (userId === currentUserId) {
        const ownProno = pronos[match.id]
        if (ownProno) accumulate(match, ownProno)
        continue
      }

      const state = revealedPronos[`${userId}__${match.id}`]

      if (state?.status === 'ready') {
        accumulate(match, state.prono)
      } else if (state?.status === 'error') {
        hasErrors = true
        allResultedFetchedOrAbsent = false
      } else if (state?.status === 'pending' || state === undefined) {
        allResultedFetchedOrAbsent = false
      }
      // status 'absent' = pas de prono, 0 pts, pas de bruit
    }

    return {
      total,
      correctWinners,
      exactScores,
      mvpBonuses,
      hasErrors,
      isPending: !allResultedFetchedOrAbsent,
    }
  }

  const rows = league.memberIds.map((uid) => {
    const pseudo =
      uid === currentUserId ? currentUserPseudo : (friendProfiles[uid]?.pseudo ?? 'Chargement…')
    const stats = computeMemberStats(uid)
    return { uid, pseudo, ...stats, isCurrentUser: uid === currentUserId }
  })
  rows.sort((a, b) => b.total - a.total || a.pseudo.localeCompare(b.pseudo))

  const myPosition = rows.findIndex((r) => r.isCurrentUser) + 1
  const total = rows.length
  const myRow = rows[myPosition - 1]
  const myTotal = myRow?.total ?? 0

  let intro: ReactNode
  if (myRow?.hasErrors || myRow?.isPending) {
    intro = <span className={styles.introMuted}>Chargement du classement en cours…</span>
  } else {
    let headline: ReactNode
    let gapLine: ReactNode = null

    if (total === 1) {
      headline = <>Tu es le seul joueur pour l'instant. Invite tes potes avec le code {league.code}.</>
    } else if (myPosition === 1) {
      const gap = rows[0].total - rows[1].total
      if (gap === 0) {
        headline = <>Tu es en tête à égalité avec {rows[1].pseudo}.</>
      } else {
        headline = <>Tu es en tête.</>
        gapLine = (
          <>
            {rows[1].pseudo} gratte à <b className={styles.introGap}>{gap} pts</b> derrière.
          </>
        )
      }
    } else {
      const gap = rows[0].total - myTotal
      headline = (
        <>
          Tu es {myPosition}e sur {total}.
        </>
      )
      gapLine = (
        <>
          Il te manque <b className={styles.introGap}>{gap} pts</b> pour rattraper{' '}
          {rows[0].pseudo}.
        </>
      )
    }

    intro = (
      <>
        <span className={styles.introHeadline}>{headline}</span>
        <span className={styles.introStats}>
          {myRow?.correctWinners ?? 0} bons · {myRow?.exactScores ?? 0} exacts ·{' '}
          {myRow?.mvpBonuses ?? 0} MVP
        </span>
        {gapLine && <span className={styles.introGapLine}>{gapLine}</span>}
      </>
    )
  }

  return (
    <Modal
      title={league.name}
      subtitle={`${league.memberIds.length} joueur(s) · code ${league.code}`}
      onClose={onClose}
    >
      <div className={styles.intro}>{intro}</div>

      <div className={styles.head}>
        <span className={styles.colRank}>#</span>
        <span className={styles.colPlayer}>Joueur</span>
        <span className={styles.colPts}>Pts</span>
        <span className={styles.colStat}>Bons</span>
        <span className={styles.colExact}>Exacts</span>
        <span className={styles.colStat}>MVP</span>
      </div>

      <div className={styles.rows}>
        {rows.map((row, index) => (
          <div
            key={row.uid}
            className={`${styles.row} ${row.isCurrentUser ? styles.rowMe : ''}`}
          >
            <span
              className={`${styles.colRank} ${styles.rank} ${row.isCurrentUser ? styles.rankMe : ''}`}
            >
              {index + 1}
            </span>

            <span className={`${styles.colPlayer} ${styles.player}`}>
              <span className={styles.avatar}>{pseudoInitials(row.pseudo)}</span>
              <span className={styles.pseudo}>{row.pseudo}</span>

              {row.hasErrors ? (
                <span
                  className={styles.flagError}
                  title="Impossible de charger tous les pronos de ce joueur — total possiblement incomplet"
                >
                  ⚠
                </span>
              ) : row.isPending ? (
                <span className={styles.flagPending} title="Chargement en cours">
                  …
                </span>
              ) : null}
            </span>

            <span className={`${styles.colPts} ${styles.total}`}>
              {numberFormat.format(row.total)}
            </span>

            <span className={`${styles.colStat} ${styles.stat}`}>{row.correctWinners}</span>
            <span className={`${styles.colExact} ${styles.stat}`}>{row.exactScores}</span>
            <span className={`${styles.colStat} ${styles.stat}`}>{row.mvpBonuses}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default LeagueDetailModal
