import type { League } from '../lib/types'
import styles from './LeaguesSection.module.css'

interface LeaguesSectionProps {
  leagues: League[]
  onCreate: () => void
  onJoin: () => void
  onOpenDetail: (league: League) => void
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function LeaguesSection({ leagues, onCreate, onJoin, onOpenDetail }: LeaguesSectionProps) {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <h2 className={styles.title}>Mes ligues</h2>
            <p className={styles.subtitle}>Rivalités et challenges entre potes</p>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnSecondary} onClick={onJoin}>
              Rejoindre une ligue
            </button>
            <button type="button" className={styles.btnPrimary} onClick={onCreate}>
              Créer une ligue
            </button>
          </div>
        </div>

        {leagues.length === 0 ? (
          <p className={styles.empty}>
            Tu n'es dans aucune ligue. Crée-en une pour inviter tes potes, ou rejoins avec un
            code.
          </p>
        ) : (
          <div className={styles.grid}>
            {leagues.map((league) => (
              <article
                key={league.id}
                className={styles.card}
                role="button"
                tabIndex={0}
                onClick={() => onOpenDetail(league)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpenDetail(league)
                  }
                }}
              >
                <div className={styles.cardHead}>
                  <span className={styles.cardName}>{league.name}</span>
                  <span className={styles.cardCode}>{league.code}</span>
                </div>

                <span className={styles.cardMeta}>
                  {league.memberIds.length} joueur{league.memberIds.length > 1 ? 's' : ''} · créée
                  le {dateFormatter.format(new Date(league.createdAt))}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default LeaguesSection
