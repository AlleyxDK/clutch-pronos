import { useCallback, useEffect, useRef, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import type { Match, Prono, Trophy } from '../lib/types'
import { db } from '../lib/firebase'
import { checkTrophies } from '../lib/trophyChecker'
import { trophyById, type TrophyDefinition } from '../lib/trophies'

export function useTrophies(
  userId: string | null,
  matches: Match[],
  pronos: Record<string, Prono>,
) {
  const [trophies, setTrophies] = useState<Trophy[]>([])
  const [loading, setLoading] = useState(userId !== null)
  const [toastQueue, setToastQueue] = useState<TrophyDefinition[]>([])

  /*
   * Ajout hors spec: on ne toaste QUE les trophées écrits pendant cette
   * session. Sans ce garde-fou, le premier snapshot d'un joueur qui en possède
   * déjà dix en ferait défiler dix à l'ouverture de la page.
   */
  const writtenThisSession = useRef<Set<string>>(new Set())
  // Évite les doubles écritures pendant qu'un setDoc est encore en vol.
  const inFlight = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (userId === null) {
      setTrophies([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'trophies'),
      (snapshot) => {
        const next: Trophy[] = snapshot.docs.map((entry) => {
          const data = entry.data()
          return {
            id: data.id ?? entry.id,
            // serverTimestamp() est null le temps de l'aller-retour serveur.
            unlockedAt: data.unlockedAt?.toMillis() ?? Date.now(),
          }
        })
        next.sort((a, b) => a.unlockedAt - b.unlockedAt)
        setTrophies(next)
        setLoading(false)
      },
      (error) => {
        console.error('useTrophies: abonnement Firestore échoué', error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userId])

  // Réinitialise le suivi de session quand on change de compte.
  useEffect(() => {
    writtenThisSession.current = new Set()
    inFlight.current = new Set()
    setToastQueue([])
  }, [userId])

  useEffect(() => {
    if (userId === null) return
    if (loading) return
    if (matches.length === 0) return

    const shouldHave = checkTrophies(matches, pronos)
    const owned = new Set(trophies.map((t) => t.id))

    const missing = shouldHave.filter(
      (id) => !owned.has(id) && !inFlight.current.has(id),
    )
    if (missing.length === 0) return

    for (const id of missing) {
      inFlight.current.add(id)

      setDoc(doc(db, 'users', userId, 'trophies', id), {
        id,
        unlockedAt: serverTimestamp(),
      })
        .then(() => {
          writtenThisSession.current.add(id)
          const def = trophyById(id)
          if (def) setToastQueue((prev) => [...prev, def])
        })
        .catch((err) => {
          console.error(`useTrophies: écriture du trophée ${id} échouée`, err)
          // Libéré pour qu'un prochain cycle puisse retenter.
          inFlight.current.delete(id)
        })
    }
  }, [userId, loading, matches, pronos, trophies])

  const dismissToast = useCallback(() => {
    setToastQueue((prev) => prev.slice(1))
  }, [])

  return { trophies, loading, currentToast: toastQueue[0] ?? null, dismissToast }
}
