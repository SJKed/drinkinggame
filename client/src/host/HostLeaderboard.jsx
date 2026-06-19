export default function HostLeaderboard({ standings, onPlayAgain }) {
  return (
    <div className="host-screen host-leaderboard">
      <div className="leaderboard-title">FINAL STANDINGS</div>
      <div className="leaderboard-list">
        {standings.map((s) => (
          <div key={s.playerId} className={`leaderboard-row ${s.rank === 1 ? 'leaderboard-winner' : ''}`}>
            <span className="leaderboard-rank">#{s.rank}</span>
            <span className="leaderboard-name">{s.name}</span>
            <span className="leaderboard-drinks">{s.drinksTotal} sips</span>
          </div>
        ))}
      </div>
      <button className="host-btn host-btn-primary" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  )
}
