// import React from "react";
import type { RoomClientState } from "./App";
import { useState } from "react";
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
    // const testPlayers = useMemo(() => {
    //     // 1) clone
    //     const cloned = props.payload.players.map(p => ({ ...p }))
    //     // 2) add 10 random
    //     for (let i = 0; i < 10; i++) {
    //     const id   = Math.random().toString(36).substr(2, 8)
    //     const name = Array.from({ length: 5 })
    //         .map(() => Math.random().toString(36).charAt(2))
    //         .join('')
    //     cloned.push({ id, name })
    //     }
    //     return cloned
    // }, [props.payload.players])
    const [displayQRCode,setDisplayQRCode] = useState(false);

    return (<>
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
                    <div className="player-badges"> 
                        {props.payload.hostId === player.id && (
                        <div className="host-indicator">
                            Host
                        </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
    </div>
    </>);
}


