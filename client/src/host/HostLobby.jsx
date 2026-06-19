export default function HostLobby({ roomCode, players, onStartGame }) {
  return (
    <div className="host-screen host-lobby">
      <div className="host-lobby-code-label">ROOM CODE</div>
      <div className="host-lobby-code">{roomCode || '----'}</div>
      <div className="host-lobby-sub">Join at this device's address, enter the code and your name</div>

      <div className="host-lobby-players">
        {players.length === 0 && <div className="host-lobby-empty">Waiting for players to join…</div>}
        {players.map((p) => (
          <div key={p.id} className={`host-lobby-player ${p.connected ? '' : 'disconnected'}`}>
            <span className="dot" />
            {p.name}
          </div>
        ))}
      </div>

      <button className="host-btn host-btn-primary" onClick={onStartGame} disabled={players.length < 1}>
        Start Game
      </button>
    </div>
  )
}
