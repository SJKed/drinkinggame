export default function PlayerLeaderboard({ standings, myPlayerId }) {
  return (
    <div className="player-screen player-leaderboard">
      <div className="leaderboard-title">FINAL STANDINGS</div>
      <div className="leaderboard-list">
        {standings.map((s) => (
          <div
            key={s.playerId}
            className={`leaderboard-row ${s.playerId === myPlayerId ? 'leaderboard-me' : ''}`}
          >
            <span className="leaderboard-rank">#{s.rank}</span>
            <span className="leaderboard-name">{s.name}</span>
            <span className="leaderboard-drinks">{s.drinksTotal} sips</span>
          </div>
        ))}
      </div>
      <div className="waiting-text">Waiting for host to start a new game…</div>
    </div>
  )
}
