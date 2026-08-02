import { useState } from 'react'
import styles from './Onboarding.module.css'

interface OnboardingProps {
  onSubmit: (pseudo: string) => Promise<void>
}

function Onboarding({ onSubmit }: OnboardingProps) {
  const [pseudo, setPseudo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = pseudo.trim()

    if (trimmed.length < 2) {
      setError('Au moins 2 caractères.')
      return
    }
    if (trimmed.length > 20) {
      setError('20 caractères maximum.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(trimmed)
      // onSnapshot dans useProfile mettra à jour l'état, App re-render.
    } catch (err) {
      console.error("Erreur d'écriture du profil :", err)
      setError("L'écriture a échoué. Réessaie.")
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.logo}>
          Clutch<span className={styles.logoDot}>.</span>
        </span>

        <h2 className={styles.title}>Bienvenue.</h2>
        <p className={styles.subtitle}>
          Choisis un pseudo. C'est ce que tes potes verront dans le classement.
        </p>

        <input
          className={styles.input}
          type="text"
          placeholder="Ton pseudo"
          maxLength={20}
          autoFocus
          value={pseudo}
          onChange={(event) => {
            setPseudo(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSubmit()
          }}
        />

        {error !== null && <p className={styles.error}>{error}</p>}

        <button
          type="button"
          className={styles.button}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Création...' : 'Créer mon compte'}
        </button>
      </div>
    </div>
  )
}

export default Onboarding
