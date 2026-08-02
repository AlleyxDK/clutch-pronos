import styles from './FormDots.module.css'

interface FormDotsProps {
  form: string
}

function FormDots({ form }: FormDotsProps) {
  return (
    <span className={styles.form}>
      {form.split('').map((result, index) => (
        <span
          key={index}
          className={`${styles.pip} ${result === 'W' ? styles.win : styles.loss}`}
        />
      ))}
    </span>
  )
}

export default FormDots
