import { useCallback, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /*
   * Observateur pur : plus aucune connexion automatique. Les sessions
   * anonymes déjà persistées sont restaurées par Firebase, mais on n'en
   * crée plus de nouvelles — elles n'existent que pour être converties.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string, pseudo: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    // Écrit dans la foulée pour éviter l'état intermédiaire « connecté mais
    // sans pseudo », qui renverrait l'utilisateur sur l'onboarding.
    await setDoc(doc(db, 'users', cred.user.uid, 'profile', 'main'), {
      pseudo: pseudo.trim(),
      createdAt: serverTimestamp(),
    })

    return cred.user
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  const linkAnonymousToEmail = useCallback(async (email: string, password: string) => {
    const current = auth.currentUser
    if (!current || !current.isAnonymous) {
      throw new Error('Compte déjà lié à un email')
    }

    // Le UID est conservé : pronos, ligues et profil restent en place.
    const credential = EmailAuthProvider.credential(email, password)
    const result = await linkWithCredential(current, credential)

    return result.user
  }, [])

  return { user, loading, signUp, signIn, signOut, sendPasswordReset, linkAnonymousToEmail }
}
