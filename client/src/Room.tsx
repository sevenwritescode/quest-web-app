// import React from "react";
import type { RoomClientState  } from "./types"
import { useEffect, useState, useRef } from "react";
import "./css/index.css";
import "./css/Room.css";
import gear_icon from './assets/Gear_icon_svg.svg';
import log_icon from './assets/system-log-2.png';
import knowledge_icon from './assets/books-17.svg';
import QRCode from "react-qr-code";


interface RoomProps {
    payload: RoomClientState,
    doPayloadChange: (patch: Partial<RoomClientState>) => void,
    onChangeName: (newName: string) => void,
    onLeaveClick: () => void,
    onChangePlayerCount: (count: number) => void,
}

export default function Room(props: RoomProps) {
    const [displayQRCode, setDisplayQRCode] = useState(false);
    const [displayLog, setDisplayLog] = useState(false);
    const [displaySettings, setDisplaySettings] = useState(false);
    const [displayKnowledge, setDisplayKnowledge] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'client' | 'game'>('client');
    const [errorVisible, setErrorVisible] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);
    const isHost = props.payload.clientId === props.payload.hostId;
    const [newName, setNewName] = useState<string>(
        props.payload.players.find(p => p.id === props.payload.clientId)?.name || ''
    );
    const [newPlayerCount, setNewPlayerCount] = useState<string>(
        props.payload.settings.numberOfPlayers.toString()
    );
    useEffect(() => {
        if (displaySettings) {
            const curr = props.payload.players.find(p => p.id === props.payload.clientId);
            setNewName(curr?.name || '');
            setNewPlayerCount(props.payload.settings.numberOfPlayers.toString());
        }
    }, [displaySettings, props.payload.players, props.payload.clientId]);

    
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
                setDisplaySettings(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (displayLog && logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [props.payload.log, displayLog]);

    // State and effect for log-notice banner
    const [logNoticeMessage, setLogNoticeMessage] = useState<string>('');
    const [logNoticeColor, setLogNoticeColor] = useState<string>('gray');
    const [logNoticeVisible, setLogNoticeVisible] = useState(false);
    const prevLogLenRef = useRef<number>(props.payload.log.length);

    useEffect(() => {
        let fadeTimer: ReturnType<typeof setTimeout>;
        let clearTimer: ReturnType<typeof setTimeout>;
        if (!displayLog && props.payload.log.length > prevLogLenRef.current) {
            const newEntry = props.payload.log[props.payload.log.length - 1];
            setLogNoticeMessage(newEntry.mes);
            setLogNoticeColor(newEntry.color || 'gray');
            setLogNoticeVisible(true);
            fadeTimer = setTimeout(() => setLogNoticeVisible(false), 3000);
            clearTimer = setTimeout(() => setLogNoticeMessage(''), 3500);
        }
        prevLogLenRef.current = props.payload.log.length;
        return () => {
            setLogNoticeMessage('');
            setLogNoticeVisible(false);
            clearTimeout(fadeTimer);
            clearTimeout(clearTimer);
        };
    }, [props.payload.log, displayLog]);

    return (<>

        <div className={`error-banner ${errorVisible ? 'error-visible' : 'error-hidden'}`}>
            {props.payload.error}
        </div>

        {logNoticeMessage && (
            <div className={`log-notice-banner ${logNoticeVisible ? 'log-notice-visible' : 'log-notice-hidden'}  ${logNoticeColor || "gray"}`}>
                <div className="log-notice-content">
                    {logNoticeMessage}
                </div>
            </div>
        )}

        <div className="settings-button" onClick={() => {
            setDisplaySettings(true);
        }} >
            <img src={gear_icon} alt="Gear Icon -- Settings Button" />
        </div>

        <div className="log-button" onClick={() => {
            displayLog ? setDisplayLog(false) : setDisplayLog(true);
        }}>
            <img src={log_icon} alt="Log Icon -- View Log Button" ></img>
        </div>

        <div className="knowledge-button" onClick={() => {
            setDisplayKnowledge(true)
        }}>
            <img src={knowledge_icon} alt="Knowledge Icon -- View Knowledge Button"></img>
        </div>

        <div className={`log-modal ${displayLog ? 'log-visible' : 'log-hidden'}`}>
            {/* Close button for log modal */}
            <button className="log-close-button" onClick={() => setDisplayLog(false)}>✕</button>
            <div ref={logRef} className="log-content">
                {props.payload.log.map((entry, index) => (
                    <div key={index} className={`log-entry ${entry.color}`}>
                        {entry.mes}
                    </div>
                ))}
            </div>
        </div>

        <div className="room-code-btn" onClick={() => {
            navigator.clipboard.writeText(props.payload.code);
            setDisplayQRCode(prev => !prev);
        }}>
            {props.payload.code}
        </div>


        {displayQRCode && (
            <div className="qr-overlay" onClick={() =>  {
                
                setDisplayQRCode(false);
            }}>
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
                                </div>}
                            {player.id === props.payload.hostId &&
                                <div className={"host-badge "}>
                                    Host
                                </div>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        {displaySettings && (
            <div className="settings-overlay" onClick={() => setDisplaySettings(false)}>
                <div className="settings-modal" onClick={e => e.stopPropagation()}>
                    <button className="settings-close-button" onClick={() => setDisplaySettings(false)}>✕</button>
                    <div className="settings-tabs">
                        <button
                            className={settingsTab === 'client' ? 'active' : ''}
                            onClick={() => setSettingsTab('client')}
                        >Client Settings</button>
                        <button
                            className={settingsTab === 'game' ? 'active' : ''}
                            onClick={() => setSettingsTab('game')}
                        >Game Settings</button>
                    </div>
                    <div className="settings-content">
                        {settingsTab === 'client' && (
                            <div className="settings-section">
                                <div className="settings-row">
                                    <span className="settings-label">Username</span>
                                    <input
                                        className="settings-input"
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                props.onChangeName(e.currentTarget.value);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="settings-row button-only-row">
                                    <button
                                        className="only-button gray"
                                        onClick={() => console.log('TODO: implement spectator toggle')}
                                    >Become Spectator</button>
                                </div>
                                <div className="settings-row button-only-row">
                                    <button
                                        className="only-button red"
                                        onClick={props.onLeaveClick}
                                    >Leave Room</button>
                                </div>
                            </div>
                        )}
                        {settingsTab === 'game' && (
                            <div className={
                                `settings-section${!isHost ? ' disabled-section' : ''}`
                            }>
                                <div className="settings-row">
                                    <span className="settings-label">Number of Players</span>
                                    <input
                                        className="settings-input"
                                        type="input"
                                        value={newPlayerCount}
                                        disabled={!isHost}
                                        onChange={e => setNewPlayerCount(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                props.onChangePlayerCount(Number(e.currentTarget.value))
                                            }
                                        }}
                                    />
                                </div>
                                <div className="settings-row">
                                    <span className="settings-label">Round Time</span>
                                    <input
                                        className="settings-input"
                                        type="range"
                                        min={30}
                                        max={300}
                                        defaultValue={60}
                                        disabled={!isHost}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </>);
}


