import { useCallback, useEffect, useState } from 'react'
import { socket } from '../socket.js'
import { useSocketEvent } from '../hooks/useSocketEvent.js'
import { getHostRoomCode, saveHostRoomCode } from '../shared/storage.js'
import HostLobby from './HostLobby.jsx'
import HostQuestion from './HostQuestion.jsx'
import HostReveal from './HostReveal.jsx'
import HostTurnSummary from './HostTurnSummary.jsx'
import HostLeaderboard from './HostLeaderboard.jsx'
import './host.css'

export default function HostView() {
  const [viewState, setViewState] = useState('connecting')
  const [roomCode, setRoomCode] = useState(null)
  const [players, setPlayers] = useState([])
  const [turn, setTurn] = useState(null)
  const [revealResult, setRevealResult] = useState(null)
  const [turnEnd, setTurnEnd] = useState(null)
  const [standings, setStandings] = useState([])

  useEffect(() => {
    const storedCode = getHostRoomCode()
    socket.emit('join-room', { roomCode: storedCode, name: null, role: 'host' })
  }, [])

  useSocketEvent(
    'room-joined',
    useCallback((payload) => {
      if (payload.role !== 'host') return
      setRoomCode(payload.roomCode)
      saveHostRoomCode(payload.roomCode)
      setPlayers(payload.players)
      if (payload.status === 'lobby') {
        setViewState('lobby')
      } else if (payload.status === 'playing' && payload.currentTurn) {
        setTurn(payload.currentTurn)
        setViewState('question')
      } else {
        setViewState('lobby')
      }
    }, [])
  )

  useSocketEvent(
    'player-joined',
    useCallback((payload) => setPlayers(payload.players), [])
  )

  useSocketEvent(
    'next-turn',
    useCallback((payload) => {
      setTurn(payload)
      setViewState('question')
    }, [])
  )

  useSocketEvent(
    'answer-result',
    useCallback((payload) => {
      setRevealResult(payload)
      setViewState('reveal')
    }, [])
  )

  useSocketEvent(
    'turn-end',
    useCallback((payload) => {
      setTurnEnd(payload)
      setViewState('turn-summary')
    }, [])
  )

  useSocketEvent(
    'game-over',
    useCallback((payload) => {
      setStandings(payload.standings)
      setViewState('leaderboard')
    }, [])
  )

  const onStartGame = useCallback(() => socket.emit('start-game'), [])
  const onAdvanceTurn = useCallback(() => socket.emit('advance-turn'), [])
  const onPlayAgain = useCallback(() => {
    socket.emit('play-again')
    setViewState('lobby')
  }, [])

  if (viewState === 'connecting') {
    return <div className="host-screen host-connecting">Connecting…</div>
  }
  if (viewState === 'lobby') {
    return <HostLobby roomCode={roomCode} players={players} onStartGame={onStartGame} />
  }
  if (viewState === 'question' && turn) {
    return <HostQuestion turn={turn} />
  }
  if (viewState === 'reveal' && revealResult) {
    return <HostReveal result={revealResult} activePlayerName={turn?.activePlayerName} />
  }
  if (viewState === 'turn-summary' && turnEnd) {
    return <HostTurnSummary turnEnd={turnEnd} onAdvanceTurn={onAdvanceTurn} />
  }
  if (viewState === 'leaderboard') {
    return <HostLeaderboard standings={standings} onPlayAgain={onPlayAgain} />
  }
  return <div className="host-screen host-connecting">Loading…</div>
}
