// App.tsx
import { useState, useEffect } from 'react'
import {
  Routes,
  Route,
  useNavigate,
  useParams
} from 'react-router-dom'
import Landing from './Landing'
// import Lobby   from './Lobby'
// import Game    from './Game'

export type Player       = { id: string; name: string }

export type LandingState = { code: string, error?: string }
export type LobbyState   = { players: Player[], clientId: string }
export type GameState    = { /* …game payload… */ }

// 1) Top-level router
export default function App() {
  return (
    <Routes>
      <Route path="/"           element={<LandingScreen/>}/>
      <Route path="/room/:code" element={<RoomScreen/>}  />
    </Routes>
  )
}

// 2) LandingScreen: same as your landing, but pushes the URL & lets server set a cookie
function LandingScreen() {
  const [payload, setPayload] = useState<LandingState>({ code: '' })
  // const _navigate              = useNavigate()

  const doPayloadChange = (patch: Partial<LandingState>) =>
    setPayload(p => ({ ...p, ...patch }))

  const onHostClick = async () => {
    doPayloadChange({ error: "test -- server is not hooked up yet "});
  }

  const onJoinClick = async () => {
    // try {
    //   const res = await fetch(`/api/rooms/${payload.code}/join`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     credentials: 'include',            // << tell the browser to store/send cookies
    //     body: JSON.stringify({ code: payload.code })
    //   })
    //   if (!res.ok) throw await res.text()
    //   // server should Set-Cookie: sessionId=…; HttpOnly
    //   navigate(`/room/${payload.code}`)
    // } catch (e:any) {
    //   setError(e.toString())
    // }
    doPayloadChange({error: "test -- server is not hooked up yet"});
  }

  return (
    <Landing
      payload={payload}
      doPayloadChange={doPayloadChange}
      doHostClick={onHostClick}
      doJoinClick={onJoinClick}
    />
  )
}

// 3) RoomScreen: same URL for lobby & game. we fetch /state and the server tells us which page
function RoomScreen() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [state, setState] = useState<
    | { page: 'lobby'; payload: LobbyState }
    | { page: 'game';  payload: GameState  }
    | null
  >(null)

  // on mount (or code change) rehydrate from server
  useEffect(() => {
    if (!code) return
    fetch(`/api/rooms/${code}/state`, {
      credentials: 'include'   // sends the session cookie
    })
      .then(r => {
        if (!r.ok) throw new Error('Not in room')
        return r.json()
      })
      .then((data:
        | { page: 'lobby'; payload: LobbyState }
        | { page: 'game';  payload: GameState  }
      ) => setState(data))
      .catch(() => navigate('/'))
  }, [code])

  if (!state) return <div>Loading…</div>

  // if (state.page === 'lobby') {
  //   return (
  //     <Lobby
  //       players={state.payload.players}
  //       clientId={state.payload.clientId}
  //       onStartGame={async () => {
  //         await fetch(`/api/rooms/${code}/start`, {
  //           method: 'POST',
  //           credentials: 'include'
  //         })
  //         // optimistically switch to “game” U.I.
  //         setState({ page: 'game', payload: {} })
  //       }}
  //     />
  //   )
  // }

  // state.page === 'game'
  // return <Game {...state.payload} />
}