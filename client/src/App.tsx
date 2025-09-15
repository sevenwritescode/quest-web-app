// App.tsx
import { useState, useEffect  } from 'react'
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
  // useNavigationType
} from 'react-router-dom'
import Landing from './Landing'
import Room from './Room';
import { Navigate } from 'react-router-dom'
import useRoomSocket from './useRoomSocket';

export type LandingState    = { 
  name: string,
  code: string, 
  error?: string, 
  hostLoading: boolean, 
  joinLoading: boolean 
}

export type Role = "Spectator"
export type Player       = { id: string; name?: string; Role?: Role, roleKnown: boolean, allegianceKnown: boolean}

export type RoomClientState = {
  code: string,
  players: Player[], 
  clientId: string, 
  hostId: string,
  // settings: {
  //   name: string,

  // }
  // non-server reflected state
  log: {string: string, color: string}[],
  error?: string, 
}

// 1) Top-level router
export default function App() {
  return (
    <Routes>
      <Route path="/"           element={<LandingScreen/>}/>
      <Route path="/room/:code" element={<RoomScreen/>}  />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// 2) LandingScreen: same as your landing, but pushes the URL & lets server set a cookie
function LandingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [payload, setPayload] = useState<LandingState>({ code: '', name: '', hostLoading: false, joinLoading: false, error: location?.state?.error })

  const doPayloadChange = (patch: Partial<LandingState>) =>
    setPayload(p => ({ ...p, ...patch }))

  const isCurrentlyLoading =  payload.hostLoading || payload.joinLoading;

  useEffect(() => {
    if (location.state?.error) {
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [location.state?.error]);

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
      const { code } = await res.json() as { code: string, };
      navigate(`/room/${code}`,{ state: { name: payload.name } });
    }
    catch (e: any) {
      doPayloadChange({error: e.message || "Failed to Create Room"})
    }
    doPayloadChange({ hostLoading: false });
  }

  const onJoinClick = async () => {
    if (payload.code === "")
    {
      return;
    }
    navigate(`/room/${payload.code}`, { state: { name: payload.name } })
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

export function RoomScreen() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const location = useLocation();

  if (!code) {
    navigate('/')
    return null
  }

  // pull any passed‐in name
  const state = location.state as { name?: string } | undefined;
  const name = typeof state?.name === 'string'
    ? state.name
    : undefined

  const { state: payload, changeName, loading, error } = useRoomSocket(code, name)

  // fatal errors send us back home
  if (error) {
    navigate('/', { replace: true, state: { error } })
    return null
  }

  if (loading) {
    return <div>Connecting to room…</div>
  }

  return <Room payload={payload} onChangeName={changeName} doPayloadChange={() => {}} />
}