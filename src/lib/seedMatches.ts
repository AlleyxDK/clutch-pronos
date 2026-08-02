import { Timestamp, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { MATCHES_SEED } from './matchesSeed'

export async function seedMatchesToFirestore(): Promise<void> {
  console.log(`seed: écriture de ${MATCHES_SEED.length} matches…`)

  for (const match of MATCHES_SEED) {
    await setDoc(
      doc(db, 'matches', match.id),
      { ...match, start_time: Timestamp.fromMillis(match.start_time) },
      { merge: true },
    )
    console.log(`seed: ${match.id} écrit`)
  }

  console.log('seed: terminé')
}
