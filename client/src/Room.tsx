// import React from "react";
import type { RoomClientState } from "./App";
import React, { useState } from "react";


interface RoomProps {
   payload: RoomClientState,
   doPayloadChange: (patch: Partial<RoomClientState>) => void,
   onChangeName: (newName: string) => void
}

export default function Room(props: RoomProps) {
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [tempName, setTempName] = useState<string>("");

    console.log(props)
    return (
        <div className="flex justify-center align-middle">
            {props.payload.players.map(player => (
                <div
                    key={player.id}
                    className="d-flex flex-column justify-content-center align-items-center m-2 p-3"
                    style={{ width: "4000px", backgroundColor: "#959595ff", borderRadius: "4px" }}
                >
                    <div className="d-flex align-items-center">
                        {editingPlayerId === player.id ? (
                            <input
                                type="text"
                                className="form-control me-2"
                                value={tempName}
                                onChange={e => setTempName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        props.onChangeName(tempName);
                                        setEditingPlayerId(null);
                                    }
                                }}
                                autoFocus
                            />
                        ) : (
                            <>
                                <span>
                                    {player.name}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary ms-2"
                                    onClick={() => {
                                        setEditingPlayerId(player.id);
                                        setTempName(player.name);
                                    }}
                                >
                                    Edit
                                </button>
                            </>
                        )}
                    </div>

                    {player.id === props.payload.clientId && (
                        <span className="badge bg-primary mt-1">You</span>
                    )}
                    {player.id === props.payload.hostId && (
                        <span className="badge bg-secondary mt-1">Host</span>
                    )}
                </div>
            ))}
        </div>
        );
}


