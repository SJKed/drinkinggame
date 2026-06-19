export default function PlayerWaiting({ activePlayerName }) {
  return (
    <div className="player-screen player-waiting">
      <div className="waiting-spinner">⏳</div>
      <div className="waiting-text">
        {activePlayerName ? `It's ${activePlayerName}'s turn…` : 'Waiting for the game to start…'}
      </div>
    </div>
  )
}
