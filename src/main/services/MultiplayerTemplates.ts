/**
 * 🌐 Multiplayer Templates
 * 
 * Real networking code templates:
 * - Socket.IO integration
 * - Colyseus rooms
 * - WebSocket raw
 * - P2P basics
 */

import { EventEmitter } from 'events';

export type NetworkingLib = 'socketio' | 'colyseus' | 'websocket' | 'webrtc';

export interface MultiplayerConfig {
    library: NetworkingLib;
    maxPlayers: number;
    tickRate: number;
    features: string[];
}

export class MultiplayerTemplates extends EventEmitter {
    private static instance: MultiplayerTemplates;

    private constructor() { super(); }

    static getInstance(): MultiplayerTemplates {
        if (!MultiplayerTemplates.instance) {
            MultiplayerTemplates.instance = new MultiplayerTemplates();
        }
        return MultiplayerTemplates.instance;
    }

    // ========================================================================
    // SOCKET.IO
    // ========================================================================

    generateSocketIOServer(): string {
        return `
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Game state
const players = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
    console.log(\`Player connected: \${socket.id}\`);

    // Player joins
    socket.on('join', (data) => {
        players.set(socket.id, {
            id: socket.id,
            name: data.name,
            x: 400,
            y: 300,
            score: 0
        });

        // Send current players to new player
        socket.emit('currentPlayers', Object.fromEntries(players));
        
        // Notify others
        socket.broadcast.emit('playerJoined', players.get(socket.id));
    });

    // Player moves
    socket.on('move', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x,
                y: data.y
            });
        }
    });

    // Player action
    socket.on('action', (data) => {
        socket.broadcast.emit('playerAction', {
            id: socket.id,
            action: data.action,
            target: data.target
        });
    });

    // Chat
    socket.on('chat', (message) => {
        io.emit('chatMessage', {
            id: socket.id,
            name: players.get(socket.id)?.name || 'Unknown',
            message
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        players.delete(socket.id);
        io.emit('playerLeft', socket.id);
        console.log(\`Player disconnected: \${socket.id}\`);
    });
});

// Game loop (20 ticks/second)
setInterval(() => {
    io.emit('gameState', {
        players: Object.fromEntries(players),
        timestamp: Date.now()
    });
}, 50);

server.listen(3000, () => {
    console.log('Multiplayer server running on port 3000');
});
`;
    }

    generateSocketIOClient(): string {
        return `
import { io } from 'socket.io-client';

class NetworkManager {
    constructor(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl);
        this.players = new Map();
        this.localPlayer = null;
        this.callbacks = {};

        this.setupListeners();
    }

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.onConnect?.();
        });

        this.socket.on('currentPlayers', (players) => {
            Object.entries(players).forEach(([id, data]) => {
                this.players.set(id, data);
            });
        });

        this.socket.on('playerJoined', (player) => {
            this.players.set(player.id, player);
            this.onPlayerJoined?.(player);
        });

        this.socket.on('playerMoved', (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.x = data.x;
                player.y = data.y;
            }
        });

        this.socket.on('playerLeft', (id) => {
            this.players.delete(id);
            this.onPlayerLeft?.(id);
        });

        this.socket.on('gameState', (state) => {
            this.onGameState?.(state);
        });

        this.socket.on('chatMessage', (msg) => {
            this.onChatMessage?.(msg);
        });
    }

    join(name) {
        this.socket.emit('join', { name });
    }

    move(x, y) {
        this.socket.emit('move', { x, y });
    }

    action(action, target) {
        this.socket.emit('action', { action, target });
    }

    chat(message) {
        this.socket.emit('chat', message);
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    getPlayerId() {
        return this.socket.id;
    }
}

export const network = new NetworkManager();
`;
    }

    // ========================================================================
    // COLYSEUS
    // ========================================================================

