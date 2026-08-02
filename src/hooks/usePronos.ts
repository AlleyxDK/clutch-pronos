import { useCallback, useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import type { Prono } from '../lib/types'
import { db } from '../lib/firebase'

export function usePronos(userId: string | null) {
  const [pronos, setPronos] = useState<Record<string, Prono>>({})
  const [loading, setLoading] = useState(userId !== null)

  useEffect(() => {
    if (userId === null) {
      setPronos({})
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'pronos'),
      (snapshot) => {
        const next: Record<string, Prono> = {}

        snapshot.forEach((document) => {
          const data = document.data()
          next[document.id] = {
            matchId: data.matchId,
            score: data.score,
            mvp: data.mvp,
            // serverTimestamp() vaut null tant que le serveur n'a pas confirmé
            // l'écriture : on retombe sur l'heure locale pour l'écho optimiste.
            submittedAt: data.submittedAt?.toMillis() ?? Date.now(),
          }
        })

        setPronos(next)
        setLoading(false)
      },
      /*
       * Ajout hors spec: callback d'erreur sur onSnapshot. Sans lui, un refus
       * des règles de sécurité est avalé en silence et loading reste bloqué à
       * true indéfiniment — précisément le symptôme des « plus de 3 secondes ».
       */
      (error) => {
        console.error('usePronos: abonnement Firestore échoué', error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userId])

  const submitProno = useCallback(
    async (matchId: string, score: string, mvp: string) => {
      if (userId === null) {
        throw new Error("usePronos: impossible d'écrire un prono sans utilisateur connecté")
      }

      await setDoc(doc(db, 'users', userId, 'pronos', matchId), {
        matchId,
        score,
        mvp,
        submittedAt: serverTimestamp(),
      })
    },
    [userId],
  )

  return { pronos, submitProno, loading }
}
