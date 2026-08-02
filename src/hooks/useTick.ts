import { useEffect, useState } from 'react'

export function useTick(intervalMs: number): number {
  const [tick, setTick] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return tick
}
