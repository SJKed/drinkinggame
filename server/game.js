import { QUESTIONS } from './questions.js'

// Penalty ladder is data, not a formula, to preserve the exact mixed-unit
// sequence: starting penalty is a shot, then it steps DOWN through sips.
export const PENALTY_LADDER = [
  { amount: 1, unit: 'shot' },
  { amount: 3, unit: 'sip' },
  { amount: 2, unit: 'sip' },
  { amount: 1, unit: 'sip' },
  { amount: 0, unit: 'sip' },
]

// Used only to give cumulative leaderboard totals a single comparable unit.
// Per-turn display always uses the real units above.
export const SHOT_IN_SIPS = 3

export const QUESTIONS_PER_PLAYER = 4
export const TIME_LIMIT_SECONDS = 15
export const REVEAL_PAUSE_MS = 1500

function shuffle(array) {
  const result = array.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function penaltyToSips(penalty) {
  return penalty.unit === 'shot' ? penalty.amount * SHOT_IN_SIPS : penalty.amount
}

export function dealGame(room) {
  room.turnOrder = shuffle(room.players.map((p) => p.id))

  let pool = shuffle(QUESTIONS.map((q) => q.id))
  const needed = room.turnOrder.length * QUESTIONS_PER_PLAYER
  if (needed > pool.length) {
    // Not enough unique questions for this many players — reshuffle and
    // allow wraparound reuse rather than crash. Logged, not silent.
    console.warn(
      `[game] Only ${pool.length} questions for ${room.turnOrder.length} players (need ${needed}); reusing questions.`
    )
    while (pool.length < needed) {
      pool = pool.concat(shuffle(QUESTIONS.map((q) => q.id)))
    }
  }

  room.questionDeck = pool
  room.assignedQuestions = {}
  for (const playerId of room.turnOrder) {
    room.assignedQuestions[playerId] = room.questionDeck.splice(0, QUESTIONS_PER_PLAYER)
  }

  room.currentTurnIndex = 0
  room.currentQuestionIndex = 0
  room.status = 'playing'
}

export function getActivePlayerId(room) {
  return room.turnOrder[room.currentTurnIndex]
}

export function getCurrentQuestion(room) {
  const playerId = getActivePlayerId(room)
  const questionId = room.assignedQuestions[playerId][room.currentQuestionIndex]
  return QUESTIONS.find((q) => q.id === questionId)
}

export function getCurrentPenalty(room) {
  return PENALTY_LADDER[room.currentQuestionIndex]
}

export function isLastTurn(room) {
  return room.currentTurnIndex >= room.turnOrder.length - 1
}

export function rankStandings(players) {
  const sorted = players.slice().sort((a, b) => a.drinksTotal - b.drinksTotal)
  const standings = []
  let rank = 0
  let prevTotal = null
  sorted.forEach((p, idx) => {
    if (prevTotal === null || p.drinksTotal !== prevTotal) {
      rank = idx + 1
      prevTotal = p.drinksTotal
    }
    standings.push({ playerId: p.id, name: p.name, drinksTotal: p.drinksTotal, rank })
  })
  return standings
}
