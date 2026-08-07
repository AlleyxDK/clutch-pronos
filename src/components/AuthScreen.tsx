import AuthForm from './AuthForm'
import styles from './AuthScreen.module.css'

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string, pseudo: string) => Promise<void>
  onSendReset: (email: string) => Promise<void>
}

/*
 * Ne porte plus que le layout plein écran : carte 440px, shimmer, centrage.
 * Toute la logique de formulaire vit dans AuthForm, partagé avec AuthModal.
 * Pas de onSuccess ici : App détecte le changement d'user et rend l'app.
 */
function AuthScreen({ onSignIn, onSignUp, onSendReset }: AuthScreenProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <AuthForm onSignIn={onSignIn} onSignUp={onSignUp} onSendReset={onSendReset} />
      </div>
    </div>
  )
}

export default AuthScreen