    generateColyseusRoom(): string {
        return `
import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';

class Player extends Schema {
    @type('string') id = '';
    @type('string') name = '';
    @type('number') x = 0;
    @type('number') y = 0;
    @type('number') health = 100;
    @type('number') score = 0;
}

class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
}

export class GameRoom extends Room<GameState> {
    maxClients = 10;

    onCreate(options) {
        this.setState(new GameState());

        // Handle movement
        this.onMessage('move', (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
            }
        });

        // Handle attacks
        this.onMessage('attack', (client, data) => {
            const attacker = this.state.players.get(client.sessionId);
            const target = this.state.players.get(data.targetId);
            
            if (attacker && target) {
                target.health -= data.damage;
                if (target.health <= 0) {
                    attacker.score += 10;
                    this.respawnPlayer(target);
                }
            }
        });

        // Game loop
        this.setSimulationInterval(() => this.update(), 1000 / 20);
    }

    onJoin(client, options) {
        const player = new Player();
        player.id = client.sessionId;
        player.name = options.name || 'Player';
        player.x = Math.random() * 800;
        player.y = Math.random() * 600;
        
        this.state.players.set(client.sessionId, player);
        console.log(\`\${player.name} joined\`);
    }

    onLeave(client) {
        this.state.players.delete(client.sessionId);
    }

    update() {
        // Game logic here
    }

    respawnPlayer(player) {
        player.x = Math.random() * 800;
        player.y = Math.random() * 600;
        player.health = 100;
    }
}
`;
    }

    generateColyseusClient(): string {
        return `
import { Client, Room } from 'colyseus.js';

class ColyseusManager {
    constructor() {
        this.client = new Client('ws://localhost:2567');
        this.room = null;
    }

    async joinRoom(roomName, options = {}) {
        try {
            this.room = await this.client.joinOrCreate(roomName, options);
            this.setupListeners();
            return this.room;
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    }

    setupListeners() {
        this.room.state.players.onAdd((player, key) => {
            console.log(\`Player joined: \${player.name}\`);
            this.onPlayerJoined?.(player);
        });

        this.room.state.players.onChange((player, key) => {
            this.onPlayerChanged?.(player);
        });

        this.room.state.players.onRemove((player, key) => {
            console.log(\`Player left: \${player.name}\`);
            this.onPlayerLeft?.(player);
        });
    }

    move(x, y) {
        this.room?.send('move', { x, y });
    }

    attack(targetId, damage) {
        this.room?.send('attack', { targetId, damage });
    }

    getState() {
        return this.room?.state;
    }

    getSessionId() {
        return this.room?.sessionId;
    }
}

export const colyseus = new ColyseusManager();
`;
    }

    // ========================================================================
    // LOBBY SYSTEM
    // ========================================================================

    generateLobbyCode(): string {
        return `
// Lobby System
class Lobby {
    constructor(network) {
        this.network = network;
        this.players = [];
        this.ready = new Set();
        this.host = null;
        this.settings = {
            maxPlayers: 4,
            gameMode: 'deathmatch',
            map: 'default'
        };
    }

    join(playerName) {
        this.network.emit('lobbyJoin', { name: playerName });
    }

    leave() {
        this.network.emit('lobbyLeave');
    }

    setReady(isReady) {
        this.network.emit('lobbyReady', { ready: isReady });
    }

    updateSettings(settings) {
        if (this.isHost()) {
            this.settings = { ...this.settings, ...settings };
            this.network.emit('lobbySettings', this.settings);
        }
    }

    startGame() {
        if (this.isHost() && this.canStart()) {
            this.network.emit('lobbyStart');
        }
    }

    isHost() {
        return this.host === this.network.getPlayerId();
    }

    canStart() {
        return this.players.every(p => this.ready.has(p.id));
    }

    // Event handlers
    onPlayerJoined(player) {
        this.players.push(player);
        if (!this.host) this.host = player.id;
    }

    onPlayerLeft(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.ready.delete(playerId);
        if (this.host === playerId && this.players.length > 0) {
            this.host = this.players[0].id;
        }
    }

    onPlayerReady(playerId, isReady) {
        if (isReady) this.ready.add(playerId);
        else this.ready.delete(playerId);
    }
}

export default Lobby;
`;
    }

    getTemplate(library: NetworkingLib): { server: string; client: string } {
        switch (library) {
            case 'socketio':
                return { server: this.generateSocketIOServer(), client: this.generateSocketIOClient() };
            case 'colyseus':
                return { server: this.generateColyseusRoom(), client: this.generateColyseusClient() };
            default:
                return { server: '', client: '' };
        }
    }
}

export const multiplayerTemplates = MultiplayerTemplates.getInstance();
