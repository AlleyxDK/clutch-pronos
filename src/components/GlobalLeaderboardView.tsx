import { useState } from 'react'
import type { CompetitionId } from '../lib/types'
import { useGlobalLeaderboard } from '../hooks/useGlobalLeaderboard'
import { statsForFilter } from '../lib/userStats'
import { effectiveFrame } from '../lib/frames'
import Avatar from './Avatar'
import AvatarFrame from './AvatarFrame'
import styles from './GlobalLeaderboardView.module.css'

interface GlobalLeaderboardViewProps {
  currentUserId: string | null
  onOpenProfile?: (uid: string) => void
}

type Filter = 'all' | CompetitionId

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tous circuits' },
  { id: 'lec', label: 'LEC' },
  { id: 'lck', label: 'LCK' },
  { id: 'ewc', label: 'EWC' },
]

const PAGE_SIZE = 50
const numberFormat = new Intl.NumberFormat('fr-FR')

function GlobalLeaderboardView({
  currentUserId,
  onOpenProfile,
}: GlobalLeaderboardViewProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const { entries, loading, error } = useGlobalLeaderboard()

  // Sur un circuit donné, seuls les joueurs qui y ont pronostiqué sont classés.
  const ranked = entries
    .map((entry) => ({ ...entry, stat: statsForFilter(entry.profile.stats, filter) }))
    .filter((row) => (row.stat?.pronoCount ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.stat?.total ?? 0) - (a.stat?.total ?? 0) ||
        a.profile.pseudo.localeCompare(b.profile.pseudo),
    )

  const myIndex = ranked.findIndex((row) => row.uid === currentUserId)
  const visible = ranked.slice(0, limit)

  let intro: string
  if (loading) {
    intro = 'Chargement du classement…'
  } else if (currentUserId === null) {
    intro = 'Connecte-toi et fais ton premier prono pour rejoindre le classement.'
  } else if (myIndex === -1) {
    intro = 'Fais ton premier prono pour rejoindre le classement.'
  } else {
    const position = myIndex + 1
    const ordinal = position === 1 ? '1er' : `${position}e`
    intro = `Tu es ${ordinal} sur ${ranked.length} dans ce classement.`
  }

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <h2 className={styles.title}>Clutch Global</h2>
          <p className={styles.subtitle}>
            Le classement de tous les joueurs actifs. Tu es automatiquement dedans dès ton
            premier prono.
          </p>
        </div>

        <div className={styles.filters}>
          {FILTERS.map((option) => {
            const active = filter === option.id

            return (
              <button
                key={option.id}
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                onClick={() => {
                  setFilter(option.id)
                  setLimit(PAGE_SIZE)
                }}
                aria-pressed={active}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <p className={styles.intro}>{intro}</p>

        {error !== null ? (
          <p className={styles.error}>{error}</p>
        ) : !loading && ranked.length === 0 ? (
          <div className={styles.empty}>
            Personne n'a encore pronostiqué sur ce circuit. Sois le premier.
          </div>
        ) : (
          <>
            <div className={styles.tableHead}>
              <span className={styles.colRank}>#</span>
              <span className={styles.colPlayer}>Joueur</span>
              <span className={styles.colPts}>Points</span>
              <span className={styles.colStat}>Bons</span>
              <span className={styles.colStat}>Exacts</span>
              <span className={styles.colStat}>MVP</span>
              <span className={styles.colStat}>Pronos</span>
            </div>

            <div className={styles.rows}>
              {visible.map((row, index) => {
                const isMe = row.uid === currentUserId
                const stat = row.stat

                return (
                  <div
                    key={row.uid}
                    role={onOpenProfile ? 'button' : undefined}
                    tabIndex={onOpenProfile ? 0 : undefined}
                    className={`${styles.row} ${isMe ? styles.rowMe : ''} ${
                      onOpenProfile ? styles.rowClickable : ''
                    }`}
                    onClick={() => onOpenProfile?.(row.uid)}
                    onKeyDown={(event) => {
                      if (!onOpenProfile) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpenProfile(row.uid)
                      }
                    }}
                  >
                    <span className={`${styles.colRank} ${styles.rank} ${isMe ? styles.rankMe : ''}`}>
                      {index + 1}
                    </span>

                    <span className={`${styles.colPlayer} ${styles.player}`}>
                      <AvatarFrame size="md" level={effectiveFrame(row.profile)}>
                        <Avatar
                          profile={row.profile}
                          size={36}
                          fallbackPseudo={row.profile.pseudo}
                          fallbackSeed={row.uid}
                        />
                      </AvatarFrame>

                      <span className={styles.identity}>
                        <span className={styles.pseudo}>{row.profile.pseudo}</span>
                        {row.profile.selectedTitle !== undefined && (
                          <span className={styles.playerTitle}>{row.profile.selectedTitle}</span>
                        )}
                      </span>
                    </span>

                    <span className={`${styles.colPts} ${styles.total}`}>
                      {numberFormat.format(stat?.total ?? 0)}
                    </span>

                    <span className={`${styles.colStat} ${styles.stat}`}>
                      {stat?.correctWinners ?? 0}
                    </span>
                    <span className={`${styles.colStat} ${styles.stat}`}>
                      {stat?.exactScores ?? 0}
                    </span>
                    <span className={`${styles.colStat} ${styles.stat}`}>
                      {stat?.mvpBonuses ?? 0}
                    </span>
                    <span className={`${styles.colStat} ${styles.stat}`}>
                      {stat?.pronoCount ?? 0}
                    </span>
                  </div>
                )
              })}
            </div>

            {ranked.length > limit && (
              <button
                type="button"
                className={styles.more}
                onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              >
                Voir plus
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default GlobalLeaderboardView
