import styles from './SplashScreen.module.css'

function SplashScreen() {
  return (
    <div className={styles.screen}>
      <span className={styles.mark}>
        Clutch<span className={styles.dot}>.</span>
      </span>
    </div>
  )
}

export default SplashScreen
