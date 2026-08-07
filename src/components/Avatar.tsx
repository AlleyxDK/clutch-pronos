import { useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { thumbs } from '@dicebear/collection'
import type { Profile } from '../lib/types'
import { SPECIAL_AVATARS } from '../lib/specialAvatars'
import { pseudoInitials } from '../lib/initials'
import styles from './Avatar.module.css'

interface AvatarProps {
  profile: Profile | null | undefined
  size: number
  fallbackPseudo?: string
  fallbackSeed?: string
}

/*
 * Point d'entrée unique pour tous les avatars de l'app. Quatre cas, dans
 * l'ordre : avatar spécial débloqué, dicebear choisi, dicebear dérivé du uid,
 * et enfin le disque à initiales pour les profils sans aucune graine.
 */
function Avatar({ profile, size, fallbackPseudo, fallbackSeed }: AvatarProps) {
  const special =
    profile?.avatar?.type === 'special' ? SPECIAL_AVATARS[profile.avatar.id] : undefined

  // Un id d'avatar spécial inconnu (renommé, retiré du catalogue) ne doit pas
  // faire disparaître l'avatar : on retombe alors sur la graine dicebear.
  const seed =
    profile?.avatar?.type === 'dicebear' ? profile.avatar.seed : (fallbackSeed ?? null)

  const dicebearSvg = useMemo(() => {
    if (special || seed === null) return null
    return createAvatar(thumbs, { seed, size }).toString()
  }, [special, seed, size])

  if (special) {
    return (
      <span className={styles.avatar} style={{ width: size, height: size }}>
        {special.render(size)}
      </span>
    )
  }

  if (dicebearSvg !== null) {
    return (
      <span
        className={styles.avatar}
        style={{ width: size, height: size }}
        // Le SVG vient de DiceBear, généré localement à partir d'une graine :
        // aucune donnée utilisateur n'est interpolée dans le balisage.
        dangerouslySetInnerHTML={{ __html: dicebearSvg }}
      />
    )
  }

  const initialsSource = fallbackPseudo ?? profile?.pseudo ?? ''

  return (
    <span
      className={`${styles.avatar} ${styles.initials}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {pseudoInitials(initialsSource)}
    </span>
  )
}

export default Avatar
