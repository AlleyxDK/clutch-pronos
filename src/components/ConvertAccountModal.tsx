import { useState } from 'react'
import { friendlyAuthError } from '../lib/authErrors'
import Modal from './Modal'
import styles from './ConvertAccountModal.module.css'

interface ConvertAccountModalProps {
  onSubmit: (email: string, password: string) => Promise<void>
  onClose: () => void
}

function ConvertAccountModal({ onSubmit, onClose }: ConvertAccountModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    email !== '' && password !== '' && confirmPassword !== '' && password === confirmPassword

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(email, password)
      onClose()
    } catch (err) {
      setError(friendlyAuthError(err))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Créer un vrai compte"
      subtitle="Tes pronos et tes ligues seront conservés. Tu pourras te connecter depuis n'importe quel appareil."
      onClose={onClose}
      maxWidth="480px"
    >
      <div className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          type="email"
          placeholder="ton@email.com"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Mot de passe</span>
        <input
          className={styles.input}
          type="password"
          placeholder="Au moins 6 caractères"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Confirme le mot de passe</span>
        <input
          className={styles.input}
          type="password"
          placeholder="Le même, pour être sûr"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) handleSubmit()
          }}
        />
      </div>

      {error !== null && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Création...' : 'Créer le compte'}
        </button>
      </div>
    </Modal>
  )
}

export default ConvertAccountModal
