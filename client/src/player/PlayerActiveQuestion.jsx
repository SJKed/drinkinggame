import { useState } from 'react'
import TimerBar from './TimerBar.jsx'

const LABELS = ['A', 'B', 'C', 'D']
const COLORS = ['a', 'b', 'c', 'd']

export default function PlayerActiveQuestion({ turn, onSubmit }) {
  const [locked, setLocked] = useState(null)

  const tap = (idx) => {
    if (locked !== null) return
    setLocked(idx)
    onSubmit(idx)
  }

  return (
    <div className="player-screen player-active">
      <TimerBar seconds={turn.timeLimitSeconds} resetKey={`${turn.activePlayerId}-${turn.questionNumber}`} />
      <div className="active-question-text">{turn.question.text}</div>
      <div className="tile-grid">
        {turn.question.options.map((opt, idx) => (
          <button
            key={idx}
            className={`tile tile-${COLORS[idx]} ${locked === idx ? 'tile-locked' : ''} ${
              locked !== null && locked !== idx ? 'tile-dimmed' : ''
            }`}
            onClick={() => tap(idx)}
            disabled={locked !== null}
          >
            <span className="tile-label">{LABELS[idx]}</span>
            <span className="tile-text">{opt}</span>
          </button>
        ))}
      </div>
      {locked !== null && <div className="locked-banner">Locked in!</div>}
    </div>
  )
}
