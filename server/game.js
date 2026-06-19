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

// Question N within a turn is always dealt from tier N — index-matched to
// PENALTY_LADDER so the questions get harder exactly as the stakes rise.
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'expert']
export const QUESTIONS_PER_PLAYER = DIFFICULTY_ORDER.length
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
  const needed = room.turnOrder.length

  // One shuffled deck per difficulty tier, drawn from independently so every
  // player's question N always comes from tier N (no cross-tier repeats possible).
  const poolsByTier = {}
  for (const tier of DIFFICULTY_ORDER) {
    let pool = shuffle(QUESTIONS.filter((q) => q.difficulty === tier).map((q) => q.id))
    if (pool.length < needed) {
      // Not enough unique questions in this tier for this many players —
      // reshuffle and allow wraparound reuse rather than crash. Logged, not silent.
      console.warn(
        `[game] Only ${pool.length} '${tier}' questions for ${needed} players; reusing questions.`
      )
      const base = pool
      while (pool.length < needed) {
        pool = pool.concat(shuffle(base))
      }
    }
    poolsByTier[tier] = pool
  }

  room.assignedQuestions = {}
  for (const playerId of room.turnOrder) {
    room.assignedQuestions[playerId] = DIFFICULTY_ORDER.map((tier) => poolsByTier[tier].splice(0, 1)[0])
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
