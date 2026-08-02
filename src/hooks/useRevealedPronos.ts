import { useEffect, useRef, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import type { Match, Prono } from '../lib/types'
import { isMatchLocked } from '../lib/matchStatus'
import { db } from '../lib/firebase'

export type RevealedPronoState =
  | { status: 'pending' }
  | { status: 'absent' }
  | { status: 'ready'; prono: Prono }
  | { status: 'error' }

export function useRevealedPronos(
  matches: Match[],
  friendIds: string[],
  tick: number,
): Record<string, RevealedPronoState> {
  const [revealed, setRevealed] = useState<Record<string, RevealedPronoState>>({})
  const attempted = useRef<Set<string>>(new Set())

  useEffect(() => {
    const lockedIds = matches.filter(isMatchLocked).map((match) => match.id)
    const todo: { key: string; friendId: string; matchId: string }[] = []

    for (const friendId of friendIds) {
      for (const matchId of lockedIds) {
        const key = `${friendId}__${matchId}`
        if (attempted.current.has(key)) continue

        // Marqué avant le getDoc : une clé illisible ne doit pas être retentée
        // à chaque rendu, donc chaque seconde.
        attempted.current.add(key)
        todo.push({ key, friendId, matchId })
      }
    }

    // `tick` fait ré-entrer cet effect chaque seconde ; sans nouvelle
    // combinaison à tenter, on ressort ici sans le moindre appel réseau.
    if (todo.length === 0) return

    let cancelled = false

    setRevealed((prev) => {
      const next = { ...prev }
      for (const { key } of todo) next[key] = { status: 'pending' }
      return next
    })

    Promise.all(
      todo.map(async ({ key, friendId, matchId }): Promise<[string, RevealedPronoState]> => {
        try {
          const snap = await getDoc(doc(db, 'users', friendId, 'pronos', matchId))
          const data = snap.data()
          if (!snap.exists() || !data) return [key, { status: 'absent' }]

          const prono: Prono = {
            matchId: data.matchId,
            score: data.score,
            mvp: data.mvp,
            submittedAt: data.submittedAt?.toMillis() ?? Date.now(),
          }
          return [key, { status: 'ready', prono }]
        } catch (error) {
          console.error('[revealedPronos] fetch error', key, error)
          return [key, { status: 'error' }]
        }
      }),
    ).then((entries) => {
      if (cancelled) return

      setRevealed((prev) => {
        const next = { ...prev }
        for (const [key, state] of entries) next[key] = state
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [matches, friendIds, tick])

  return revealed
}
