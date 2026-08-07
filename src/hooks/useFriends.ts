import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import type { League, Profile } from '../lib/types'
import { db } from '../lib/firebase'

export function useFriends(myUserId: string | null, leagues: League[]) {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(false)
  const fetched = useRef<Set<string>>(new Set())

  const friendIds = useMemo(() => {
    if (myUserId === null) return []

    const unique = new Set<string>()
    for (const league of leagues) {
      for (const memberId of league.memberIds) {
        if (memberId !== myUserId) unique.add(memberId)
      }
    }

    // Trié pour que la référence reste stable d'un rendu à l'autre.
    return [...unique].sort()
  }, [myUserId, leagues])

  useEffect(() => {
    const missing = friendIds.filter((id) => !fetched.current.has(id))
    if (missing.length === 0) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    // Marqué avant l'appel : un profil illisible ne doit pas être retenté en
    // boucle à chaque rendu.
    for (const id of missing) fetched.current.add(id)

    Promise.all(
      missing.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, 'users', id, 'profile', 'main'))
          const data = snap.data()
          if (!snap.exists() || !data) return null

          const profile: Profile = {
            pseudo: data.pseudo,
            createdAt: data.createdAt?.toMillis() ?? Date.now(),
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
            avatar: data.avatar,
            selectedFrame: data.selectedFrame,
            selectedTitle: data.selectedTitle,
          }
          return [id, profile] as const
        } catch (error) {
          console.error(`useFriends: profil ${id} illisible`, error)
          return null
        }
      }),
    ).then((entries) => {
      if (cancelled) return

      const next: Record<string, Profile> = {}
      for (const entry of entries) {
        if (entry) next[entry[0]] = entry[1]
      }

      if (Object.keys(next).length > 0) {
        setProfiles((prev) => ({ ...prev, ...next }))
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [friendIds])

  return { friendIds, profiles, loading }
}
