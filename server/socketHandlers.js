import {
  createRoom,
  createPlayer,
  getRoom,
  findPlayerByName,
  publicPlayers,
} from './rooms.js'
import {
  dealGame,
  getActivePlayerId,
  getCurrentQuestion,
  getCurrentPenalty,
  isLastTurn,
  rankStandings,
  penaltyToSips,
  PENALTY_LADDER,
  TIME_LIMIT_SECONDS,
  REVEAL_PAUSE_MS,
} from './game.js'

function buildCurrentTurnPayload(room) {
  if (room.status !== 'playing') return null
  const activePlayerId = getActivePlayerId(room)
  const activePlayer = room.players.find((p) => p.id === activePlayerId)
  const question = getCurrentQuestion(room)
  return {
    activePlayerId,
    activePlayerName: activePlayer ? activePlayer.name : null,
    questionNumber: room.currentQuestionIndex + 1,
    penalty: getCurrentPenalty(room),
    turnOrderPosition: room.currentTurnIndex + 1,
    totalPlayers: room.turnOrder.length,
    question: { text: question.text, options: question.options, category: question.category },
    timeLimitSeconds: TIME_LIMIT_SECONDS,
  }
}

function emitNextTurn(io, room) {
  const payload = buildCurrentTurnPayload(room)
  io.to(room.code).emit('next-turn', payload)
  startQuestionTimer(io, room)
}

function startQuestionTimer(io, room) {
  clearQuestionTimer(room)
  room.currentQuestionTimer = setTimeout(() => {
    resolveAnswer(io, room, null)
  }, TIME_LIMIT_SECONDS * 1000)
}

function clearQuestionTimer(room) {
  if (room.currentQuestionTimer) {
    clearTimeout(room.currentQuestionTimer)
    room.currentQuestionTimer = null
  }
}

function resolveAnswer(io, room, chosenIndex) {
  clearQuestionTimer(room)
  const activePlayerId = getActivePlayerId(room)
  const question = getCurrentQuestion(room)
  const correct = chosenIndex === question.correctIndex
  const questionNumber = room.currentQuestionIndex + 1
  const preAnswerPenalty = getCurrentPenalty(room)

  let turnEnding
  let newPenalty

  if (correct && room.currentQuestionIndex < 3) {
    room.currentQuestionIndex += 1
    newPenalty = PENALTY_LADDER[room.currentQuestionIndex]
    turnEnding = false
  } else if (correct) {
    // Correct on Q4 — free, turn ends.
    newPenalty = PENALTY_LADDER[4]
    turnEnding = true
  } else {
    // Wrong or timed out — drink whatever was in effect before this question.
    newPenalty = preAnswerPenalty
    turnEnding = true
  }

  io.to(room.code).emit('answer-result', {
    playerId: activePlayerId,
    chosenIndex,
    correctIndex: question.correctIndex,
    correct,
    newPenalty,
    turnEnding,
    questionNumber,
  })

  setTimeout(() => {
    if (turnEnding) {
      endTurn(io, room, correct ? { amount: 0, unit: 'sip' } : preAnswerPenalty)
    } else {
      emitNextTurn(io, room)
    }
  }, REVEAL_PAUSE_MS)
}

