// App.tsx
import { useState, useEffect, useRef  } from 'react'
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
import { io, type Socket } from 'socket.io-client';
import type { Deck, LandingState, RoomClientState  } from "./types"
import { canonicalDecks } from './data/decks';



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
        body: JSON.stringify({ name: payload.name }),
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

function RoomScreen() {
  const { code } = useParams<{ code: string }>()
  if (code === undefined)
    throw new Error("Room Code is undefined");

  const [payload, setPayload] = useState<RoomClientState>(
    { 
      code, 
      players: [],
       hostId: "",
       clientId: "",
       firstLeaderId: undefined,
       gameInProgress: false,
       settings: {
        omnipotentSpectators: true, 
        deck: canonicalDecks.DirectorsCut7Player
      },
      log: []
    });

  const navigate = useNavigate();  
  const location = useLocation();
  // const _navType = useNavigationType(); 

  // useEffect(() => {
  //   const testLog = Array.from({ length: 100 }, (_, i) => ({
  //     mes: `Test message ${i + 1}`,
  //     color: ['red', 'green', 'blue'][i % 3],
  //   }))
  //   setPayload({
  //     log: testLog,
  //     firstLeaderId: "0",
  //     gameInProgress: false,
  //     players: 
  //     // [],
  //     Array.from({ length: 100 }, (_, i) => ({
  //       id: `player${i + 1}`,
  //       name: `Test Player ${i + 1}`,
  //       role: "Spectator",
  //       allegiance: "No Allegiance"
  //     })),
  //     settings: {
  //       omnipotentSpectators: false,
  //       deck: { directorsCut: true, items: [] }
  //     },
  //     code: "POOP",
  //     clientId: "test",
  //     hostId: "test"
  //   })
  // }, [])

  const doPayloadChange = (patch: Partial<RoomClientState>) =>
    // console.log("debugging!! payloadchange does nothing")
    setPayload(p => ({ ...p, ...patch }))

  const sockRef = useRef<Socket|null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (code === "" || code === undefined) {
      navigate("/") 
      return;
    } 
    if (code !== code.toUpperCase()) {
      navigate(`/room/${code.toUpperCase()}`,{ replace: true, state: location.state });
      return;
    }

    let name: string | undefined = undefined;
    if (location.state && typeof location.state.name === 'string') {
      name = location.state.name;
    }
    if (name === "") {
      name = undefined;
    }

    const sock = io("/", {
        path: "/socket.io",
        withCredentials: true 
    });
    sockRef.current = sock;
    console.log(code)

    sock.on("connect_error", (err: any) => {
      console.error("socket connect_error:", err?.message);
      navigate("/", {
        replace: true,
        state: { error: String(err || "Connection error") }
      })
    });

    sock.on("connect", () => {
      sock.emit("join", { code, name });
      setIsLoading(false);
    });

    sock.on("roomStateUpdate", (state: Partial<RoomClientState>) => {
      doPayloadChange(state);
    });

    sock.on("logMessage", (message: {mes: string, color: string}) => {
      setPayload(prev => ({
        ...prev,
        log: [...prev.log, message]
      }));
    });

    sock.on("error", (err: string) => {
      doPayloadChange({error: err});
    });

    sock.on("disconnect_request", (mes: string) => {
      console.log("socket disconnect request:", mes); 
      sock.disconnect();
      navigate("/", {
        state: { error: mes }
      });
    });

    sock.on("disconnect", (err: any) => {
      console.log("socket disconnect:", err); 
      doPayloadChange({ error: err });
      // navigate("/", {
      //   replace: true,
      //   state: { error: String(err || "Connection Disconnect") }
      // });
    });

    return () => {
      const sock = sockRef.current;
      if (sock) {
        sock.off();
        sock.disconnect();
      }
    };

  }, [code]);

  const doChangeName = (newName: string) => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    }
    sock.emit("changeName", { newName, code });
    navigate(location.pathname, {
      replace: true,
      state: {
        name: newName
      }
    })
  }

  const doBecomeSpectator = () => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    } 
    sock.emit("becomeSpectator", { code });
  }

  const doLeave = () => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    } 
    sock.emit("leaveRequest", { code })
  }

  const doDeckChange = (deck: Deck) => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    }
    sock.emit("changeDeck", { deck, code });
  }

  const doKickPlayer = (playerId: string) => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    } 
    sock.emit("kickPlayer", { playerId, code });
  }

  const doToggleSpectator = (playerId: string) => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    }
    sock.emit("toggleSpectator", { playerId, code });
  }

  const doReorderPlayers = (playerIds: string[]) => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    }
    sock.emit("reorderPlayers", { playerIds, code }); 
  }

  const doToggleOmnipotentSpectators = () => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    } 

    sock.emit("toggleOmnipotentSpectators", { code });
  }

  const doStartGame = () => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    }
    sock.emit("startGame", { code }); 
  }

  const doStopGame = () => {
    const sock = sockRef.current;
    if (!sock || sock.disconnected) {
      console.warn("socket not ready yet");
      return;
    }
    sock.emit("stopGame", { code }); 
  }
  
  if (isLoading) {
    return <div className="loading">Connecting to room...</div>;
  }

  return <>
    <Room 
      payload={payload} 
      doPayloadChange={doPayloadChange} 
      onLeaveClick={doLeave} 
      onChangeName={doChangeName}
      onBecomeSpectator={doBecomeSpectator}
      onDeckChange={doDeckChange}
      onKickPlayer={doKickPlayer}
      onToggleSpectator={doToggleSpectator}
      onReorderPlayers={doReorderPlayers}
      onToggleOmnipotentSpectators={doToggleOmnipotentSpectators}
      onStartGame={doStartGame}
      onStopGame={doStopGame}
    />
  </>
}