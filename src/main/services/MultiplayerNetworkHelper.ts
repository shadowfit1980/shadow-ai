/**
 * Multiplayer Network Helper Service
 * 
 * Networking code templates and patterns for multiplayer games:
 * - Client-server architecture
 * - Peer-to-peer networking
 * - State synchronization
 * - Lag compensation
 * - Matchmaking
 */

import { EventEmitter } from 'events';

export type NetworkTopology = 'client-server' | 'peer-to-peer' | 'host-migration';
export type SyncStrategy = 'state-sync' | 'event-sync' | 'lockstep';

export interface NetworkConfig {
    topology: NetworkTopology;
    syncStrategy: SyncStrategy;
    tickRate: number;  // Server ticks per second
    interpolationDelay: number;  // ms
    maxPlayers: number;
}

export class MultiplayerNetworkHelper extends EventEmitter {
    private static instance: MultiplayerNetworkHelper;

    private constructor() { super(); }

    static getInstance(): MultiplayerNetworkHelper {
        if (!MultiplayerNetworkHelper.instance) {
            MultiplayerNetworkHelper.instance = new MultiplayerNetworkHelper();
        }
        return MultiplayerNetworkHelper.instance;
    }

    // ========================================================================
    // ARCHITECTURE RECOMMENDATIONS
    // ========================================================================

    recommendArchitecture(gameType: string, maxPlayers: number): NetworkConfig {
        if (maxPlayers <= 4) {
            // Small games can use P2P
            return {
                topology: 'peer-to-peer',
                syncStrategy: 'state-sync',
                tickRate: 30,
                interpolationDelay: 100,
                maxPlayers
            };
        } else if (maxPlayers <= 32) {
            // Medium games
            return {
                topology: 'client-server',
                syncStrategy: 'state-sync',
                tickRate: 64,
                interpolationDelay: 100,
                maxPlayers
            };
        } else {
            // MMO-scale
            return {
                topology: 'client-server',
                syncStrategy: 'event-sync',
                tickRate: 20,
                interpolationDelay: 200,
                maxPlayers
            };
        }
    }

    // ========================================================================
    // SERVER CODE TEMPLATES
    // ========================================================================

    generateServerCode(library: 'socket.io' | 'ws' | 'colyseus' | 'photon'): string {
        const templates: Record<string, string> = {
            'socket.io': `
// Socket.IO Game Server
const io = require('socket.io')(3000, {
    cors: { origin: '*' }
});

const gameState = {
    players: new Map(),
    tick: 0
};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Add player to game
    gameState.players.set(socket.id, {
        id: socket.id,
        x: Math.random() * 800,
        y: Math.random() * 600,
        score: 0
    });
    
    // Send current state to new player
    socket.emit('gameState', {
        players: Array.from(gameState.players.values())
    });
    
    // Broadcast new player to others
    socket.broadcast.emit('playerJoined', gameState.players.get(socket.id));
    
    // Handle player movement
    socket.on('move', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.timestamp = Date.now();
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        gameState.players.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

// Game loop - broadcast state at tick rate
setInterval(() => {
    gameState.tick++;
    io.emit('stateUpdate', {
        tick: gameState.tick,
        players: Array.from(gameState.players.values())
    });
}, 1000 / 64); // 64 tick rate

console.log('Game server running on port 3000');`,

            'ws': `
// WebSocket Game Server (ws library)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const players = new Map();
let tick = 0;

wss.on('connection', (ws) => {
    const playerId = Date.now().toString(36) + Math.random().toString(36);
    
    players.set(playerId, {
        id: playerId,
        x: Math.random() * 800,
        y: Math.random() * 600,
        ws
    });
    
    // Send player their ID
    ws.send(JSON.stringify({ type: 'welcome', playerId }));
    
    // Handle messages
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        
        switch (message.type) {
            case 'move':
                const player = players.get(playerId);
                player.x = message.x;
                player.y = message.y;
                break;
        }
    });
    
    ws.on('close', () => {
        players.delete(playerId);
        broadcast({ type: 'playerLeft', playerId });
    });
});

function broadcast(message) {
    const data = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Game loop
setInterval(() => {
    tick++;
    const state = Array.from(players.entries()).map(([id, p]) => ({
        id, x: p.x, y: p.y
    }));
    broadcast({ type: 'state', tick, players: state });
}, 1000 / 60);`,

            'colyseus': `
// Colyseus Game Server
import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

class Player extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") score: number = 0;
}

class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
}

export class GameRoom extends Room<GameState> {
    onCreate() {
        this.setState(new GameState());
        
        this.onMessage("move", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
            }
        });
    }
    
    onJoin(client: Client) {
        const player = new Player();
        player.x = Math.random() * 800;
        player.y = Math.random() * 600;
        this.state.players.set(client.sessionId, player);
    }
    
    onLeave(client: Client) {
        this.state.players.delete(client.sessionId);
    }
}`,

            'photon': `
// Photon Unity Networking (C#)
using Photon.Pun;
using Photon.Realtime;
using UnityEngine;

public class NetworkManager : MonoBehaviourPunCallbacks {
    void Start() {
        PhotonNetwork.ConnectUsingSettings();
    }
    
    public override void OnConnectedToMaster() {
        PhotonNetwork.JoinOrCreateRoom("GameRoom", 
            new RoomOptions { MaxPlayers = 4 }, null);
    }
    
    public override void OnJoinedRoom() {
        // Spawn player
        PhotonNetwork.Instantiate("Player", 
            new Vector3(Random.Range(-5, 5), 0, Random.Range(-5, 5)), 
            Quaternion.identity);
    }
}

// Player synchronization
public class PlayerSync : MonoBehaviourPun, IPunObservable {
    private Vector3 networkPosition;
    
    void Update() {
        if (!photonView.IsMine) {
            transform.position = Vector3.Lerp(
                transform.position, 
                networkPosition, 
                Time.deltaTime * 10
            );
        }
    }
    
    public void OnPhotonSerializeView(PhotonStream stream, PhotonMessageInfo info) {
        if (stream.IsWriting) {
            stream.SendNext(transform.position);
        } else {
            networkPosition = (Vector3)stream.ReceiveNext();
        }
    }
}`
        };

        return templates[library] || templates['socket.io'];
    }

