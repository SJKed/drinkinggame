import { useEffect, useState } from 'react'

export default function TimerBar({ seconds, resetKey }) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    setTimeLeft(seconds)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      setTimeLeft(Math.max(0, seconds - elapsed))
    }, 100)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const pct = (timeLeft / seconds) * 100

  return (
    <div className="timer-bar">
      <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
