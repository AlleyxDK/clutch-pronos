import styles from './ErrorScreen.module.css'

interface ErrorScreenProps {
  message: string
}

function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className={styles.screen}>
      <p className={styles.message}>{message}</p>
    </div>
  )
}

export default ErrorScreen