    // ========================================================================
    // CLIENT CODE TEMPLATES
    // ========================================================================

    generateClientCode(library: 'socket.io' | 'ws'): string {
        const templates: Record<string, string> = {
            'socket.io': `
// Socket.IO Game Client
import { io } from 'socket.io-client';

class GameClient {
    constructor(serverUrl) {
        this.socket = io(serverUrl);
        this.players = new Map();
        this.localPlayer = null;
        
        this.setupHandlers();
    }
    
    setupHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('gameState', (state) => {
            state.players.forEach(p => {
                this.players.set(p.id, p);
                if (p.id === this.socket.id) {
                    this.localPlayer = p;
                }
            });
        });
        
        this.socket.on('stateUpdate', (state) => {
            state.players.forEach(p => {
                const player = this.players.get(p.id);
                if (player && p.id !== this.socket.id) {
                    // Interpolate remote players
                    player.targetX = p.x;
                    player.targetY = p.y;
                }
            });
        });
        
        this.socket.on('playerJoined', (player) => {
            this.players.set(player.id, player);
        });
        
        this.socket.on('playerLeft', (playerId) => {
            this.players.delete(playerId);
        });
    }
    
    sendMovement(x, y) {
        this.socket.emit('move', { x, y });
        if (this.localPlayer) {
            this.localPlayer.x = x;
            this.localPlayer.y = y;
        }
    }
    
    update(deltaTime) {
        // Interpolate remote players
        this.players.forEach((player, id) => {
            if (id !== this.socket.id && player.targetX !== undefined) {
                player.x += (player.targetX - player.x) * 0.1;
                player.y += (player.targetY - player.y) * 0.1;
            }
        });
    }
}

const client = new GameClient('http://localhost:3000');`,

            'ws': `
// WebSocket Game Client
class GameClient {
    constructor(serverUrl) {
        this.ws = new WebSocket(serverUrl);
        this.playerId = null;
        this.players = new Map();
        
        this.ws.onopen = () => console.log('Connected');
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                this.playerId = message.playerId;
                break;
            case 'state':
                message.players.forEach(p => {
                    this.players.set(p.id, p);
                });
                break;
            case 'playerLeft':
                this.players.delete(message.playerId);
                break;
        }
    }
    
    sendMovement(x, y) {
        this.ws.send(JSON.stringify({
            type: 'move', x, y
        }));
    }
}`
        };

        return templates[library] || templates['socket.io'];
    }

    // ========================================================================
    // LAG COMPENSATION
    // ========================================================================

    generateLagCompensationCode(): string {
        return `
// Client-Side Prediction + Server Reconciliation
class PredictedPlayer {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.pendingInputs = [];
        this.inputSequence = 0;
    }
    
    // Apply input locally (client-side prediction)
    applyInput(input) {
        this.inputSequence++;
        
        // Apply movement
        this.position.x += input.dx;
        this.position.y += input.dy;
        
        // Store for reconciliation
        this.pendingInputs.push({
            sequence: this.inputSequence,
            input: input
        });
        
        // Send to server
        sendToServer({
            type: 'input',
            sequence: this.inputSequence,
            input: input
        });
    }
    
    // Reconcile with authoritative server state
    reconcile(serverState) {
        // Set position to server's authoritative position
        this.position.x = serverState.x;
        this.position.y = serverState.y;
        
        // Remove acknowledged inputs
        this.pendingInputs = this.pendingInputs.filter(
            pi => pi.sequence > serverState.lastProcessedInput
        );
        
        // Re-apply unacknowledged inputs
        this.pendingInputs.forEach(pi => {
            this.position.x += pi.input.dx;
            this.position.y += pi.input.dy;
        });
    }
}

// Entity Interpolation for remote players
class InterpolatedPlayer {
    constructor() {
        this.positionBuffer = [];
        this.renderTimestamp = 0;
    }
    
    addSnapshot(timestamp, x, y) {
        this.positionBuffer.push({ timestamp, x, y });
        
        // Keep only recent snapshots
        while (this.positionBuffer.length > 10) {
            this.positionBuffer.shift();
        }
    }
    
    getInterpolatedPosition(renderDelay = 100) {
        const renderTime = Date.now() - renderDelay;
        
        // Find surrounding snapshots
        for (let i = 1; i < this.positionBuffer.length; i++) {
            const prev = this.positionBuffer[i - 1];
            const next = this.positionBuffer[i];
            
            if (renderTime >= prev.timestamp && renderTime <= next.timestamp) {
                const t = (renderTime - prev.timestamp) / (next.timestamp - prev.timestamp);
                return {
                    x: prev.x + (next.x - prev.x) * t,
                    y: prev.y + (next.y - prev.y) * t
                };
            }
        }
        
        // Fallback to latest
        const latest = this.positionBuffer[this.positionBuffer.length - 1];
        return latest ? { x: latest.x, y: latest.y } : { x: 0, y: 0 };
    }
}`;
    }
}

export const multiplayerNetworkHelper = MultiplayerNetworkHelper.getInstance();
