import type { ReactNode } from 'react'
import type { StreakLevel } from '../lib/streak'
import styles from './AvatarFrame.module.css'

interface AvatarFrameProps {
  children: ReactNode
  size: 'sm' | 'md' | 'lg'
  level: StreakLevel
}

const SIZE_CLASS: Record<AvatarFrameProps['size'], string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
}

const LEVEL_CLASS: Record<StreakLevel, string> = {
  none: styles.levelNone,
  bronze: styles.levelBronze,
  silver: styles.levelSilver,
  gold: styles.levelGold,
  fire: styles.levelFire,
}

/*
 * Enveloppe un avatar existant d'une auréole dont l'intensité suit le streak.
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
