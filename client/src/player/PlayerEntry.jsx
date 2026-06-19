import { useCallback, useEffect, useState } from 'react'
import { socket } from '../socket.js'
import { useSocketEvent } from '../hooks/useSocketEvent.js'
import { getPlayerSession, savePlayerSession, clearPlayerSession } from '../shared/storage.js'
import JoinForm from './JoinForm.jsx'
import PlayerView from './PlayerView.jsx'

export default function PlayerEntry() {
  const [joinedPayload, setJoinedPayload] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [attemptedAutoJoin, setAttemptedAutoJoin] = useState(false)

  useEffect(() => {
    const session = getPlayerSession()
    if (session) {
      socket.emit('join-room', { roomCode: session.roomCode, name: session.name, role: 'player' })
    }
    setAttemptedAutoJoin(true)
  }, [])

  useSocketEvent(
    'room-joined',
    useCallback((payload) => {
      if (payload.role !== 'player') return
      setJoinedPayload(payload)
      setErrorMessage(null)
    }, [])
  )

  useSocketEvent(
    'error-message',
    useCallback((payload) => {
      setErrorMessage(payload.message)
      clearPlayerSession()
    }, [])
  )

  const onJoin = useCallback((roomCode, name) => {
    setErrorMessage(null)
    socket.emit('join-room', { roomCode, name, role: 'player' })
    savePlayerSession(roomCode, name)
  }, [])

  if (!attemptedAutoJoin) {
    return <div className="player-screen player-connecting">Connecting…</div>
  }

  if (joinedPayload) {
    return <PlayerView initialPayload={joinedPayload} />
  }

  return <JoinForm onJoin={onJoin} errorMessage={errorMessage} />
}