function endTurn(io, room, drinkPenalty) {
  const activePlayerId = getActivePlayerId(room)
  const player = room.players.find((p) => p.id === activePlayerId)
  const sips = penaltyToSips(drinkPenalty)
  player.drinksTotal += sips

  room.status = 'turn-summary'

  io.to(room.code).emit('turn-end', {
    playerId: player.id,
    playerName: player.name,
    drink: drinkPenalty,
    drinksTotal: player.drinksTotal,
    free: sips === 0,
    isLastTurn: isLastTurn(room),
  })
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join-room', ({ roomCode, name, role }) => {
      if (role === 'host') {
        let room
        if (roomCode) {
          room = getRoom(roomCode)
          if (!room) {
            socket.emit('error-message', { message: 'Room not found' })
            return
          }
        } else {
          room = createRoom()
        }
        room.hostSocketId = socket.id
        socket.data = { roomCode: room.code, role: 'host' }
        socket.join(room.code)
        socket.emit('room-joined', {
          roomCode: room.code,
          role: 'host',
          status: room.status,
          players: publicPlayers(room),
          currentTurn: buildCurrentTurnPayload(room),
        })
        return
      }

      // role === 'player'
      if (!roomCode || !name) {
        socket.emit('error-message', { message: 'Room code and name are required' })
        return
      }
      const room = getRoom(roomCode.toUpperCase())
      if (!room) {
        socket.emit('error-message', { message: 'Room not found' })
        return
      }

      const existing = findPlayerByName(room, name)
      let player
      if (existing) {
        if (existing.connected) {
          socket.emit('error-message', { message: 'That name is already taken in this room' })
          return
        }
        existing.socketId = socket.id
        existing.connected = true
        player = existing
      } else {
        if (room.status !== 'lobby') {
          socket.emit('error-message', { message: 'Game already in progress' })
          return
        }
        player = createPlayer(name.trim())
        player.socketId = socket.id
        room.players.push(player)
      }

      socket.data = { roomCode: room.code, role: 'player', playerId: player.id }
      socket.join(room.code)

      socket.emit('room-joined', {
        roomCode: room.code,
        role: 'player',
        playerId: player.id,
        status: room.status,
        players: publicPlayers(room),
        currentTurn: buildCurrentTurnPayload(room),
      })

      io.to(room.code).emit('player-joined', { players: publicPlayers(room) })
    })

    socket.on('start-game', () => {
      const { roomCode, role } = socket.data || {}
      if (role !== 'host') return
      const room = getRoom(roomCode)
      if (!room || room.status !== 'lobby' || room.players.length < 1) return

      dealGame(room)
      emitNextTurn(io, room)
    })

    socket.on('submit-answer', ({ chosenIndex }) => {
      const { roomCode, role, playerId } = socket.data || {}
      if (role !== 'player') return
      const room = getRoom(roomCode)
      if (!room || room.status !== 'playing') return
      const activePlayerId = getActivePlayerId(room)
      if (playerId !== activePlayerId) return
      const activePlayer = room.players.find((p) => p.id === activePlayerId)
      if (!activePlayer || activePlayer.socketId !== socket.id) return
      if (!room.currentQuestionTimer) return // already resolved (timeout or duplicate submit)

      resolveAnswer(io, room, chosenIndex)
    })

    socket.on('advance-turn', () => {
      const { roomCode, role } = socket.data || {}
      if (role !== 'host') return
      const room = getRoom(roomCode)
      if (!room) return

      if (isLastTurn(room)) {
        room.status = 'gameover'
        io.to(room.code).emit('game-over', { standings: rankStandings(room.players) })
        return
      }

      room.currentTurnIndex += 1
      room.currentQuestionIndex = 0
      room.status = 'playing'
      emitNextTurn(io, room)
    })

    socket.on('play-again', () => {
      const { roomCode, role } = socket.data || {}
      if (role !== 'host') return
      const room = getRoom(roomCode)
      if (!room) return

      room.status = 'lobby'
      room.turnOrder = []
      room.currentTurnIndex = 0
      room.currentQuestionIndex = 0
      room.questionDeck = []
      room.assignedQuestions = {}
      clearQuestionTimer(room)
      for (const p of room.players) p.drinksTotal = 0

      io.to(room.code).emit('player-joined', { players: publicPlayers(room) })
      io.to(room.hostSocketId).emit('room-joined', {
        roomCode: room.code,
        role: 'host',
        status: room.status,
        players: publicPlayers(room),
        currentTurn: null,
      })
    })

    socket.on('disconnect', () => {
      const { roomCode, role, playerId } = socket.data || {}
      if (!roomCode) return
      const room = getRoom(roomCode)
      if (!room) return

      if (role === 'host') {
        if (room.hostSocketId === socket.id) room.hostSocketId = null
        return
      }

      if (role === 'player') {
        const player = room.players.find((p) => p.id === playerId)
        if (player && player.socketId === socket.id) {
          player.connected = false
          player.socketId = null
          io.to(room.code).emit('player-joined', { players: publicPlayers(room) })
        }
      }
    })
  })
}
