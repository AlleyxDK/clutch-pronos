import type { ReactNode } from 'react'
import type { FrameKind } from '../lib/types'
import styles from './AvatarFrame.module.css'

interface AvatarFrameProps {
  children: ReactNode
  size: 'sm' | 'md' | 'lg'
  level: FrameKind
}

const SIZE_CLASS: Record<AvatarFrameProps['size'], string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
}

const LEVEL_CLASS: Record<FrameKind, string> = {
  none: styles.levelNone,
  bronze: styles.levelBronze,
  silver: styles.levelSilver,
  gold: styles.levelGold,
  fire: styles.levelFire,
  'trophy-precision': styles.levelPrecision,
  'trophy-mvp': styles.levelMvp,
  'trophy-streak': styles.levelStreak,
  'trophy-loyalty': styles.levelLoyalty,
  'trophy-lec': styles.levelLec,
  'trophy-lck': styles.levelLck,
  'trophy-ewc': styles.levelEwc,
  'trophy-underdog': styles.levelUnderdog,
  'trophy-season': styles.levelSeason,
}

/*
 * Enveloppe un avatar existant d'une auréole. Le niveau vient soit du streak
 * (bronze → fire), soit d'un cadre de trophée choisi par le joueur.
 * Le wrapper est en inline-flex : il épouse la taille de son enfant, et le
 * padding de chaque niveau crée l'espace entre le cadre et l'avatar.
 */
function AvatarFrame({ children, size, level }: AvatarFrameProps) {
  return (
    <span className={`${styles.frame} ${SIZE_CLASS[size]} ${LEVEL_CLASS[level]}`}>
      {children}
    </span>
  )
}

export default AvatarFrame
