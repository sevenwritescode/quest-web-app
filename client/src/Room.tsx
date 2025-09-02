// import React from "react";
import type { RoomClientState } from "./App";
import { useState, useEffect } from "react";


interface RoomProps {
   payload: RoomClientState,
   doPayloadChange: (patch: Partial<RoomClientState>) => void,
   onChangeName: (newName: string) => void
}

export default function Room(props: RoomProps) {
    const { payload, onChangeName } = props;
    const { players, clientId } = payload;
    const [newName, setNewName] = useState(() => {
        const me = players.find(p => p.id === clientId);
        return me?.name || "";
    });

    useEffect(() => {
        const me = players.find(p => p.id === clientId);
        if (me) {
            setNewName(me.name);
        }
    }, [players, clientId]);

    const handleNameChange = () => {
        const trimmed = newName.trim();
        if (trimmed) {
            onChangeName(trimmed);
        }
    };

    
    console.log(props.payload)
    return (
        <div className="h-screen w-screen flex flex-wrap justify-center items-center">
            {players.map(player => (
                <div
                    key={player.id}
                    className="border rounded-lg p-4 m-2 w-48 h-32 flex flex-col items-center justify-center"
                >
                    {player.id === clientId ? (
                        <>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="border px-2 py-1 rounded mb-2 w-full text-center"
                            />
                            <button
                                onClick={handleNameChange}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                            >
                                Save
                            </button>
                            <span className="text-sm text-gray-500 mt-1">you</span>
                        </>
                    ) : (
                        <span className="text-lg font-medium">{player.name}</span>
                    )}
                </div>
            ))}
        </div>
    );
}


