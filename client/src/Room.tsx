// import React from "react";
import type { RoomClientState } from "./App";


interface RoomProps {
   payload: RoomClientState,
   doPayloadChange: (patch: Partial<RoomClientState>) => void,
}

export default function Room(props: RoomProps)
{
    console.log(props)
    return (
        <div className="flex justify-center align-middle">
            {props.payload.players.map(player => (
            <div
                key={player.id}
                className="d-flex flex-column justify-content-center align-items-center m-2 p-3"
                style={{ width: '150px', backgroundColor: '#e0e0e0', borderRadius: '4px' }}
            >
                <div>{player.id} {player.name}</div>
                {player.id === props.payload.clientId && (
                <span className="badge bg-primary mt-1">You</span>
                )}
                {player.id === props.payload.hostId && (
                <span className="badge bg-secondary mt-1">Host</span>
                )}
            </div>
            ))}
        </div>
    )
}

