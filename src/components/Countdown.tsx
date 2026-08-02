import { useEffect, useState } from 'react'
import styles from './Countdown.module.css'

interface CountdownProps {
  targetTime: number
}

interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function remainingFrom(targetTime: number): Remaining {
  const totalSeconds = Math.floor(Math.max(0, targetTime - Date.now()) / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function Countdown({ targetTime }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => remainingFrom(targetTime))

  useEffect(() => {
    setRemaining(remainingFrom(targetTime))
    const intervalId = setInterval(() => setRemaining(remainingFrom(targetTime)), 1000)

    return () => clearInterval(intervalId)
  }, [targetTime])

  const boxes = [
    { label: 'Jours', value: remaining.days },
    { label: 'Heures', value: remaining.hours },
    { label: 'Min', value: remaining.minutes },
    { label: 'Sec', value: remaining.seconds },
  ]

  return (
    <div className={styles.countdown}>
      {boxes.map((box) => (
        <div key={box.label} className={styles.box}>
          <span className={styles.value}>{String(box.value).padStart(2, '0')}</span>
          <span className={styles.label}>{box.label}</span>
        </div>
      ))}
    </div>
  )
}

export default Countdown
