import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import type { Profile } from '../lib/types'
import { db } from '../lib/firebase'
import { pseudoInitials } from '../lib/initials'
import { streakLevel } from '../lib/streak'
import Modal from './Modal'
import AvatarFrame from './AvatarFrame'
import styles from './ProfileModal.module.css'

interface ProfileModalProps {
  userId: string
  currentUserId: string
  onClose: () => void
  onEdit: () => void
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function ProfileModal({ userId, currentUserId, onClose, onEdit }: ProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getDoc(doc(db, 'users', userId, 'profile', 'main'))
      .then((snap) => {
        if (cancelled) return

        const data = snap.data()
        if (!snap.exists() || !data) {
          setError('Ce profil est introuvable.')
        } else {
          setProfile({
            pseudo: data.pseudo,
            createdAt: data.createdAt?.toMillis() ?? Date.now(),
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
          })
        }
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('ProfileModal: profil illisible', err)
        setError("Ce profil n'a pas pu être chargé.")
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const currentStreak = profile?.currentStreak ?? 0
  const longestStreak = profile?.longestStreak ?? 0
  const isOwnProfile = userId === currentUserId

  return (
    <Modal title={profile?.pseudo ?? 'Profil'} onClose={onClose} maxWidth="480px">
      {loading ? (
        <p className={styles.state}>Chargement…</p>
      ) : error !== null || profile === null ? (
        <p className={styles.error}>{error ?? 'Ce profil est introuvable.'}</p>
      ) : (
        <>
          <div className={styles.avatarWrap}>
            <AvatarFrame size="lg" level={streakLevel(currentStreak)}>
              <span className={styles.avatarLg}>{pseudoInitials(profile.pseudo)}</span>
            </AvatarFrame>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Streak actuel</span>
              <span className={styles.statValue}>
                {currentStreak > 0 ? `🔥 ${currentStreak}` : currentStreak}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Meilleur streak</span>
              <span className={styles.statValue}>{longestStreak}</span>
            </div>
          </div>

          <p className={styles.memberSince}>
            Membre depuis {dateFormat.format(new Date(profile.createdAt))}
          </p>

          {isOwnProfile && (
            <button type="button" className={styles.btnSecondary} onClick={onEdit}>
              Modifier mon pseudo
            </button>
          )}
        </>
      )}
    </Modal>
  )
}

export default ProfileModal
