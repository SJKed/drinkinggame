import { useEffect } from 'react'
import { socket } from '../socket.js'

export function useSocketEvent(eventName, handler) {
  useEffect(() => {
    socket.on(eventName, handler)
    return () => socket.off(eventName, handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, handler])
}
