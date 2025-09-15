import { useEffect, useReducer, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { RoomClientState } from './App'

// 1) Define actions
type Action =
  | { type: 'INIT';    payload: { code: string } }
  | { type: 'UPDATE';  payload: Partial<RoomClientState> }
  | { type: 'LOG';     payload: { text: string; color: string } }
  | { type: 'SET_APP_ERROR'; payload: string }   // non-fatal, shown in UI banner
  ;

// 2) Reducer
function reducer(state: RoomClientState, action: Action): RoomClientState {
  switch (action.type) {
    case 'INIT':
      return { ...state, code: action.payload.code }
    case 'UPDATE':
      return { ...state, ...action.payload }
    case 'LOG':
      return {
        ...state,
        log: [...state.log, { string: action.payload.text, color: action.payload.color }],
      }
    case 'SET_APP_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

export default function useRoomSocket(
  code: string,
  name?: string
): {
  state: RoomClientState
  loading: boolean
  fatalError?: string
  changeName: (newName: string) => void
  doPayloadChange: (patch: Partial<RoomClientState>) => void
} {
  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState<string|undefined>(undefined)

  const [state, dispatch] = useReducer(reducer, {
    code,
    players: [],
    clientId: '',
    hostId: '',
    log: [],
  })

  // allow parent to merge any partial state (including clearing error)
  const doPayloadChange = useCallback((patch: Partial<RoomClientState>) => {
    dispatch({ type: 'UPDATE', payload: patch })
  }, [])

  const socketRef = useRef<Socket|null>(null)

  useEffect(() => {
    setLoading(true)
    setFatalError(undefined)
    dispatch({ type: 'INIT', payload: { code } })

    const sock = io('/', {
      path: '/socket.io',
      withCredentials: true,
      reconnection: true,
    })
    socketRef.current = sock

    // 3) On successful connect (or reconnect) we join
    sock.on('connect', () => {
      setLoading(false)
      sock.emit('join', { code, name })
    })
    sock.io.on('reconnect', () => {
      sock.emit('join', { code, name })
    })

    // 4) Your server pushing down new state
    sock.on('roomStateUpdate', (upd: Partial<RoomClientState>) => {
      dispatch({ type: 'UPDATE', payload: upd })
    })

    sock.on('logMessage', (msg: { string: string; color: string }) => {
      dispatch({ type: 'LOG', payload: { text: msg.string, color: msg.color } })
    })

    // 5) Your “application” errors—invalid name, name-taken, room-not-found, etc.
    sock.on('error', (errMsg: string) => {
      // <-- non-fatal
      dispatch({ type: 'SET_APP_ERROR', payload: errMsg })
    })

    // 6) Truly fatal connectivity errors
    sock.on('connect_error', (err: any) => {
      setFatalError(err.message || 'Connection failed')
    })
    sock.on('disconnect_request', (reason: string) => {
      setFatalError(reason || 'Kicked from server')
      sock.disconnect()
    })
    sock.on('disconnect', (reason: any) => {
      setFatalError(String(reason) || 'Disconnected')
    })

    return () => {
      sock.off()
      sock.disconnect()
    }
  }, [code])

  const changeName = useCallback((newName: string) => {
    if (socketRef.current && !socketRef.current.disconnected) {
      socketRef.current.emit('changeName', { newName, code })
    }
  }, [code])

  return { state, loading, fatalError, changeName, doPayloadChange }
}