import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  subtitle?: string
  /* Ajout hors spec: largeur optionnelle. La coquille était figée à 640px et
     ConvertAccountModal en demande 480. Par défaut inchangé pour les autres. */
  maxWidth?: string
}

function Modal({ title, subtitle, onClose, children, maxWidth }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className={styles.overlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={styles.card} style={maxWidth ? { maxWidth } : undefined}>
        <button type="button" className={styles.close} onClick={onClose}>
          ×
        </button>

        {/* Ajout hors spec: AuthModal passe title="" pour ne pas doubler le
            titre interne de AuthForm. Un h2 vide laisserait sa margin-bottom. */}
        {title !== '' && <h2 className={styles.title}>{title}</h2>}
        {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}

        {children}
      </div>
    </div>
  )
}

export default Modal
