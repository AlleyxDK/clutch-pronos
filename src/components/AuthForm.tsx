import { useEffect, useState } from 'react'
import { friendlyAuthError } from '../lib/authErrors'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string, pseudo: string) => Promise<void>
  onSendReset: (email: string) => Promise<void>
  onSuccess?: () => void
  initialMode?: 'signin' | 'signup'
  contextMessage?: string
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

function AuthForm({
  onSignIn,
  onSignUp,
  onSendReset,
  onSuccess,
  initialMode = 'signup',
  contextMessage,
}: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResetInline, setShowResetInline] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Retour automatique au formulaire de connexion après confirmation d'envoi.
  useEffect(() => {
    if (!resetSent) return

    const id = setTimeout(() => {
      setShowResetInline(false)
      setResetSent(false)
      setMode('signin')
    }, 3000)

    return () => clearTimeout(id)
  }, [resetSent])

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next)
    setError(null)
    setShowResetInline(false)
  }

  const handleSubmit = async () => {
    if (!EMAIL_RE.test(email)) {
      setError('Email invalide')
      return
    }
    if (password.length < 6) {
      setError('Mot de passe trop faible (au moins 6 caractères).')
      return
    }

    const trimmedPseudo = pseudo.trim()
    if (mode === 'signup') {
      if (trimmedPseudo.length < 2) {
        setError('Le pseudo doit faire au moins 2 caractères.')
        return
      }
      if (trimmedPseudo.length > 20) {
        setError('Le pseudo ne peut pas dépasser 20 caractères.')
        return
      }
    }

    setSubmitting(true)
    setError(null)

    try {
      if (mode === 'signup') {
        await onSignUp(email, password, trimmedPseudo)
      } else {
        await onSignIn(email, password)
      }
      // En plein écran, onAuthStateChanged fait basculer App et ce composant
      // démonte de lui-même. En modale, c'est onSuccess qui la referme.
      onSuccess?.()
    } catch (err) {
      setError(friendlyAuthError(err))
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!EMAIL_RE.test(email)) {
      setError('Email invalide')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSendReset(email)
      setResetSent(true)
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <span className={styles.logo}>
        Clutch<span className={styles.logoDot}>.</span>
      </span>

      {contextMessage !== undefined && (
        <p className={styles.contextMessage}>{contextMessage}</p>
      )}

      {showResetInline ? (
        <>
          <h2 className={styles.title}>Réinitialiser ton mot de passe</h2>

          {resetSent ? (
            <p className={styles.success}>Email envoyé ! Vérifie ta boîte.</p>
          ) : (
            <>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Ton email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReset()
                  }}
                />
              </div>

              {error !== null && <p className={styles.error}>{error}</p>}

              <button
                type="button"
                className={styles.btnPrimary}
                disabled={submitting}
                onClick={handleReset}
              >
                {submitting ? 'Envoi...' : 'Envoyer le lien'}
              </button>

              <div className={styles.links}>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    setShowResetInline(false)
                    setError(null)
                  }}
                >
                  ← Retour
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <h2 className={styles.title}>
            {mode === 'signup' ? 'Créer un compte' : 'Connexion'}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'signup'
              ? 'Rejoins tes potes sur Clutch.'
              : 'Retrouve tes ligues et tes pronos.'}
          </p>

          <div className={styles.field}>
            <input
              className={styles.input}
              type="email"
              placeholder="Ton email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />
          </div>

          {mode === 'signup' && (
            <div className={styles.field}>
              <input
                className={styles.input}
                type="text"
                placeholder="Ton pseudo"
                maxLength={20}
                value={pseudo}
                onChange={(e) => {
                  setPseudo(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
              />
            </div>
          )}

          <div className={styles.field}>
            <input
              className={styles.input}
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />
          </div>

          {error !== null && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={styles.btnPrimary}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? 'Un instant...'
              : mode === 'signup'
                ? 'Créer mon compte'
                : 'Se connecter'}
          </button>

          <div className={styles.links}>
            {mode === 'signup' ? (
              <button
                type="button"
                className={styles.link}
                onClick={() => switchMode('signin')}
              >
                Déjà un compte ? Se connecter
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    setShowResetInline(true)
                    setError(null)
                  }}
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => switchMode('signup')}
                >
                  Pas encore de compte ? Créer un compte
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default AuthForm
