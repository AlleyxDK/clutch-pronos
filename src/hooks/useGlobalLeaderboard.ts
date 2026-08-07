import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore'
import type { DocumentData, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore'
import type { Profile } from '../lib/types'
import { db } from '../lib/firebase'

export interface LeaderboardEntry {
  uid: string
  profile: Profile
}

const PAGE_SIZE = 50

/*
 * Le profil de chaque joueur vit dans users/{uid}/profile/main. Une requête de
 * groupe de collections sur 'profile' les récupère tous d'un coup, sans avoir
 * à lister la collection users.
 *
 * getDocs et non onSnapshot : un classement n'a pas besoin d'être temps réel,
 * et un abonnement permanent facturait une lecture à chaque écriture de profil
 * de n'importe quel joueur — coût quadratique avec le nombre d'utilisateurs.
 *
 * Le tri serveur porte sur stats.overall.total : la première page est donc
 * réellement le top 50. Effet de bord utile, Firestore exclut d'office les
 * documents dépourvus du champ trié, donc les joueurs sans stats disparaissent
 * sans filtre supplémentaire.
 */
function toProfile(data: DocumentData): Profile {
  return {
    pseudo: data.pseudo,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    avatar: data.avatar,
    selectedFrame: data.selectedFrame,
    selectedTitle: data.selectedTitle,
    stats: data.stats,
  }
}

export function useGlobalLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null)
  const isFetchingRef = useRef(false)

  const fetchPage = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setLoading(true)

    try {
      const constraints: QueryConstraint[] = [orderBy('stats.overall.total', 'desc')]
      if (!reset && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current))
      }
      // +1 sert de sonde : sa présence indique qu'il reste une page.
      constraints.push(limit(PAGE_SIZE + 1))

      const snapshot = await getDocs(query(collectionGroup(db, 'profile'), ...constraints))
      const docs = snapshot.docs
      const page = docs.slice(0, PAGE_SIZE)

      const next: LeaderboardEntry[] = []
      for (const entry of page) {
        // users/{uid}/profile/main → parent = 'profile', parent.parent = users/{uid}
        const uid = entry.ref.parent.parent?.id
        if (!uid) continue

        const data = entry.data()
        if (!data.pseudo) continue

        const profile = toProfile(data)
        // Filet : un joueur qui n'a jamais pronostiqué n'est pas classé.
        if ((profile.stats?.overall.pronoCount ?? 0) <= 0) continue

        next.push({ uid, profile })
      }

      // Le curseur suit le dernier doc RENVOYÉ, pas le dernier doc gardé :
      // sinon un profil filtré côté client ferait boucler la pagination.
      lastDocRef.current = page[page.length - 1] ?? lastDocRef.current
      setHasMore(docs.length === PAGE_SIZE + 1)
      setEntries((prev) => (reset ? next : [...prev, ...next]))
      setError(null)
    } catch (err) {
      console.error('useGlobalLeaderboard: lecture Firestore échouée', err)
      setError("Le classement n'a pas pu être chargé.")
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPage(true)
  }, [fetchPage])

  const refresh = useCallback(async () => {
    lastDocRef.current = null
    await fetchPage(true)
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    await fetchPage(false)
  }, [fetchPage])

  return { entries, loading, error, hasMore, loadMore, refresh }
}
