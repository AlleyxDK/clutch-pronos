import Modal from './Modal'
import AuthForm from './AuthForm'

interface AuthModalProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string, pseudo: string) => Promise<void>
  onSendReset: (email: string) => Promise<void>
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  contextMessage?: string
}

/*
 * Ajout hors spec: pas de AuthModal.module.css. Ce composant n'ajoute aucun
 * style — la coquille vient de Modal, le contenu de AuthForm. Un module CSS
 * vide serait un fichier mort de plus.
 */
function AuthModal({
  onSignIn,
  onSignUp,
  onSendReset,
  onClose,
  initialMode,
  contextMessage,
}: AuthModalProps) {
  return (
    // title="" pour ne pas doubler le logo et le titre internes de AuthForm.
    <Modal title="" onClose={onClose} maxWidth="440px">
      <AuthForm
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onSendReset={onSendReset}
        onSuccess={onClose}
        initialMode={initialMode}
        contextMessage={contextMessage}
      />
    </Modal>
  )
}

export default AuthModal
