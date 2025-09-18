import type { RoomClientState, Deck, RolePool } from './types';
import { useEffect, useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import "./css/index.css";
import "./css/Room.css";
import gear_icon from './assets/icons/Gear_icon_svg.svg';
import log_icon from './assets/icons/system-log-2.png';
import knowledge_icon from './assets/icons/books-17.svg';
import { canonicalDecks } from "./data/decks";
import QRCode from "react-qr-code";


interface RoomProps {
    payload: RoomClientState,
    doPayloadChange: (patch: Partial<RoomClientState>) => void,
    onChangeName: (newName: string) => void,
    onBecomeSpectator: () => void,
    onLeaveClick: () => void,
    onDeckChange: (deck: Deck) => void,
    onKickPlayer: (playerId: string) => void,
    onToggleSpectator: (playerId: string) => void,
    onReorderPlayers: (newOrder: string[]) => void
}

export default function Room(props: RoomProps) {
    const [displayQRCode, setDisplayQRCode] = useState(false);
    const [displayLog, setDisplayLog] = useState(false);
    const [displayKnowledge, setDisplayKnowledge] = useState(false);
    // Modal stack for nested dialogs
    const [modalStack, setModalStack] = useState<string[]>([]);
    const pushModal = (modal: string) => setModalStack(stack => [...stack, modal]);
    const popModal = () => setModalStack(stack => stack.slice(0, -1));
    // Derived flags
    const showSettingsModal = modalStack.includes('settings');
    const showDeckEditor = modalStack.includes('deckEditor');
    const [deckEditorMode, setDeckEditorMode] = useState<'canonical' | 'json'>('canonical');
    const deckKeys = Object.keys(canonicalDecks) as Array<keyof typeof canonicalDecks>;
    const [selectedDeckKey, setSelectedDeckKey] = useState<keyof typeof canonicalDecks>("DirectorsCut7Player");
    const [customDeckJson, setCustomDeckJson] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [settingsTab, setSettingsTab] = useState<'client' | 'game'>('client');
    const [errorVisible, setErrorVisible] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);
    const isHost = props.payload.clientId === props.payload.hostId;
    // Helper to render deck preview
    const renderDeckPreview = () => (
        props.payload.settings.deck.items.map((item, idx) => {
            if (typeof item === "string") {
                const role = item;
                const src = new URL(`./assets/roles/${role}.webp`, import.meta.url).href;
                return <img key={idx} src={src} alt={role} className="deck-card" loading="lazy" />;
            } else {
                const pool = item as RolePool;
                return (
                    <div key={idx} className="role-pool">
                        {pool.roles.map((role, i) => {
                            const src = new URL(`./assets/roles/${role}.webp`, import.meta.url).href;
                            return <img key={i} src={src} alt={role} className="deck-card pool-role" loading="lazy" />;
                        })}
                        <div className="role-pool-badge">⊃{pool.draw}</div>
                    </div>
                );
            }
        })
    );
    const [newName, setNewName] = useState<string>(
        props.payload.players.find(p => p.id === props.payload.clientId)?.name || ''
    );
    useEffect(() => {
        if (showSettingsModal) {
            const curr = props.payload.players.find(p => p.id === props.payload.clientId);
            setNewName(curr?.name || '');
        }
    }, [showSettingsModal, props.payload.players, props.payload.clientId]);

    
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
                console.log(modalStack.length);
                if (modalStack.length > 0) {
                    popModal();
                } else if (displayQRCode) {
                    setDisplayQRCode(false);
                } else if (displayLog) {
                    setDisplayLog(false);
                } else if (displayKnowledge) {
                    setDisplayKnowledge(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // re-run to capture latest modalStack and display flags
    }, [modalStack, displayQRCode, displayLog, displayKnowledge]);

    useEffect(() => {
        if (displayLog && logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [props.payload.log, displayLog]);

    // Handler for react-beautiful-dnd drag end
    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.index === destination.index) return;
        const players = Array.from(props.payload.players);
        const [moved] = players.splice(source.index, 1);
    players.splice(destination.index, 0, moved);
    // Optimistically update local UI before server confirmation
    props.doPayloadChange({ players });
    props.onReorderPlayers(players.map(p => p.id));
    };

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

        <div className="settings-button" onClick={() => pushModal('settings')} >
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
                <div 
                    className="player-container" 
                    key={player.id ?? index}
                    onClick={() => console.log(player.name)}
                >
                    <div className="player-item">
                        {player.name !== undefined
                            ? <div className="player-name">{player.name}</div>
                            : <div className="anonymous">Anonymous</div>
                        }
                        <div className={"role-name "
                            + (player.Role === "Spectator" ? "Spectator" : "")}>
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
        {showSettingsModal && (
            <div className="settings-overlay" onClick={() => popModal()}>
                <div className="settings-modal" onClick={e => e.stopPropagation()}>
                    <button className="settings-close-button" onClick={() => popModal()}>✕</button>
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
                                        onClick={props.onBecomeSpectator}
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
                                {/* <div className="settings-row">
                                    <span className="settings-label">Round Time</span>
                                    <input
                                        className="settings-input"
                                        type="range"
                                        min={30}
                                        max={300}
                                        defaultValue={60}
                                        disabled={!isHost}
                                    />
                                </div> */}
                                {/* Deck preview */}
                                <div className="settings-row">
                                    <span className="settings-label">Director's Cut</span>
                                    <input
                                        className="settings-input"
                                        type="checkbox"
                                        disabled={true}
                                        title="Director's Cut Rules are determined by deck selection."
                                        checked={props.payload.settings.deck.directorsCut} 
                                    />
                                </div>

                                <div className="settings-row">
                                    <span className="settings-label">Deck</span>
                                </div>
                                <div className="settings-row deck-preview-row">
                                    <div className="deck-preview">
                                        {renderDeckPreview()}
                                    </div>
                                </div>
                                <div className="settings-row button-only-row">
                                    <button
                                        className="settings-action-button only-button"
                                        disabled={!isHost}
                                        onClick={() => pushModal('deckEditor')}
                                    >
                                        Edit Deck
                                    </button>
                                </div>
                                {/* Player Manager */}
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="players">
                                        {(provided: DroppableProvided) => (
                                            <div
                                                className="settings-section player-manager-section"
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                <div className="settings-label">Player Manager</div>
                                                {props.payload.players.map((player, idx) => (
                                                    <Draggable
                                                        key={player.id}
                                                        draggableId={player.id}
                                                        index={idx}
                                                        isDragDisabled={!isHost}
                                                    >
                                                        {(prov: DraggableProvided) => (
                                                            <div
                                                                className="player-manager-item"
                                                                ref={prov.innerRef}
                                                                {...prov.draggableProps}
                                                                {...prov.dragHandleProps}
                                                            >
                                                                <span className="drag-handle">≡</span>
                                                                {player.name
                                                                    ? <div className="player-name">{player.name}</div>
                                                                    : <div className="anonymous">Anonymous</div>
                                                                }
                                                                <button
                                                                    className="spectator-button"
                                                                    disabled={!isHost}
                                                                    onClick={() => props.onToggleSpectator(player.id)}
                                                                >{player.Role === 'Spectator' ? 'Un-spectate' : 'Spectate'}</button>
                                                                <button
                                                                    className={`kick-button${player.id === props.payload.hostId ? ' hidden' : ''}`}
                                                                    disabled={!isHost || player.id === props.payload.hostId}
                                                                    onClick={() => props.onKickPlayer(player.id)}
                                                                >Kick</button>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Deck Editor Modal */}
    {showDeckEditor && (
            <div className="deck-editor-overlay" onClick={() => popModal()}>
                <div className="deck-editor-modal" onClick={e => e.stopPropagation()}>
                    <div className="settings-tabs">
                        <button
                            className={deckEditorMode === 'canonical' ? 'active' : ''}
                            onClick={() => setDeckEditorMode('canonical')}
                        >Preset Decks</button>
                        <button
                            className={deckEditorMode === 'json' ? 'active' : ''}
                            onClick={() => setDeckEditorMode('json')}
                        >Custom JSON</button>
                    </div>
                    <div className="settings-content">
                        {deckEditorMode === 'canonical' && (
                            <div className="settings-section">
                                {deckKeys.map(key => (
                                    <div key={key} className="settings-row">
                                        <label>
                                            <input
                                                type="radio"
                                                name="preset-deck"
                                                value={key}
                                                checked={selectedDeckKey === key}
                                                onChange={() => setSelectedDeckKey(key)}
                                            /> {key}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                        {deckEditorMode === 'json' && (
                            <div className="settings-section">
                                <textarea
                                    className="settings-input"
                                    style={{ height: '200px', fontFamily: 'monospace' }}
                                    value={customDeckJson}
                                    onChange={e => setCustomDeckJson(e.target.value)}
                                />
                                {jsonError && <div className="error-banner-small">{jsonError}</div>}
                            </div>
                        )}
                    </div>
                    <div className="settings-row button-only-row" style={{ marginTop: '1rem' }}>
                        <button
                            className="only-button gray"
                            onClick={() => popModal()}
                        >Cancel</button>
                        <button
                            className="only-button gray"
                            onClick={() => {
                                if (deckEditorMode === 'canonical') {
                                    props.onDeckChange(canonicalDecks[selectedDeckKey]);
                                    popModal();
                                } else {
                                    try {
                                        const deck = JSON.parse(customDeckJson) as Deck;
                                        props.onDeckChange(deck);
                                        setJsonError(null);
                                        popModal();
                                    } catch (e: any) {
                                        setJsonError('Invalid JSON');
                                    }
                                }
                            }}
                        >Save</button>
                    </div>
                </div>
            </div>
        )}
    </>);
}


