import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import type { Match } from '../lib/types'
import { db } from '../lib/firebase'

function toMatch(id: string, data: DocumentData): Match {
  return {
    id,
    competition: data.competition,
    tournament: data.tournament,
    stage: data.stage,
    bo: data.bo,
    team_a: data.team_a,
    team_b: data.team_b,
    // start_time est stocké en Timestamp Firestore, le type Match attend des ms.
    start_time: data.start_time?.toMillis() ?? 0,
    mvps: data.mvps ?? [],
    /*
     * Ajout hors spec: mapping du champ result, absent de la spec. Sans lui le
     * résultat écrit ne remonterait jamais à l'UI, et result.submittedAt
     * resterait un Timestamp là où MatchResult attend un number.
     */
    result: data.result
      ? {
          score: data.result.score,
          mvp: data.result.mvp,
          submittedAt: data.result.submittedAt?.toMillis() ?? Date.now(),
          autoResolved: data.result.autoResolved === true,
          aggregates: {
            scoreCounts: data.result.aggregates?.scoreCounts ?? {},
            mvpCounts: data.result.aggregates?.mvpCounts ?? {},
            totalPronos: data.result.aggregates?.totalPronos ?? 0,
          },
        }
      : undefined,
  }
}

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'matches'),
      (snapshot) => {
        const next = snapshot.docs.map((entry) => toMatch(entry.id, entry.data()))
        next.sort((a, b) => a.start_time - b.start_time)

        setMatches(next)
        setLoading(false)
      },
      (error) => {
        console.error('useMatches: abonnement Firestore échoué', error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { matches, loading }
}
