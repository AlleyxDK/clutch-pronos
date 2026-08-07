import styles from './ConversionBanner.module.css'

interface ConversionBannerProps {
  onOpenConvert: () => void
}

function ConversionBanner({ onOpenConvert }: ConversionBannerProps) {
  return (
    <div className={styles.banner}>
      Compte anonyme —{' '}
      <button type="button" className={styles.link} onClick={onOpenConvert}>
        Créer un vrai compte
      </button>{' '}
      pour ne pas perdre tes pronos.
    </div>
  )
}

export default ConversionBanner
