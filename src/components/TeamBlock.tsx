import type { Team } from '../lib/types'
import { winnerPts } from '../lib/points'
import { teamSigil } from '../lib/teams'
import TeamLogo from './TeamLogo'
import FormDots from './FormDots'
import styles from './TeamBlock.module.css'

interface TeamBlockProps {
  team: Team
}

function TeamBlock({ team }: TeamBlockProps) {
  return (
    <div className={styles.team}>
      <TeamLogo sigil={teamSigil(team.id)} teamId={team.id} size="lg" />
      <span className={styles.name}>{team.name}</span>
      <span className={styles.region}>{team.region}</span>
      <FormDots form={team.form} />
      <span className={styles.reward}>{winnerPts(team.cote)} pts si vainqueur</span>
    </div>
  )
}

export default TeamBlock
