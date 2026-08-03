import { useCallback, useEffect, useState } from 'react'
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import type { CompetitionId, League } from '../lib/types'
import { db } from '../lib/firebase'
import { generateLeagueCode } from '../lib/leagueCode'

function toLeague(id: string, data: DocumentData): League {
  return {
    id,
    name: data.name,
    code: data.code,
    creatorId: data.creatorId,
    memberIds: data.memberIds ?? [],
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    /*
     * Ajout hors spec: mapping du champ competitionIds, absent de la spec.
     * Sans lui le champ serait écrit en base mais ne remonterait jamais à
     * l'app, et toutes les ligues retomberaient sur « toutes compétitions ».
     * Laissé undefined si absent : c'est ce que leagueCompetitionIds attend.
     */
    competitionIds: data.competitionIds,
  }
}

export function useLeagues(userId: string | null) {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(userId !== null)

  useEffect(() => {
    if (userId === null) {
      setLeagues([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = onSnapshot(
      query(collection(db, 'leagues'), where('memberIds', 'array-contains', userId)),
      (snapshot) => {
        const next = snapshot.docs.map((entry) => toLeague(entry.id, entry.data()))
        next.sort((a, b) => b.createdAt - a.createdAt)

        setLeagues(next)
        setLoading(false)
      },
      (error) => {
        console.error('useLeagues: abonnement Firestore échoué', error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userId])

  const createLeague = useCallback(
    async (name: string, competitionIds: CompetitionId[]): Promise<League> => {
      if (userId === null) {
        throw new Error("useLeagues: impossible de créer une ligue sans utilisateur connecté")
      }

      const trimmed = name.trim()
      if (trimmed.length < 2) throw new Error('Le nom doit faire au moins 2 caractères.')
      if (trimmed.length > 40) throw new Error('Le nom ne peut pas dépasser 40 caractères.')
      if (competitionIds.length === 0) throw new Error('Sélectionne au moins une compétition')

      // L'ID est pré-généré côté client pour pouvoir le référencer depuis
      // codes/{code} dans le même batch.
      const leagueRef = doc(collection(db, 'leagues'))

      let code = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateLeagueCode()
        const clash = await getDoc(doc(db, 'codes', candidate))
        if (!clash.exists()) {
          code = candidate
          break
        }
      }
      if (code === '') throw new Error('Impossible de générer un code unique. Réessaie.')

      const batch = writeBatch(db)
      batch.set(leagueRef, {
        name: trimmed,
        code,
        creatorId: userId,
        memberIds: [userId],
        createdAt: serverTimestamp(),
        competitionIds,
      })
      batch.set(doc(db, 'codes', code), {
        leagueId: leagueRef.id,
        createdAt: serverTimestamp(),
      })
      await batch.commit()

      return {
        id: leagueRef.id,
        name: trimmed,
        code,
        creatorId: userId,
        memberIds: [userId],
        competitionIds,
        /*
         * Ajout hors spec: createdAt local. serverTimestamp() n'est qu'un
         * marqueur tant que le serveur n'a pas répondu, il n'est pas lisible
         * ici. onSnapshot livrera la vraie valeur juste après.
         */
        createdAt: Date.now(),
      }
    },
    [userId],
  )

  const joinLeague = useCallback(
    async (code: string): Promise<{ id: string }> => {
      if (userId === null) {
        throw new Error("useLeagues: impossible de rejoindre une ligue sans utilisateur connecté")
      }

      const normalized = code.trim().toUpperCase()
      if (normalized.length !== 6) throw new Error('Le code doit faire exactement 6 caractères.')

      const codeSnap = await getDoc(doc(db, 'codes', normalized))
      if (!codeSnap.exists()) throw new Error('Aucune ligue avec ce code')

      const leagueId = codeSnap.data().leagueId as string
      const leagueRef = doc(db, 'leagues', leagueId)

      try {
        await updateDoc(leagueRef, { memberIds: arrayUnion(userId) })
      } catch (err) {
        // L'écriture peut être refusée parce qu'on est déjà membre. Dans ce cas
        // la lecture de la ligue passe (les règles l'autorisent aux membres) et
        // il n'y a rien à signaler. Sinon, on remonte l'erreur d'origine.
        const existing = await getDoc(leagueRef).catch(() => null)
        if (!existing?.exists()) throw err
      }

      // La ligue arrivera dans `leagues` via onSnapshot dès qu'on en est membre.
      return { id: leagueId }
    },
    [userId],
  )

  return { leagues, loading, createLeague, joinLeague }
}
