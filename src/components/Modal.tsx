import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

// Pile des modales montées, dans l'ordre d'ouverture. La dernière poussée
// est au sommet et est la seule à réagir à Escape.
const modalStack: number[] = []

// Compteur plutôt que Math.random() : identifiants garantis uniques, et
// l'ordre des ids reflète l'ordre de montage, ce qui aide au débogage.
let modalCounter = 0

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
  /*
   * Ajout hors spec: onClose passe par une ref et l'effet de pile a des deps
   * vides. Avec [onClose] comme dans la spec, un onClose recréé à chaque rendu
   * (arrow inline) ferait dépiler puis re-empiler la modale : une modale du
   * dessous remonterait au sommet et intercepterait Escape à la place de celle
   * du dessus. Ici la position dans la pile ne dépend que du montage.
   */
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const id = ++modalCounter
    modalStack.push(id)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Ne réagit que si cette modale est au sommet de la pile.
      if (modalStack[modalStack.length - 1] !== id) return
      onCloseRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      const index = modalStack.indexOf(id)
      if (index !== -1) modalStack.splice(index, 1)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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
