import { useEffect, useState } from 'react'
import PenaltyMeter from './PenaltyMeter.jsx'

const LABELS = ['A', 'B', 'C', 'D']

export default function HostQuestion({ turn }) {
  const [timeLeft, setTimeLeft] = useState(turn.timeLimitSeconds)

  useEffect(() => {
    setTimeLeft(turn.timeLimitSeconds)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      setTimeLeft(Math.max(0, turn.timeLimitSeconds - elapsed))
    }, 100)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn.activePlayerId, turn.questionNumber])

  const pct = (timeLeft / turn.timeLimitSeconds) * 100

  return (
    <div className="host-screen host-question">
      <div className="host-question-top">
        <div className="host-question-player">{turn.activePlayerName}'s Turn</div>
        <div className="host-question-meta">
          Player {turn.turnOrderPosition} of {turn.totalPlayers} · Question {turn.questionNumber} of 4
        </div>
      </div>

      <PenaltyMeter penalty={turn.penalty} />
      <div className="final-penalty-label">FINAL PENALTY</div>

      <div className="host-timer-bar">
        <div className="host-timer-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="host-question-text">{turn.question.text}</div>

      <div className="host-options-grid">
        {turn.question.options.map((opt, idx) => (
          <div key={idx} className={`host-option host-option-${LABELS[idx].toLowerCase()}`}>
            <span className="host-option-label">{LABELS[idx]}</span>
            <span className="host-option-text">{opt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
