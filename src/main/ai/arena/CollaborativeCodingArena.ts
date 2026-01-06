/**
 * Collaborative Coding Arena
 * Real-time multiplayer coding challenges and pair programming
 * Grok Recommendation: Collaborative Coding Arena
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface ArenaPlayer {
    id: string;
    username: string;
    avatar?: string;
    rating: number;
    status: 'idle' | 'searching' | 'in_game' | 'spectating';
    currentRoom?: string;
    stats: {
        wins: number;
        losses: number;
        draws: number;
        totalGames: number;
    };
}

interface ArenaRoom {
    id: string;
    name: string;
    type: 'duel' | 'team' | 'royale' | 'cooperative';
    status: 'waiting' | 'countdown' | 'active' | 'finished';
    players: ArenaPlayer[];
    spectators: ArenaPlayer[];
    challenge: ArenaChallenge;
    submissions: Submission[];
    startTime?: Date;
    endTime?: Date;
    winner?: string | string[];
    config: RoomConfig;
}

interface RoomConfig {
    maxPlayers: number;
    timeLimit: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    language: string;
    isRanked: boolean;
    allowSpectators: boolean;
}

interface ArenaChallenge {
    id: string;
    title: string;
    description: string;
    difficulty: RoomConfig['difficulty'];
    initialCode: string;
    testCases: { input: string; expected: string; hidden?: boolean }[];
    hints: string[];
    examples: { input: string; output: string; explanation?: string }[];
    timeLimit: number;
    memoryLimit: number;
}

interface Submission {
    id: string;
    playerId: string;
    code: string;
    timestamp: Date;
    result: {
        passed: number;
        failed: number;
        total: number;
        executionTime: number;
        memoryUsed: number;
        status: 'pending' | 'running' | 'passed' | 'failed' | 'error' | 'timeout';
    };
    score: number;
}

interface LiveCursor {
    playerId: string;
    position: { line: number; column: number };
    selection?: { startLine: number; startCol: number; endLine: number; endCol: number };
}

interface ChatMessage {
    id: string;
    playerId: string;
    username: string;
    content: string;
    timestamp: Date;
    type: 'message' | 'system' | 'emote';
}

interface TournamentBracket {
    id: string;
    name: string;
    rounds: TournamentRound[];
    participants: string[];
    currentRound: number;
    status: 'registration' | 'active' | 'completed';
}

interface TournamentRound {
    roundNumber: number;
    matches: { roomId: string; players: string[]; winner?: string }[];
}

export class CollaborativeCodingArena extends EventEmitter {
    private static instance: CollaborativeCodingArena;
    private players: Map<string, ArenaPlayer> = new Map();
    private rooms: Map<string, ArenaRoom> = new Map();
    private challenges: Map<string, ArenaChallenge> = new Map();
    private matchmakingQueue: string[] = [];
    private tournaments: Map<string, TournamentBracket> = new Map();

    private constructor() {
        super();
        this.initializeChallenges();
    }

    static getInstance(): CollaborativeCodingArena {
        if (!CollaborativeCodingArena.instance) {
            CollaborativeCodingArena.instance = new CollaborativeCodingArena();
        }
        return CollaborativeCodingArena.instance;
    }

    private initializeChallenges(): void {
        const challenges: ArenaChallenge[] = [
            {
                id: 'two_sum',
                title: 'Two Sum',
                description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                difficulty: 'easy',
                initialCode: 'function twoSum(nums: number[], target: number): number[] {\n  // Your code here\n}',
                testCases: [
                    { input: '[2,7,11,15], 9', expected: '[0,1]' },
                    { input: '[3,2,4], 6', expected: '[1,2]' },
                    { input: '[3,3], 6', expected: '[0,1]' },
                    { input: '[1,2,3,4,5], 9', expected: '[3,4]', hidden: true }
                ],
                hints: ['Try using a hash map', 'Store the complement as you iterate'],
                examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' }],
                timeLimit: 1000,
                memoryLimit: 256
            },
            {
                id: 'valid_parentheses',
                title: 'Valid Parentheses',
                description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
                difficulty: 'easy',
                initialCode: 'function isValid(s: string): boolean {\n  // Your code here\n}',
                testCases: [
                    { input: '"()"', expected: 'true' },
                    { input: '"()[]{}"', expected: 'true' },
                    { input: '"(]"', expected: 'false' },
                    { input: '"{[]}"', expected: 'true', hidden: true }
                ],
                hints: ['Use a stack', 'Match opening brackets with closing ones'],
                examples: [{ input: 's = "()"', output: 'true' }],
                timeLimit: 500,
                memoryLimit: 128
            },
            {
                id: 'merge_intervals',
                title: 'Merge Intervals',
                description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.',
                difficulty: 'medium',
                initialCode: 'function merge(intervals: number[][]): number[][] {\n  // Your code here\n}',
                testCases: [
                    { input: '[[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]' },
                    { input: '[[1,4],[4,5]]', expected: '[[1,5]]' }
                ],
                hints: ['Sort by start time first', 'Compare end of current with start of next'],
                examples: [{ input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' }],
                timeLimit: 1000,
                memoryLimit: 256
            },
            {
                id: 'lru_cache',
                title: 'LRU Cache',
                description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
                difficulty: 'hard',
                initialCode: 'class LRUCache {\n  constructor(capacity: number) {\n    // Your code here\n  }\n\n  get(key: number): number {\n    // Your code here\n  }\n\n  put(key: number, value: number): void {\n    // Your code here\n  }\n}',
                testCases: [
                    { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', expected: '[null,null,null,1,null,-1,null,-1,3,4]' }
                ],
                hints: ['Use a Map for O(1) access', 'Doubly linked list for O(1) removal'],
                examples: [{ input: 'See problem description', output: 'See expected' }],
                timeLimit: 2000,
                memoryLimit: 512
            }
        ];

        challenges.forEach(c => this.challenges.set(c.id, c));
    }

    registerPlayer(username: string, avatar?: string): ArenaPlayer {
        const player: ArenaPlayer = {
            id: crypto.randomUUID(),
            username,
            avatar,
            rating: 1200,
            status: 'idle',
            stats: { wins: 0, losses: 0, draws: 0, totalGames: 0 }
        };

        this.players.set(player.id, player);
        this.emit('playerRegistered', player);
        return player;
    }

    createRoom(config: Partial<RoomConfig> & { name: string; creatorId: string }): ArenaRoom {
        const challenge = this.getRandomChallenge(config.difficulty || 'medium');

        const room: ArenaRoom = {
            id: crypto.randomUUID(),
            name: config.name,
            type: config.maxPlayers === 2 ? 'duel' : config.maxPlayers && config.maxPlayers > 4 ? 'royale' : 'team',
            status: 'waiting',
            players: [],
            spectators: [],
            challenge,
            submissions: [],
            config: {
                maxPlayers: config.maxPlayers || 2,
                timeLimit: config.timeLimit || 900000, // 15 minutes
                difficulty: config.difficulty || 'medium',
                language: config.language || 'typescript',
                isRanked: config.isRanked !== false,
                allowSpectators: config.allowSpectators !== false
            }
        };

        const creator = this.players.get(config.creatorId);
        if (creator) {
            room.players.push(creator);
            creator.status = 'in_game';
            creator.currentRoom = room.id;
        }

        this.rooms.set(room.id, room);
        this.emit('roomCreated', room);
        return room;
    }

    joinRoom(roomId: string, playerId: string, asSpectator: boolean = false): boolean {
        const room = this.rooms.get(roomId);
        const player = this.players.get(playerId);

        if (!room || !player) return false;
        if (room.status !== 'waiting' && !asSpectator) return false;

        if (asSpectator) {
            if (!room.config.allowSpectators) return false;
            room.spectators.push(player);
            player.status = 'spectating';
        } else {
            if (room.players.length >= room.config.maxPlayers) return false;
            room.players.push(player);
            player.status = 'in_game';
        }

        player.currentRoom = room.id;
        this.emit('playerJoined', { room, player, asSpectator });

        if (room.players.length === room.config.maxPlayers) {
            this.startCountdown(roomId);
        }

        return true;
    }

    private startCountdown(roomId: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.status = 'countdown';
        this.emit('countdownStarted', { roomId, seconds: 5 });

        setTimeout(() => {
            this.startGame(roomId);
        }, 5000);
    }

    private startGame(roomId: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.status = 'active';
        room.startTime = new Date();

        this.emit('gameStarted', { room });

        // Set timeout for game end
        setTimeout(() => {
            if (room.status === 'active') {
                this.endGame(roomId);
            }
        }, room.config.timeLimit);
    }

    submitSolution(roomId: string, playerId: string, code: string): Submission {
        const room = this.rooms.get(roomId);
        const player = this.players.get(playerId);

        if (!room || !player || room.status !== 'active') {
            throw new Error('Cannot submit solution');
        }

        const submission: Submission = {
            id: crypto.randomUUID(),
            playerId,
            code,
            timestamp: new Date(),
            result: {
                passed: 0,
                failed: 0,
                total: room.challenge.testCases.length,
                executionTime: 0,
                memoryUsed: 0,
                status: 'pending'
            },
            score: 0
        };

        // Simulate test execution
        submission.result = this.runTests(code, room.challenge);
        submission.score = this.calculateScore(submission, room);

        room.submissions.push(submission);
        this.emit('solutionSubmitted', { room, submission });

        // Check for early victory
        if (submission.result.status === 'passed') {
            const otherSubmissions = room.submissions.filter(s => s.playerId !== playerId && s.result.status === 'passed');
            if (otherSubmissions.length === 0) {
                this.endGame(roomId, playerId);
            }
        }

        return submission;
    }

    private runTests(code: string, challenge: ArenaChallenge): Submission['result'] {
        const startTime = Date.now();
        let passed = 0;
        let failed = 0;

        // Simulate test execution (in production, would use sandboxed execution)
        for (const testCase of challenge.testCases) {
            // Simplified: randomly pass/fail based on code length (placeholder)
            const testPassed = code.length > 50 && Math.random() > 0.3;
            if (testPassed) {
                passed++;
            } else {
                failed++;
            }
        }

        const executionTime = Date.now() - startTime + Math.floor(Math.random() * 100);
        const memoryUsed = 10 + Math.floor(Math.random() * 50);

        return {
            passed,
            failed,
            total: challenge.testCases.length,
            executionTime,
            memoryUsed,
            status: failed === 0 ? 'passed' : 'failed'
        };
    }

    private calculateScore(submission: Submission, room: ArenaRoom): number {
        let score = 0;

        // Points for passed tests
        score += submission.result.passed * 100;

        // Time bonus
        if (room.startTime) {
            const timeTaken = submission.timestamp.getTime() - room.startTime.getTime();
            const maxTime = room.config.timeLimit;
            const timeBonus = Math.floor((1 - timeTaken / maxTime) * 200);
            score += Math.max(0, timeBonus);
        }

        // Efficiency bonus
        if (submission.result.executionTime < 100) {
            score += 50;
        }

        return score;
    }

    private endGame(roomId: string, winnerId?: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.status = 'finished';
        room.endTime = new Date();

        if (winnerId) {
            room.winner = winnerId;
        } else {
            // Determine winner by score
            const scores = new Map<string, number>();
            for (const sub of room.submissions) {
                const current = scores.get(sub.playerId) || 0;
                scores.set(sub.playerId, Math.max(current, sub.score));
            }

            let maxScore = 0;
            let winner = '';
            for (const [playerId, score] of scores) {
                if (score > maxScore) {
                    maxScore = score;
                    winner = playerId;
                }
            }
            room.winner = winner;
        }

        // Update player stats
        for (const player of room.players) {
            player.stats.totalGames++;
            if (room.winner === player.id) {
                player.stats.wins++;
                player.rating += 25;
            } else {
                player.stats.losses++;
                player.rating = Math.max(0, player.rating - 15);
            }
            player.status = 'idle';
            player.currentRoom = undefined;
        }

        this.emit('gameEnded', { room, winner: room.winner });
    }

    findMatch(playerId: string): { queued: boolean; estimatedWait: number } {
        const player = this.players.get(playerId);
        if (!player) return { queued: false, estimatedWait: 0 };

        player.status = 'searching';
        this.matchmakingQueue.push(playerId);

        // Try to match with similar rating
        const match = this.matchmakingQueue.find(id => {
            if (id === playerId) return false;
            const other = this.players.get(id);
            if (!other) return false;
            return Math.abs(other.rating - player.rating) < 200;
        });

        if (match) {
            this.matchmakingQueue = this.matchmakingQueue.filter(id => id !== playerId && id !== match);

            const room = this.createRoom({
                name: 'Ranked Match',
                creatorId: playerId,
                isRanked: true,
                difficulty: 'medium'
            });

            this.joinRoom(room.id, match);
            return { queued: true, estimatedWait: 0 };
        }

        return { queued: true, estimatedWait: Math.floor(this.matchmakingQueue.length * 10) };
    }

    cancelMatchmaking(playerId: string): void {
        this.matchmakingQueue = this.matchmakingQueue.filter(id => id !== playerId);
        const player = this.players.get(playerId);
        if (player) player.status = 'idle';
    }

    broadcastCursor(roomId: string, cursor: LiveCursor): void {
        const room = this.rooms.get(roomId);
        if (!room) return;
        this.emit('cursorUpdate', { roomId, cursor });
    }

    sendChat(roomId: string, playerId: string, content: string): ChatMessage {
        const player = this.players.get(playerId);
        if (!player) throw new Error('Player not found');

        const message: ChatMessage = {
            id: crypto.randomUUID(),
            playerId,
            username: player.username,
            content,
            timestamp: new Date(),
            type: content.startsWith('/') ? 'emote' : 'message'
        };

        this.emit('chatMessage', { roomId, message });
        return message;
    }

    private getRandomChallenge(difficulty: RoomConfig['difficulty']): ArenaChallenge {
        const challenges = Array.from(this.challenges.values()).filter(c => c.difficulty === difficulty);
        return challenges[Math.floor(Math.random() * challenges.length)] || Array.from(this.challenges.values())[0];
    }

    getRoom(id: string): ArenaRoom | undefined {
        return this.rooms.get(id);
    }

    getPlayer(id: string): ArenaPlayer | undefined {
        return this.players.get(id);
    }

    getOpenRooms(): ArenaRoom[] {
        return Array.from(this.rooms.values()).filter(r => r.status === 'waiting');
    }

    getLeaderboard(): { playerId: string; username: string; rating: number; wins: number }[] {
        return Array.from(this.players.values())
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 100)
            .map(p => ({
                playerId: p.id,
                username: p.username,
                rating: p.rating,
                wins: p.stats.wins
            }));
    }

    getChallenges(): ArenaChallenge[] {
        return Array.from(this.challenges.values());
    }
}

export const collaborativeCodingArena = CollaborativeCodingArena.getInstance();
