import { useState } from 'react'
import styles from './TeamLogo.module.css'

interface TeamLogoProps {
  sigil: string
  teamId: string
  size: 'lg' | 'sm'
  imageUrl?: string | null
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

function TeamLogo({ sigil, teamId, size, imageUrl }: TeamLogoProps) {
  const [imgError, setImgError] = useState(false)
  const sizeClass = size === 'lg' ? styles.lg : styles.sm

  if (imageUrl && !imgError) {
    const boxPadding = size === 'lg' ? styles.imageBoxLg : styles.imageBoxSm

    return (
      <div className={`${styles.logo} ${sizeClass} ${styles.imageBox} ${boxPadding}`}>
        <img
          className={styles.image}
          src={imageUrl}
          /* Ajout hors spec: alt obligatoire sur une <img>. Le sigle est le
             libellé le plus court qui reste informatif. */
          alt={sigil}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  const brandClass = BRAND_BY_ID[teamId] ?? styles.fallback

  return <div className={`${styles.logo} ${sizeClass} ${brandClass}`}>{sigil}</div>
}

export default TeamLogo
