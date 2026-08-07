import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteField, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import type { FieldValue } from 'firebase/firestore'
import type { AvatarKind, FrameKind, Profile, UserStats } from '../lib/types'
import { db } from '../lib/firebase'

/*
 * Champs modifiables d'un profil. createdAt est géré par le hook, jamais par
 * l'appelant. `null` signifie « efface ce champ » : Firestore rejette
 * `undefined`, il faut passer par deleteField(). C'est ce qui permet de
 * revenir au cadre automatique ou de retirer son titre.
 */
export interface ProfileUpdate {
  pseudo?: string
  currentStreak?: number
  longestStreak?: number
  avatar?: AvatarKind
  selectedFrame?: FrameKind | null
  selectedTitle?: string | null
  stats?: UserStats
}

const NULLABLE_FIELDS = ['selectedFrame', 'selectedTitle'] as const

const DEBOUNCE_MS = 500

interface PendingWrite {
  timer: ReturnType<typeof setTimeout> | null
  accumulated: ProfileUpdate
  // Tous les appelants en attente de CE flush. Sans cette liste, un appel
  // annulé par un appel suivant laisserait sa promesse pendante à jamais —
  // et EditProfileModal, qui fait `await saveProfile(...)`, resterait bloqué
  // sur « Enregistrement… ».
  waiters: { resolve: () => void; reject: (reason: unknown) => void }[]
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(userId !== null)

  const pendingRef = useRef<PendingWrite>({ timer: null, accumulated: {}, waiters: [] })
  // Lu dans le callback différé : la valeur capturée à l'appel serait périmée.
  const profileRef = useRef<Profile | null>(null)
  profileRef.current = profile

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
            avatar: data.avatar,
            selectedFrame: data.selectedFrame,
            selectedTitle: data.selectedTitle,
            stats: data.stats,
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
  /*
   * Écriture débouncée à 500 ms. Les réconciliations de streak et de stats
   * partent souvent dans le même cycle de rendu ; en accumulant le patch on
   * fusionne ces rafales en un seul setDoc.
   */
  const saveProfile = useCallback(
    (update: ProfileUpdate) => {
      if (userId === null) {
        return Promise.reject(
          new Error("useProfile: impossible d'écrire un profil sans utilisateur connecté"),
        )
      }

      const pending = pendingRef.current
      Object.assign(pending.accumulated, update)

      if (pending.timer) clearTimeout(pending.timer)

      return new Promise<void>((resolve, reject) => {
        pending.waiters.push({ resolve, reject })

        pending.timer = setTimeout(async () => {
          const patch = { ...pending.accumulated }
          const waiters = pending.waiters

          pending.accumulated = {}
          pending.waiters = []
          pending.timer = null

          /*
           * createdAt n'est envoyé que si le profil n'existe pas encore.
           * merge: true ne préserve que les champs ABSENTS du payload : y
           * laisser createdAt en permanence le réécrirait à chaque appel, et
           * donc remettrait la date de création à zéro au premier renommage.
           */
          const payload: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined) continue
            // null → suppression du champ, plutôt qu'une valeur null en base.
            const nullable = (NULLABLE_FIELDS as readonly string[]).includes(key)
            payload[key] = value === null && nullable ? deleteField() : value
          }

          if (profileRef.current === null) {
            payload.createdAt = serverTimestamp() satisfies FieldValue
          }

          try {
            await setDoc(doc(db, 'users', userId, 'profile', 'main'), payload, { merge: true })
            for (const waiter of waiters) waiter.resolve()
          } catch (err) {
            for (const waiter of waiters) waiter.reject(err)
          }
        }, DEBOUNCE_MS)
      })
    },
    [userId],
  )

  return { profile, loading, saveProfile }
}
