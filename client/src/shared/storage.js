const PLAYER_KEY = 'drinkinggame:player'
const HOST_KEY = 'drinkinggame:hostRoomCode'

export function savePlayerSession(roomCode, name) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify({ roomCode, name }))
}

export function getPlayerSession() {
  const raw = localStorage.getItem(PLAYER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearPlayerSession() {
  localStorage.removeItem(PLAYER_KEY)
}

export function saveHostRoomCode(roomCode) {
  localStorage.setItem(HOST_KEY, roomCode)
}

export function getHostRoomCode() {
  return localStorage.getItem(HOST_KEY)
}

export function clearHostRoomCode() {
  localStorage.removeItem(HOST_KEY)
}
