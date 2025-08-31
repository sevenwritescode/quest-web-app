// App.tsx
import { useState } from 'react'
import {
  Routes,
  Route,
  useNavigate,
  // useParams,
  useLocation
} from 'react-router-dom'
import Landing from './Landing'
import { Room } from './Room';
// import Lobby   from './Lobby'
// import Game    from './Game'

export type Player       = { id: string; name: string }

export type LandingState = { code: string, error?: string, hostLoading: boolean, joinLoading: boolean }
export type RoomState    = { players: Player[], clientId: string }

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
  const [payload, setPayload] = useState<LandingState>({ code: '', hostLoading: false, joinLoading: false })
  const navigate              = useNavigate()

  const doPayloadChange = (patch: Partial<LandingState>) =>
    setPayload(p => ({ ...p, ...patch }))

  const isCurrentlyLoading =  payload.hostLoading || payload.joinLoading;

  const onHostClick = async () => {
    if (isCurrentlyLoading) {
      return;
    }
    doPayloadChange({ hostLoading: true });
    try {
      const res = await fetch(`/api/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      if (!res.ok) throw {message: `${res.status}: ${await res.text()}`};
      const { code, clientId } = await res.json() as { code: string, clientId: string };
      if (clientId === undefined)
        throw {message: "Failed to Assign Client Id"};
      navigate(`/room/${code}`, {
        state: { players: [], clientId } satisfies RoomState
      });
    }
    catch (e: any) {
      doPayloadChange({error: e.message || "Failed to Create Room"})
    }
    doPayloadChange({ hostLoading: false});
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
    doPayloadChange({error: "join -- server is not hooked up yet"});
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
  // const { code } = useParams<{ code: string }>();
  // const navigate = useNavigate();
  const loc = useLocation();

  const incoming = loc.state as RoomState | null
  console.log(loc); 

  const [payload, _setPlayload] = useState<RoomState>(() => {
    if (incoming === null) {
      // TODO
      // we haven't joined this room yet, in this case, we should try to join the room
      console.log(incoming);
      throw {} 
    }
    return incoming;
  });

  // on mount (or code change) rehydrate from server
  // useEffect(() => {
  //   if (!code) return
  //   fetch(`/api/rooms/${code}/state`, {
  //     credentials: 'include'   // sends the session cookie
  //   })
  //     .then(r => {
  //       if (!r.ok) throw new Error('Not in room')
  //       return r.json()
  //     })
  //     .then((data:
  //       | { page: 'lobby'; payload: RoomState }
  //       | { page: 'game';  payload: GameState  }
  //     ) => setState(data))
  //     .catch(() => navigate('/'))
  // }, [code])

  // if (!state) return <div>Loading…</div>

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
  return <Room payload={payload}/>
}