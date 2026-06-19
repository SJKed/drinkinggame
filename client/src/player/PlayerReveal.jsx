export default function PlayerReveal({ result, isMe }) {
  if (!isMe) {
    return (
      <div className="player-screen player-reveal-other">
        <div className="waiting-text">{result.correct ? 'They got it right!' : 'They got it wrong!'}</div>
      </div>
    )
  }

  return (
    <div className={`player-screen player-reveal ${result.correct ? 'reveal-safe' : 'reveal-drink'}`}>
      <div className="reveal-headline">{result.correct ? 'SAFE!' : 'DRINK UP!'}</div>
    </div>
  )
}
