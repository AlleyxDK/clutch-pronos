import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import type { Profile } from '../lib/types'
import { db } from '../lib/firebase'
import { effectiveFrame } from '../lib/frames'
import { trophyById } from '../lib/trophies'
import Modal from './Modal'
import Avatar from './Avatar'
import AvatarFrame from './AvatarFrame'
import styles from './ProfileModal.module.css'

interface ProfileModalProps {
  userId: string
  currentUserId: string
  onClose: () => void
  onEdit: () => void
  onOpenAvatarPicker: () => void
  onOpenFramePicker: () => void
  onOpenTitlePicker: () => void
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function ProfileModal({
  userId,
  currentUserId,
  onClose,
  onEdit,
  onOpenAvatarPicker,
  onOpenFramePicker,
  onOpenTitlePicker,
}: ProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trophyIds, setTrophyIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      getDoc(doc(db, 'users', userId, 'profile', 'main')),
      // Les trophées sont publics : un joueur peut voir la vitrine d'un autre.
      getDocs(collection(db, 'users', userId, 'trophies')),
    ])
      .then(([profileSnap, trophiesSnap]) => {
        if (cancelled) return

        const data = profileSnap.data()
        if (!profileSnap.exists() || !data) {
          setError('Ce profil est introuvable.')
        } else {
          setProfile({
            pseudo: data.pseudo,
            createdAt: data.createdAt?.toMillis() ?? Date.now(),
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
            avatar: data.avatar,
            selectedFrame: data.selectedFrame,
            selectedTitle: data.selectedTitle,
          })
          setTrophyIds(trophiesSnap.docs.map((d) => d.data().id ?? d.id))
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

  const ownedTrophies = trophyIds
    .map((id) => trophyById(id))
    .filter((def): def is NonNullable<typeof def> => def !== undefined)

  return (
    <Modal title={profile?.pseudo ?? 'Profil'} onClose={onClose} maxWidth="480px">
      {loading ? (
        <p className={styles.state}>Chargement…</p>
      ) : error !== null || profile === null ? (
        <p className={styles.error}>{error ?? 'Ce profil est introuvable.'}</p>
      ) : (
        <>
          <div className={styles.avatarWrap}>
            <AvatarFrame size="lg" level={effectiveFrame(profile)}>
              <Avatar profile={profile} size={88} fallbackSeed={userId} />
            </AvatarFrame>
          </div>

          {profile.selectedTitle !== undefined && (
            <p className={styles.title}>{profile.selectedTitle}</p>
          )}

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

          {ownedTrophies.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Trophées</h3>

              <div className={styles.trophyGrid}>
                {ownedTrophies.map((def) => (
                  <div key={def.id} className={styles.trophyTile} title={def.description}>
                    <span className={styles.trophyIcon}>{def.icon}</span>
                    <span className={styles.trophyName}>{def.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className={styles.memberSince}>
            Membre depuis {dateFormat.format(new Date(profile.createdAt))}
          </p>

          {isOwnProfile && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Personnaliser</h3>

              <div className={styles.customizeRow}>
                <button type="button" className={styles.btnSmall} onClick={onOpenAvatarPicker}>
                  Changer d'avatar
                </button>
                <button type="button" className={styles.btnSmall} onClick={onOpenFramePicker}>
                  Changer de cadre
                </button>
                <button type="button" className={styles.btnSmall} onClick={onOpenTitlePicker}>
                  Changer de titre
                </button>
              </div>
            </section>
          )}

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
