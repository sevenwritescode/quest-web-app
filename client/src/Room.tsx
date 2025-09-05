// import React from "react";
import type { RoomClientState } from "./App";
import { useEffect, useState } from "react";
import "./css/index.css";
import "./css/Room.css";
import gear_icon from './assets/Gear_icon_svg.svg';
import QRCode from "react-qr-code";


interface RoomProps {
   payload: RoomClientState,
   doPayloadChange: (patch: Partial<RoomClientState>) => void,
   onChangeName: (newName: string) => void
}

export default function Room(props: RoomProps) { 
    const [displayQRCode,setDisplayQRCode] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);
    
    useEffect(() => {
        let fadeTimer: ReturnType<typeof setTimeout>
        let clearTimer: ReturnType<typeof setTimeout>

        if (props.payload.error) {
            // show immediately
            setErrorVisible(true)
            // after 2s, start fade-out
            fadeTimer = setTimeout(() => setErrorVisible(false), 2000)
            // after 2s + 0.5s (fade duration), clear the error in the parent
            clearTimer = setTimeout(
                () => props.doPayloadChange({ error: undefined }),
                2500
            )
        }
        return () => {
        clearTimeout(fadeTimer)
        clearTimeout(clearTimer)
        }
    }, [props.payload.error])

    return (<>

    <div className={`error-banner ${errorVisible ? 'error-visible' : 'error-hidden'}`}>
        {props.payload.error}
    </div>

    <div className="settings-button" onClick={() => {
        console.log("Setting: TODO ");
    }} >
        <img src={gear_icon} alt="Gear Icon -- Settings Button" />
    </div>

    <div className="code-container" onClick={() => {setDisplayQRCode(true)}}>
        Code: {props.payload.code}
    </div>

    {displayQRCode && (
        <div className="qr-code-container">
            <button
                className="qr-code-escape"
                onClick={() => setDisplayQRCode(false)}
            >
                Close
            </button>
            <QRCode
                value={window.location.href}
                size={128}
                level="L"
                
            />
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


