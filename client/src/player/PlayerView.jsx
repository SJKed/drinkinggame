import { useCallback, useEffect, useState } from 'react'
import { socket } from '../socket.js'
import { useSocketEvent } from '../hooks/useSocketEvent.js'
import PlayerWaiting from './PlayerWaiting.jsx'
import PlayerActiveQuestion from './PlayerActiveQuestion.jsx'
import PlayerReveal from './PlayerReveal.jsx'
import PlayerLeaderboard from './PlayerLeaderboard.jsx'
import './player.css'

export default function PlayerView({ initialPayload }) {
  const [myPlayerId] = useState(initialPayload.playerId)
  const [viewState, setViewState] = useState('waiting')
  const [turn, setTurn] = useState(initialPayload.currentTurn)
  const [revealResult, setRevealResult] = useState(null)
  const [standings, setStandings] = useState([])

  useEffect(() => {
    if (initialPayload.status === 'playing' && initialPayload.currentTurn) {
      const t = initialPayload.currentTurn
      setViewState(t.activePlayerId === myPlayerId ? 'active' : 'waiting')
    } else {
      setViewState('waiting')
    }
  }, [initialPayload, myPlayerId])

  useSocketEvent(
    'next-turn',
    useCallback(
      (payload) => {
        setTurn(payload)
        setViewState(payload.activePlayerId === myPlayerId ? 'active' : 'waiting')
      },
      [myPlayerId]
    )
  )

  useSocketEvent(
    'answer-result',
    useCallback(
      (payload) => {
        if (payload.playerId === myPlayerId) {
          setRevealResult(payload)
          setViewState('reveal')
        }
      },
      [myPlayerId]
    )
  )

  useSocketEvent(
    'turn-end',
    useCallback(() => {
      setViewState((prev) => (prev === 'reveal' ? 'waiting' : prev))
      setTurn(null)
    }, [])
  )

  useSocketEvent(
    'game-over',
    useCallback((payload) => {
      setStandings(payload.standings)
      setViewState('leaderboard')
    }, [])
  )

  useSocketEvent(
    'player-joined',
    useCallback(() => {}, [])
  )

  const onSubmit = useCallback((chosenIndex) => {
    socket.emit('submit-answer', { chosenIndex })
  }, [])

  if (viewState === 'active' && turn) {
    return <PlayerActiveQuestion turn={turn} onSubmit={onSubmit} />
  }
  if (viewState === 'reveal' && revealResult) {
    return <PlayerReveal result={revealResult} isMe />
  }
  if (viewState === 'leaderboard') {
    return <PlayerLeaderboard standings={standings} myPlayerId={myPlayerId} />
  }
  return <PlayerWaiting activePlayerName={turn?.activePlayerName} />
}
