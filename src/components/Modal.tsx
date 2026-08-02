import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  subtitle?: string
}

function Modal({ title, subtitle, onClose, children }: ModalProps) {
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
      <div className={styles.card}>
        <button type="button" className={styles.close} onClick={onClose}>
          ×
        </button>

        <h2 className={styles.title}>{title}</h2>
        {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}

        {children}
      </div>
    </div>
  )
}

export default Modal
