const rooms = new Map()

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomCode() {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

function generateUniqueCode() {
  let code = randomCode()
  while (rooms.has(code)) {
    code = randomCode()
  }
  return code
}

let playerIdCounter = 0
function generatePlayerId() {
  playerIdCounter += 1
  return `p_${Date.now().toString(36)}${playerIdCounter}`
}

function createRoom() {
  const code = generateUniqueCode()
  const room = {
    code,
    hostSocketId: null,
    status: 'lobby',
    players: [],
    turnOrder: [],
    currentTurnIndex: 0,
    currentQuestionIndex: 0,
    questionDeck: [],
    assignedQuestions: {},
    currentQuestionTimer: null,
  }
  rooms.set(code, room)
  return room
}

function createPlayer(name) {
  return {
    id: generatePlayerId(),
    name,
    socketId: null,
    connected: true,
    drinksTotal: 0,
    joinedAt: Date.now(),
  }
}

function getRoom(code) {
  return rooms.get(code)
}

function findPlayerByName(room, name) {
  const normalized = name.trim().toLowerCase()
  return room.players.find((p) => p.name.trim().toLowerCase() === normalized)
}

function publicPlayers(room) {
  return room.players.map((p) => ({
    id: p.id,
    name: p.name,
    connected: p.connected,
    drinksTotal: p.drinksTotal,
  }))
}

export { rooms, createRoom, createPlayer, getRoom, findPlayerByName, publicPlayers }
