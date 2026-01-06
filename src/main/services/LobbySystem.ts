/**
 * 🎮 Lobby System
 * 
 * Multiplayer lobbies:
 * - Room management
 * - Matchmaking
 * - Ready states
 */

import { EventEmitter } from 'events';

export interface LobbyRoom {
    id: string;
    name: string;
    host: string;
    players: string[];
    maxPlayers: number;
    settings: any;
    state: 'waiting' | 'starting' | 'playing';
}

export class LobbySystem extends EventEmitter {
    private static instance: LobbySystem;

    private constructor() { super(); }

    static getInstance(): LobbySystem {
        if (!LobbySystem.instance) {
            LobbySystem.instance = new LobbySystem();
        }
        return LobbySystem.instance;
    }

    generateLobbyCode(): string {
        return `
class LobbySystem {
    constructor(socket) {
        this.socket = socket;
        this.rooms = new Map();
        this.playerId = null;
        this.currentRoom = null;
        
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('room:created', (room) => {
            this.rooms.set(room.id, room);
            this.onRoomCreated?.(room);
        });

        this.socket.on('room:updated', (room) => {
            this.rooms.set(room.id, room);
            if (this.currentRoom?.id === room.id) {
                this.currentRoom = room;
            }
            this.onRoomUpdated?.(room);
        });

        this.socket.on('room:deleted', (roomId) => {
            this.rooms.delete(roomId);
            if (this.currentRoom?.id === roomId) {
                this.currentRoom = null;
                this.onKicked?.('Room was closed');
            }
            this.onRoomDeleted?.(roomId);
        });

        this.socket.on('room:joined', (data) => {
            this.currentRoom = data.room;
            this.onJoined?.(data.room);
        });

        this.socket.on('room:left', () => {
            this.currentRoom = null;
            this.onLeft?.();
        });

        this.socket.on('room:kicked', (reason) => {
            this.currentRoom = null;
            this.onKicked?.(reason);
        });

        this.socket.on('room:chat', (message) => {
            this.onChat?.(message);
        });

        this.socket.on('game:starting', (countdown) => {
            this.onGameStarting?.(countdown);
        });

        this.socket.on('game:started', (gameData) => {
            this.onGameStarted?.(gameData);
        });

        this.socket.on('room:list', (rooms) => {
            this.rooms.clear();
            for (const room of rooms) {
                this.rooms.set(room.id, room);
            }
            this.onRoomList?.(rooms);
        });
    }

    connect(playerId) {
        this.playerId = playerId;
        this.socket.emit('lobby:join', { playerId });
    }

    disconnect() {
        if (this.currentRoom) {
            this.leaveRoom();
        }
        this.socket.emit('lobby:leave');
    }

    refreshRooms() {
        this.socket.emit('room:list');
    }

    createRoom(options) {
        this.socket.emit('room:create', {
            name: options.name || 'Game Room',
            maxPlayers: options.maxPlayers || 4,
            settings: options.settings || {},
            password: options.password || null
        });
    }

    joinRoom(roomId, password = null) {
        this.socket.emit('room:join', { roomId, password });
    }

    leaveRoom() {
        if (!this.currentRoom) return;
        this.socket.emit('room:leave');
        this.currentRoom = null;
    }

    setReady(ready) {
        if (!this.currentRoom) return;
        this.socket.emit('room:ready', { ready });
    }

    updateSettings(settings) {
        if (!this.currentRoom || this.currentRoom.host !== this.playerId) return;
        this.socket.emit('room:settings', { settings });
    }

    kickPlayer(targetId) {
        if (!this.currentRoom || this.currentRoom.host !== this.playerId) return;
        this.socket.emit('room:kick', { targetId });
    }

    startGame() {
        if (!this.currentRoom || this.currentRoom.host !== this.playerId) return;
        this.socket.emit('game:start');
    }

    sendChat(message) {
        if (!this.currentRoom) return;
        this.socket.emit('room:chat', { message });
    }

    getAvailableRooms() {
        return Array.from(this.rooms.values())
            .filter(r => r.state === 'waiting' && r.players.length < r.maxPlayers);
    }

    isHost() {
        return this.currentRoom?.host === this.playerId;
    }

    // Quick match
    findMatch(criteria = {}) {
        const available = this.getAvailableRooms()
            .filter(r => {
                if (criteria.minPlayers && r.players.length < criteria.minPlayers) return false;
                if (criteria.maxPlayers && r.maxPlayers > criteria.maxPlayers) return false;
                return true;
            })
            .sort((a, b) => b.players.length - a.players.length);
        
        if (available.length > 0) {
            this.joinRoom(available[0].id);
            return available[0];
        }
        
        // Create new room
        this.createRoom({ name: 'Quick Match', ...criteria });
        return null;
    }

    // Callbacks
    onRoomCreated = null;
    onRoomUpdated = null;
    onRoomDeleted = null;
    onRoomList = null;
    onJoined = null;
    onLeft = null;
    onKicked = null;
    onChat = null;
    onGameStarting = null;
    onGameStarted = null;
}

// Server-side reference implementation
class LobbyServer {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.players = new Map();
        
        io.on('connection', (socket) => this.handleConnection(socket));
    }

    handleConnection(socket) {
        socket.on('lobby:join', (data) => {
            this.players.set(socket.id, {
                id: data.playerId,
                socket,
                room: null,
                ready: false
            });
            socket.emit('room:list', Array.from(this.rooms.values()));
        });

        socket.on('room:create', (options) => {
            const room = {
                id: 'room_' + Date.now(),
                name: options.name,
                host: socket.id,
                players: [socket.id],
                maxPlayers: options.maxPlayers,
                settings: options.settings,
                password: options.password,
                state: 'waiting',
                readyStates: new Map()
            };
            
            this.rooms.set(room.id, room);
            socket.join(room.id);
            this.players.get(socket.id).room = room.id;
            
            socket.emit('room:joined', { room: this.sanitizeRoom(room) });
            this.io.emit('room:created', this.sanitizeRoom(room));
        });

        socket.on('room:join', (data) => {
            const room = this.rooms.get(data.roomId);
            if (!room) return socket.emit('error', 'Room not found');
            if (room.players.length >= room.maxPlayers) return socket.emit('error', 'Room full');
            if (room.password && room.password !== data.password) return socket.emit('error', 'Wrong password');
            
            room.players.push(socket.id);
            socket.join(room.id);
            this.players.get(socket.id).room = room.id;
            
            socket.emit('room:joined', { room: this.sanitizeRoom(room) });
            this.io.to(room.id).emit('room:updated', this.sanitizeRoom(room));
        });

        socket.on('game:start', () => {
            const player = this.players.get(socket.id);
            if (!player?.room) return;
            
            const room = this.rooms.get(player.room);
            if (!room || room.host !== socket.id) return;
            
            room.state = 'starting';
            this.io.to(room.id).emit('game:starting', 3);
            
            setTimeout(() => {
                room.state = 'playing';
                this.io.to(room.id).emit('game:started', { roomId: room.id });
            }, 3000);
        });

        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });
    }

    handleDisconnect(socket) {
        const player = this.players.get(socket.id);
        if (player?.room) {
            const room = this.rooms.get(player.room);
            if (room) {
                room.players = room.players.filter(p => p !== socket.id);
                if (room.players.length === 0) {
                    this.rooms.delete(room.id);
                    this.io.emit('room:deleted', room.id);
                } else {
                    if (room.host === socket.id) {
                        room.host = room.players[0];
                    }
                    this.io.to(room.id).emit('room:updated', this.sanitizeRoom(room));
                }
            }
        }
        this.players.delete(socket.id);
    }

    sanitizeRoom(room) {
        return {
            id: room.id,
            name: room.name,
            host: room.host,
            players: room.players,
            maxPlayers: room.maxPlayers,
            settings: room.settings,
            state: room.state,
            hasPassword: !!room.password
        };
    }
}`;
    }
}

export const lobbySystem = LobbySystem.getInstance();
