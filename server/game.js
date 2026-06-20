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

// Spotify-style "don't repeat recently played" memory: a per-tier queue of
// question ids dealt across ALL rooms/games on this server process (not
// per-room — the goal is to stop the same questions resurfacing across
// back-to-back games, same as a shuffle that won't replay a recent track).
// Capped at half of each tier's size so there's always a majority of fresh
// questions to draw from, and it ages out automatically as new ones are added.
const RECENT_HISTORY_RATIO = 0.5
const recentlyUsedByTier = Object.fromEntries(DIFFICULTY_ORDER.map((tier) => [tier, []]))

function markRecentlyUsed(tier, ids) {
  const queue = recentlyUsedByTier[tier]
  queue.push(...ids)
  const tierSize = QUESTIONS.filter((q) => q.difficulty === tier).length
  const maxHistory = Math.floor(tierSize * RECENT_HISTORY_RATIO)
  while (queue.length > maxHistory) queue.shift()
}

function buildTierDeck(tier, needed) {
  const allIds = QUESTIONS.filter((q) => q.difficulty === tier).map((q) => q.id)
  const recentSet = new Set(recentlyUsedByTier[tier])
  const fresh = allIds.filter((id) => !recentSet.has(id))

  let deck = fresh
  if (fresh.length < needed) {
    // Not enough never-recently-used questions for this many players — top
    // up with the least-recently-used ones first (oldest in the queue = safest to repeat).
    const seen = new Set(fresh)
    const oldestFirst = recentlyUsedByTier[tier].filter((id) => !seen.has(id))
    for (const id of oldestFirst) {
      if (deck.length >= needed) break
      if (!seen.has(id)) {
        deck.push(id)
        seen.add(id)
      }
    }
  }

  deck = shuffle(deck)
  if (deck.length < needed) {
    // Tier genuinely doesn't have enough unique questions for this many
    // players at all — reshuffle and allow wraparound reuse rather than crash.
    console.warn(`[game] Only ${deck.length} '${tier}' questions available for ${needed} players; reusing questions.`)
    const base = deck.length ? deck : shuffle(allIds)
    while (deck.length < needed) deck = deck.concat(shuffle(base))
  }
  return deck
}

export function dealGame(room) {
  room.turnOrder = shuffle(room.players.map((p) => p.id))
  const needed = room.turnOrder.length

  // One deck per difficulty tier, biased away from recently-used questions,
  // drawn from independently so every player's question N always comes from
  // tier N (no cross-tier repeats possible).
  const poolsByTier = {}
  for (const tier of DIFFICULTY_ORDER) {
    poolsByTier[tier] = buildTierDeck(tier, needed)
  }

  const dealtByTier = Object.fromEntries(DIFFICULTY_ORDER.map((tier) => [tier, []]))
  room.assignedQuestions = {}
  for (const playerId of room.turnOrder) {
    room.assignedQuestions[playerId] = DIFFICULTY_ORDER.map((tier) => {
      const questionId = poolsByTier[tier].splice(0, 1)[0]
      dealtByTier[tier].push(questionId)
      return questionId
    })
  }

  for (const tier of DIFFICULTY_ORDER) {
    markRecentlyUsed(tier, dealtByTier[tier])
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
