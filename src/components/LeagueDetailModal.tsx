import type { ReactNode } from 'react'
import type { League, Match, Profile, Prono } from '../lib/types'
import type { RevealedPronoState } from '../hooks/useRevealedPronos'
import { calculatePoints } from '../lib/points'
import { pseudoInitials } from '../lib/initials'
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

interface MemberScore {
  total: number
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
  const computeMemberScore = (userId: string): MemberScore => {
    let total = 0
    let hasErrors = false
    let allResultedFetchedOrAbsent = true

    for (const match of matches) {
      if (!match.result) continue

      /*
       * Ajout hors spec: l'utilisateur courant est traité à part. Ses pronos
       * viennent d'un onSnapshot fiable, donc l'absence d'un prono signifie
       * « pas de pronostic », jamais « pas encore chargé ». La version de la
       * spec retombait sur la branche `state === undefined` et le marquait
       * pending à vie dès qu'il avait sauté un match résulté.
       */
      if (userId === currentUserId) {
        const ownProno = pronos[match.id]
        if (ownProno) total += calculatePoints(match, ownProno).total
        continue
      }

      const state = revealedPronos[`${userId}__${match.id}`]

      if (state?.status === 'ready') {
        total += calculatePoints(match, state.prono).total
      } else if (state?.status === 'error') {
        hasErrors = true
        allResultedFetchedOrAbsent = false
      } else if (state?.status === 'pending' || state === undefined) {
        allResultedFetchedOrAbsent = false
      }
      // status 'absent' = pas de prono, 0 pts, pas de bruit
    }

    return { total, hasErrors, isPending: !allResultedFetchedOrAbsent }
  }

  const rows = league.memberIds.map((uid) => {
    const pseudo =
      uid === currentUserId ? currentUserPseudo : (friendProfiles[uid]?.pseudo ?? 'Chargement…')
    const score = computeMemberScore(uid)
    return { uid, pseudo, ...score, isCurrentUser: uid === currentUserId }
  })
  rows.sort((a, b) => b.total - a.total || a.pseudo.localeCompare(b.pseudo))

  const myPosition = rows.findIndex((r) => r.isCurrentUser) + 1
  const total = rows.length
  const myRow = rows[myPosition - 1]
  const myTotal = myRow?.total ?? 0

  let intro: ReactNode
  if (myRow?.hasErrors || myRow?.isPending) {
    intro = <span className={styles.introMuted}>Chargement du classement en cours…</span>
  } else if (total === 1) {
    intro = <>Tu es le seul joueur pour l'instant. Invite tes potes avec le code {league.code}.</>
  } else if (myPosition === 1) {
    const gap = rows[0].total - rows[1].total
    intro =
      gap === 0 ? (
        <>Tu es en tête à égalité avec {rows[1].pseudo}.</>
      ) : (
        <>
          Tu es en tête. {rows[1].pseudo} gratte à <b className={styles.introGap}>{gap} pts</b>{' '}
          derrière.
        </>
      )
  } else {
    const gap = rows[0].total - myTotal
    intro = (
      <>
        Tu es {myPosition}e sur {total}. Il te manque{' '}
        <b className={styles.introGap}>{gap} pts</b> pour rattraper {rows[0].pseudo}.
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

      <div className={styles.rows}>
        {rows.map((row, index) => (
          <div
            key={row.uid}
            className={`${styles.row} ${row.isCurrentUser ? styles.rowMe : ''}`}
          >
            <span className={`${styles.rank} ${row.isCurrentUser ? styles.rankMe : ''}`}>
              {index + 1}
            </span>

            <span className={styles.avatar}>{pseudoInitials(row.pseudo)}</span>

            <span className={styles.pseudo}>{row.pseudo}</span>

            <span className={styles.total}>{numberFormat.format(row.total)}</span>

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
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default LeagueDetailModal
