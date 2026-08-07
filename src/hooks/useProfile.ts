import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import type { FieldValue } from 'firebase/firestore'
import type { Profile } from '../lib/types'
import { db } from '../lib/firebase'

// Champs modifiables d'un profil. createdAt est géré par le hook, jamais
// par l'appelant.
export interface ProfileUpdate {
  pseudo?: string
  currentStreak?: number
  longestStreak?: number
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(userId !== null)

  useEffect(() => {
    if (userId === null) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId, 'profile', 'main'),
      (snapshot) => {
        const data = snapshot.data()

        if (!snapshot.exists() || !data) {
          setProfile(null)
        } else {
          setProfile({
            pseudo: data.pseudo,
            createdAt: data.createdAt?.toMillis() ?? Date.now(),
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
          })
        }

        setLoading(false)
      },
      /*
       * Ajout hors spec: callback d'erreur sur onSnapshot, même raison que dans
       * usePronos — sans lui un refus des règles laisse loading bloqué à true.
       */
      (error) => {
        console.error('useProfile: abonnement Firestore échoué', error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userId])

  /*
   * Ajout hors spec: saveProfile prend désormais un update partiel plutôt
   * qu'un pseudo. La réconciliation de streak doit pouvoir écrire currentStreak
   * seul, sans avoir à renvoyer le pseudo — et surtout sans renvoyer createdAt,
   * qui est un Timestamp Firestore côté serveur et un number côté client.
   */
  const saveProfile = useCallback(
    async (update: ProfileUpdate) => {
      if (userId === null) {
        throw new Error("useProfile: impossible d'écrire un profil sans utilisateur connecté")
      }

      /*
       * createdAt n'est envoyé que si le profil n'existe pas encore. merge: true
       * ne préserve que les champs ABSENTS du payload : y laisser createdAt en
       * permanence le réécrirait à chaque appel, et donc remettrait la date de
       * création à zéro au premier renommage de pseudo.
       */
      const payload: ProfileUpdate & { createdAt?: FieldValue } = { ...update }
      if (profile === null) {
        payload.createdAt = serverTimestamp()
      }

      await setDoc(doc(db, 'users', userId, 'profile', 'main'), payload, { merge: true })
    },
    [userId, profile],
  )

  return { profile, loading, saveProfile }
}
