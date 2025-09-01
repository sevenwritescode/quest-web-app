// App.tsx
import { useState, useEffect } from 'react'
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation
} from 'react-router-dom'
import Landing from './Landing'
import Room from './Room';
import { io, Socket } from "socket.io-client"

export type Player       = { id: string; name: string }

export type LandingState    = { code: string, error?: string, hostLoading: boolean, joinLoading: boolean }
export type RoomClientState = { players: Player[], clientId: string, hostId: string }

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
  const navigate              = useNavigate()
  const location = useLocation()
  const [payload, setPayload] = useState<LandingState>({ code: '', hostLoading: false, joinLoading: false, error: location.state?.error })
  location.state.error = undefined; 

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
      const { code, } = await res.json() as { code: string, };
      navigate(`/room/${code}`);
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
    // doPayloadChange({error: "join -- server is not hooked up yet"});
    if (payload.code === "")
    {
      return;
    }
    navigate(`/room/${payload.code}`)
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
  const { code }= useParams<{ code: string }>()
  console.log(`code: ${code}`)

  const [payload, setPayload] = useState<RoomClientState>({ players: [], hostId: "", clientId: ""});

  const navigate              = useNavigate()
  
  const doPayloadChange = (patch: Partial<RoomClientState>) =>
    setPayload(p => ({ ...p, ...patch }))

  useEffect(() => {
    const sock: Socket = io("/", {
      path: "/socket.io",
      withCredentials: true 
    });

    sock.on("connect_error", (err: any) => {
      console.error("socket connect_error:", err?.message);
    });

    sock.on("connect", () => {
      sock.emit("join", { code });
    });

    sock.on("roomState", (state: RoomClientState) => {
      doPayloadChange(state);
    });

    sock.on("error", (err: any) => {
      console.log("socket error:", err)
      sock.disconnect()
      navigate("/", {
        replace: true,
        state: { error: String(err || "Connection error") }
      })
    });

    return () => {
      sock.off(); // remove handlers
      sock.disconnect();
    };
  }, [code]);

  return <Room payload={payload}/>
}