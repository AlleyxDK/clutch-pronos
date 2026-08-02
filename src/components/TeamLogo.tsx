import styles from './TeamLogo.module.css'

interface TeamLogoProps {
  sigil: string
  teamId: string
  size: 'lg' | 'sm'
}

const BRAND_BY_ID: Record<string, string> = {
  t1: styles.t1,
  geng: styles.geng,
  g2: styles.g2,
  fnc: styles.fnc,
  drx: styles.drx,
  koi: styles.koi,
  mad: styles.mad,
  hle: styles.hle,
}

function TeamLogo({ sigil, teamId, size }: TeamLogoProps) {
  const brandClass = BRAND_BY_ID[teamId] ?? styles.fallback
  const sizeClass = size === 'lg' ? styles.lg : styles.sm

  return <div className={`${styles.logo} ${sizeClass} ${brandClass}`}>{sigil}</div>
}

export default TeamLogo
