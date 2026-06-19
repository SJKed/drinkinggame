import { useEffect, useState } from 'react'
import PenaltyMeter from './PenaltyMeter.jsx'

const LABELS = ['A', 'B', 'C', 'D']

export default function HostReveal({ result, activePlayerName }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
    const t = setTimeout(() => setRevealed(true), 1300)
    return () => clearTimeout(t)
  }, [result])

  if (!revealed) {
    return (
      <div className="host-screen host-reveal host-reveal-suspense">
        <div className="suspense-text">Are you SURE, {activePlayerName}?</div>
        <div className="suspense-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  return (
    <div className={`host-screen host-reveal ${result.correct ? 'reveal-correct' : 'reveal-wrong'}`}>
      <div className="reveal-stamp">{result.correct ? 'CORRECT!' : 'WRONG!'}</div>
      <div className="reveal-correct-answer">
        The answer was: <strong>{LABELS[result.correctIndex]}</strong>
      </div>
      <PenaltyMeter penalty={result.newPenalty} />
      <div className="final-penalty-label">FINAL PENALTY</div>
    </div>
  )
}
