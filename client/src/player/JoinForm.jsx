import { useState } from 'react'

export default function JoinForm({ onJoin, errorMessage }) {
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!roomCode.trim() || !name.trim()) return
    onJoin(roomCode.trim().toUpperCase(), name.trim())
  }

  return (
    <div className="player-screen player-join">
      <h1 className="join-title">🍻 Big Sippa'</h1>
      <form className="join-form" onSubmit={submit}>
        <input
          className="join-input"
          placeholder="ROOM CODE"
          maxLength={4}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
        />
        <input
          className="join-input"
          placeholder="Your name"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errorMessage && <div className="join-error">{errorMessage}</div>}
        <button className="join-btn" type="submit">
          Join Game
        </button>
      </form>
    </div>
  )
}
