// useRoomSocket.ts
import { useEffect, useReducer, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { RoomClientState, Player } from './App'

// 1a) define the actions you’ll handle
type Action =
  | { type: 'INIT';    payload: { code: string } }
  | { type: 'UPDATE';  payload: Partial<RoomClientState> }
  | { type: 'LOG';     payload: { text: string; color: string } }
  | { type: 'ERROR';   payload: string }

// 1b) your reducer
function reducer(state: RoomClientState, action: Action): RoomClientState {
  switch (action.type) {
    case 'INIT':
      return { ...state, code: action.payload.code }
    case 'UPDATE':
      return { ...state, ...action.payload }
    case 'LOG':
      return { ...state, log: [...state.log, { string: action.payload.text, color: action.payload.color }] }
    case 'ERROR':
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
  changeName: (newName: string) => void
  loading: boolean
  error?: string
} {
  // 2) local loading & error
  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState<string|undefined>(undefined)

  // 3) our client state lives in a reducer
  const [state, dispatch] = useReducer(reducer, {
    code,
    players: [],
    clientId: '',
    hostId: '',
    log: [],
  })

  // 4) keep a ref to the socket so we can emit later
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io('/', {
      path: '/socket.io',
      withCredentials: true,
      reconnection: true,
      // you can configure reconnectionAttempts, delays, etc here
    })

    socketRef.current = socket

    // on connect (and reconnect), join the room
    socket.on('connect', () => {
      setLoading(false)
      socket.emit('join', { code, name })
    })

    // if reconnect happens, re-join
    socket.io.on('reconnect', () => {
      socket.emit('join', { code, name })
    })

    socket.on('roomStateUpdate', (payload: Partial<RoomClientState>) => {
      dispatch({ type: 'UPDATE', payload })
    })

    socket.on('logMessage', (msg: { string: string; color: string }) => {
      // note we’re not mutating state.log directly
      dispatch({
        type: 'LOG',
        payload: { text: msg.string, color: msg.color },
      })
    })

    socket.on('error', (err: string) => {
      dispatch({ type: 'ERROR', payload: err })
    })

    socket.on('connect_error', (err: any) => {
      setFatalError(err.message || 'Connection error')
    })

    socket.on('disconnect_request', (reason: string) => {
      // server told us to leave
      setFatalError(reason)
      socket.disconnect()
    })

    socket.on('disconnect', (reason: any) => {
      setFatalError(String(reason) || 'Disconnected')
    })

    return () => {
      socket.off()
      socket.disconnect()
    }
  }, [code, name])

  // 5) exposed action to change name
  const changeName = useCallback((newName: string) => {
    // guard against the socket not being set yet or having disconnected
    if (socketRef.current && !socketRef.current.disconnected) {
      socketRef.current.emit('changeName', { newName, code })
    }
  }, [code])

  return {
    state,
    changeName,
    loading,
    error: fatalError ?? state.error,
  }
}