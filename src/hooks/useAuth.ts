import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    /*
     * Ajout hors spec: signInAnonymously est appelé DANS le callback de
     * onAuthStateChanged, pas directement au montage. Au montage,
     * auth.currentUser vaut null même quand une session est déjà persistée
     * (Firebase la restaure de façon asynchrone) : signer tout de suite
     * créerait un nouveau compte anonyme à chaque refresh, exactement la
     * fuite d'UID que la vérification cherche à écarter.
     */
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setLoading(false)
        return
      }

      setUser(null)
      signInAnonymously(auth).catch((error) => {
        console.error('auth:signInAnonymously a échoué', error)
        setLoading(false)
      })
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}
