// import React from "react";
import type { RoomClientState } from "./App";
import { useEffect, useState, useRef } from "react";
import "./css/index.css";
import "./css/Room.css";
import gear_icon from './assets/Gear_icon_svg.svg';
import log_icon from './assets/system-log-2.png';
import QRCode from "react-qr-code";


interface RoomProps {
   payload: RoomClientState,
   doPayloadChange: (patch: Partial<RoomClientState>) => void,
   onChangeName: (newName: string) => void
}

export default function Room(props: RoomProps) { 
    const [displayQRCode,setDisplayQRCode] = useState(false);
    const [displayLog,setDisplayLog] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);
    // room code pill button (visual only, no copy functionality)
    
    useEffect(() => {
        let fadeTimer: ReturnType<typeof setTimeout>
        let clearTimer: ReturnType<typeof setTimeout>

        if (props.payload.error) {
            // show immediately
            setErrorVisible(true)
            // after 2s, start fade-out
            fadeTimer = setTimeout(() => setErrorVisible(false), 3000)
            // after 2s + 0.5s (fade duration), clear the error in the parent
            clearTimer = setTimeout(
                () => props.doPayloadChange({ error: undefined }),
                3500
            )
        }
        return () => {
        clearTimeout(fadeTimer)
        clearTimeout(clearTimer)
        }
    }, [props.payload.error]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDisplayQRCode(false);
                setDisplayLog(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    console.log(props.payload.log);
    useEffect(() => {
        if (displayLog && logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [props.payload.log, displayLog]);

    return (<>

    <div className={`error-banner ${errorVisible ? 'error-visible' : 'error-hidden'}`}>
        {props.payload.error}
    </div>

    <div className="settings-button" onClick={() => {
        console.log("Setting: TODO ");
    }} >
        <img src={gear_icon} alt="Gear Icon -- Settings Button" />
    </div>

    <div className="log-button" onClick={() => {
        displayLog ? setDisplayLog(false) : setDisplayLog(true);
    }}>
        <img src={log_icon} alt="Log Icon -- View Log Button" ></img>
    </div>

    <div ref={logRef} className={`log-modal ${displayLog ? 'log-visible' : 'log-hidden'}`}>
        {props.payload.log.map((entry, index) => (
            <div key={index} className={`log-entry ${entry.color}`}>
                {entry.mes}
            </div>
        ))}
    </div>

    <div className="room-code-btn" onClick={() => setDisplayQRCode(prev => !prev)}>
        {props.payload.code}
    </div>

   

    {displayQRCode && (
        <div className="qr-overlay" onClick={() => setDisplayQRCode(false)}>
            <div className="qr-code-container" onClick={e => e.stopPropagation()}>
                <QRCode
                    value={window.location.href}
                    size={200}
                    level="L"
                />
            </div>
        </div>
    )}
    
    
    <div className="player-list">
        {props.payload.players.map((player, index) => (
            <div className="player-container" key={player.id ?? index}>
                <div className="player-item"> 
                    {player.name !== undefined
                        ? <div className="player-name">{player.name}</div>
                        : <div className="anonymous">Anonymous</div>
                    }
                    <div className={"role-name "
                        + (player.Role === "Spectator" ? "spectator" : "")}>
                            {player.Role}
                    </div>
                    <div className="player-badges"> 
                        {player.id === props.payload.clientId && 
                            <div className={"you-badge "}>
                                (You)
                            </div> }
                        {player.id === props.payload.hostId &&  
                            <div className={"host-badge "}>
                                Host
                            </div> }
                    </div>
                </div>
            </div>
        ))}
    </div>
    </>);
}


