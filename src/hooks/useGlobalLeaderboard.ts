import { useEffect, useState } from 'react'
import { collectionGroup, onSnapshot } from 'firebase/firestore'
import type { Profile } from '../lib/types'
import { db } from '../lib/firebase'

export interface LeaderboardEntry {
  uid: string
  profile: Profile
}

/*
 * Le profil de chaque joueur vit dans users/{uid}/profile/main. Une requête de
 * groupe de collections sur 'profile' les récupère tous d'un coup, sans avoir
 * à lister la collection users.
 */
export function useGlobalLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collectionGroup(db, 'profile'),
      (snapshot) => {
        const next: LeaderboardEntry[] = []

        for (const entry of snapshot.docs) {
          // users/{uid}/profile/main → parent = 'profile', parent.parent = users/{uid}
          const uid = entry.ref.parent.parent?.id
          if (!uid) continue

          const data = entry.data()
          if (!data.pseudo) continue

          const profile: Profile = {
            pseudo: data.pseudo,
            createdAt: data.createdAt?.toMillis() ?? Date.now(),
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
            avatar: data.avatar,
            selectedFrame: data.selectedFrame,
            selectedTitle: data.selectedTitle,
            stats: data.stats,
          }

          // Un joueur qui n'a jamais pronostiqué n'apparaît pas au classement.
          if ((profile.stats?.overall.pronoCount ?? 0) <= 0) continue

          next.push({ uid, profile })
        }

        setEntries(next)
        setError(null)
        setLoading(false)
      },
      (err) => {
        console.error('useGlobalLeaderboard: abonnement Firestore échoué', err)
        setError("Le classement n'a pas pu être chargé.")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { entries, loading, error }
}
