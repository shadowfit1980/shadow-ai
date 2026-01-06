/**
 * Multi-Agent Games
 * 
 * Strategic reasoning tests inspired by LMArena's
 * game-based agent evaluation environments.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type GameType = 'tictactoe' | 'connect4' | 'chess' | 'negotiation' | 'debate';

export interface GameState {
    gameId: string;
    type: GameType;
    board: any;
    currentPlayer: number;
    players: GamePlayer[];
    history: GameMove[];
    status: 'active' | 'completed' | 'draw';
    winner?: number;
}

export interface GamePlayer {
    id: string;
    type: 'ai' | 'human';
    model?: string;
    score: number;
}

export interface GameMove {
    player: number;
    action: any;
    reasoning?: string;
    timestamp: Date;
}

export interface GameResult {
    gameId: string;
    winner: string | 'draw';
    scores: Record<string, number>;
    moveCount: number;
    duration: number;
    transcript: GameMove[];
}

// ============================================================================
// MULTI-AGENT GAMES
// ============================================================================

export class MultiAgentGames extends EventEmitter {
    private static instance: MultiAgentGames;
    private activeGames: Map<string, GameState> = new Map();
    private gameResults: GameResult[] = [];

    private constructor() {
        super();
    }

    static getInstance(): MultiAgentGames {
        if (!MultiAgentGames.instance) {
            MultiAgentGames.instance = new MultiAgentGames();
        }
        return MultiAgentGames.instance;
    }

    // ========================================================================
    // GAME MANAGEMENT
    // ========================================================================

    async createGame(
        type: GameType,
        players: Array<{ id: string; model?: string }>
    ): Promise<GameState> {
        const gameId = `game_${type}_${Date.now()}`;

        const state: GameState = {
            gameId,
            type,
            board: this.initializeBoard(type),
            currentPlayer: 0,
            players: players.map(p => ({
                id: p.id,
                type: p.model ? 'ai' : 'human',
                model: p.model,
                score: 0,
            })),
            history: [],
            status: 'active',
        };

        this.activeGames.set(gameId, state);
        this.emit('gameCreated', state);
        return state;
    }

    private initializeBoard(type: GameType): any {
        switch (type) {
            case 'tictactoe':
                return Array(9).fill(null);
            case 'connect4':
                return Array(6).fill(null).map(() => Array(7).fill(null));
            case 'chess':
                return this.initializeChessBoard();
            case 'negotiation':
                return { rounds: [], resources: { a: 100, b: 100 } };
            case 'debate':
                return { topic: '', arguments: [] };
            default:
                return {};
        }
    }

    private initializeChessBoard(): string[][] {
        return [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            Array(8).fill(''),
            Array(8).fill(''),
            Array(8).fill(''),
            Array(8).fill(''),
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
        ];
    }

    async makeMove(
        gameId: string,
        playerId: string,
        action: any,
        reasoning?: string
    ): Promise<{ success: boolean; state: GameState; error?: string }> {
        const state = this.activeGames.get(gameId);
        if (!state) {
            return { success: false, state: state!, error: 'Game not found' };
        }

        if (state.status !== 'active') {
            return { success: false, state, error: 'Game is not active' };
        }

        const playerIndex = state.players.findIndex(p => p.id === playerId);
        if (playerIndex !== state.currentPlayer) {
            return { success: false, state, error: 'Not your turn' };
        }

        // Validate and apply move
        const validationResult = this.validateMove(state, action);
        if (!validationResult.valid) {
            return { success: false, state, error: validationResult.error };
        }

        // Apply move
        this.applyMove(state, action);

        // Record move
        state.history.push({
            player: playerIndex,
            action,
            reasoning,
            timestamp: new Date(),
        });

        // Check for game end
        const gameEnd = this.checkGameEnd(state);
        if (gameEnd.ended) {
            state.status = gameEnd.winner !== undefined ? 'completed' : 'draw';
            state.winner = gameEnd.winner;

            // Record result
            this.recordResult(state);
        } else {
            // Next player
            state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
        }

        this.emit('moveApplied', { gameId, state });
        return { success: true, state };
    }

    // ========================================================================
    // TIC-TAC-TOE
    // ========================================================================

    private validateTicTacToe(state: GameState, action: { position: number }): { valid: boolean; error?: string } {
        const { position } = action;
        if (position < 0 || position > 8) {
            return { valid: false, error: 'Invalid position' };
        }
        if (state.board[position] !== null) {
            return { valid: false, error: 'Position already taken' };
        }
        return { valid: true };
    }

    private applyTicTacToe(state: GameState, action: { position: number }): void {
        state.board[action.position] = state.currentPlayer;
    }

    private checkTicTacToeEnd(state: GameState): { ended: boolean; winner?: number } {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6], // diagonals
        ];

        for (const [a, b, c] of lines) {
            if (state.board[a] !== null &&
                state.board[a] === state.board[b] &&
                state.board[a] === state.board[c]) {
                return { ended: true, winner: state.board[a] };
            }
        }

        // Check for draw
        if (state.board.every((cell: any) => cell !== null)) {
            return { ended: true };
        }

        return { ended: false };
    }

    // ========================================================================
    // CONNECT 4
    // ========================================================================

    private validateConnect4(state: GameState, action: { column: number }): { valid: boolean; error?: string } {
        const { column } = action;
        if (column < 0 || column > 6) {
            return { valid: false, error: 'Invalid column' };
        }
        if (state.board[0][column] !== null) {
            return { valid: false, error: 'Column is full' };
        }
        return { valid: true };
    }

    private applyConnect4(state: GameState, action: { column: number }): void {
        const { column } = action;
        for (let row = 5; row >= 0; row--) {
            if (state.board[row][column] === null) {
                state.board[row][column] = state.currentPlayer;
                break;
            }
        }
    }

    private checkConnect4End(state: GameState): { ended: boolean; winner?: number } {
        // Check horizontal, vertical, and diagonal wins
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const player = state.board[row][col];
                if (player === null) continue;

                // Horizontal
                if (col <= 3 &&
                    player === state.board[row][col + 1] &&
                    player === state.board[row][col + 2] &&
                    player === state.board[row][col + 3]) {
                    return { ended: true, winner: player };
                }

                // Vertical
                if (row <= 2 &&
                    player === state.board[row + 1][col] &&
                    player === state.board[row + 2][col] &&
                    player === state.board[row + 3][col]) {
                    return { ended: true, winner: player };
                }

                // Diagonal down-right
                if (row <= 2 && col <= 3 &&
                    player === state.board[row + 1][col + 1] &&
                    player === state.board[row + 2][col + 2] &&
                    player === state.board[row + 3][col + 3]) {
                    return { ended: true, winner: player };
                }

                // Diagonal up-right
                if (row >= 3 && col <= 3 &&
                    player === state.board[row - 1][col + 1] &&
                    player === state.board[row - 2][col + 2] &&
                    player === state.board[row - 3][col + 3]) {
                    return { ended: true, winner: player };
                }
            }
        }

        // Check for draw
        if (state.board[0].every((cell: any) => cell !== null)) {
            return { ended: true };
        }

        return { ended: false };
    }

    // ========================================================================
    // NEGOTIATION GAME
    // ========================================================================

    private validateNegotiation(state: GameState, action: { offer: Record<string, number> }): { valid: boolean; error?: string } {
        const total = Object.values(action.offer).reduce((a, b) => a + b, 0);
        if (total > 100) {
            return { valid: false, error: 'Offer exceeds available resources' };
        }
        return { valid: true };
    }

    private applyNegotiation(state: GameState, action: { offer: Record<string, number>; accept?: boolean }): void {
        state.board.rounds.push({
            player: state.currentPlayer,
            offer: action.offer,
            accepted: action.accept,
        });

        if (action.accept && state.board.rounds.length > 1) {
            // Deal accepted
            const lastOffer = state.board.rounds[state.board.rounds.length - 2].offer;
            state.players[0].score = lastOffer.a || 0;
            state.players[1].score = lastOffer.b || 0;
        }
    }

    private checkNegotiationEnd(state: GameState): { ended: boolean; winner?: number } {
        const lastRound = state.board.rounds[state.board.rounds.length - 1];
        if (lastRound?.accepted) {
            const winner = state.players[0].score > state.players[1].score ? 0 :
                state.players[1].score > state.players[0].score ? 1 : undefined;
            return { ended: true, winner };
        }
        if (state.board.rounds.length >= 10) {
            return { ended: true }; // Draw after 10 rounds
        }
        return { ended: false };
    }

    // ========================================================================
    // GENERAL GAME LOGIC
    // ========================================================================

    private validateMove(state: GameState, action: any): { valid: boolean; error?: string } {
        switch (state.type) {
            case 'tictactoe':
                return this.validateTicTacToe(state, action);
            case 'connect4':
                return this.validateConnect4(state, action);
            case 'negotiation':
                return this.validateNegotiation(state, action);
            default:
                return { valid: true };
        }
    }

    private applyMove(state: GameState, action: any): void {
        switch (state.type) {
            case 'tictactoe':
                this.applyTicTacToe(state, action);
                break;
            case 'connect4':
                this.applyConnect4(state, action);
                break;
            case 'negotiation':
                this.applyNegotiation(state, action);
                break;
        }
    }

    private checkGameEnd(state: GameState): { ended: boolean; winner?: number } {
        switch (state.type) {
            case 'tictactoe':
                return this.checkTicTacToeEnd(state);
            case 'connect4':
                return this.checkConnect4End(state);
            case 'negotiation':
                return this.checkNegotiationEnd(state);
            default:
                return { ended: false };
        }
    }

    private recordResult(state: GameState): void {
        const result: GameResult = {
            gameId: state.gameId,
            winner: state.winner !== undefined
                ? state.players[state.winner].id
                : 'draw',
            scores: state.players.reduce((acc, p) => {
                acc[p.id] = p.score;
                return acc;
            }, {} as Record<string, number>),
            moveCount: state.history.length,
            duration: state.history.length > 0
                ? state.history[state.history.length - 1].timestamp.getTime() -
                state.history[0].timestamp.getTime()
                : 0,
            transcript: state.history,
        };

        this.gameResults.push(result);
        this.emit('gameCompleted', result);
    }

    // ========================================================================
    // AI PLAYER
    // ========================================================================

    async getAIMove(
        gameId: string,
        queryFn: (prompt: string) => Promise<string>
    ): Promise<any> {
        const state = this.activeGames.get(gameId);
        if (!state) throw new Error('Game not found');

        const prompt = this.generateMovePrompt(state);
        const response = await queryFn(prompt);

        return this.parseAIMove(state.type, response);
    }

    private generateMovePrompt(state: GameState): string {
        let prompt = `You are playing ${state.type}. `;

        switch (state.type) {
            case 'tictactoe':
                prompt += `The board is:\n${this.formatTicTacToe(state.board)}\n`;
                prompt += `You are player ${state.currentPlayer === 0 ? 'X' : 'O'}.\n`;
                prompt += `Respond with just the position number (0-8) for your move.`;
                break;
            case 'connect4':
                prompt += `The board is:\n${this.formatConnect4(state.board)}\n`;
                prompt += `You are player ${state.currentPlayer + 1}.\n`;
                prompt += `Respond with just the column number (0-6) for your move.`;
                break;
            case 'negotiation':
                prompt += `You have 100 resources to divide.\n`;
                prompt += `Previous rounds: ${JSON.stringify(state.board.rounds)}\n`;
                prompt += `Respond with JSON: {"offer": {"a": X, "b": Y}, "accept": true/false}`;
                break;
        }

        return prompt;
    }

    private formatTicTacToe(board: number[]): string {
        return [
            board.slice(0, 3).map(c => c === null ? '.' : c === 0 ? 'X' : 'O').join(' '),
            board.slice(3, 6).map(c => c === null ? '.' : c === 0 ? 'X' : 'O').join(' '),
            board.slice(6, 9).map(c => c === null ? '.' : c === 0 ? 'X' : 'O').join(' '),
        ].join('\n');
    }

    private formatConnect4(board: number[][]): string {
        return board.map(row =>
            row.map(c => c === null ? '.' : c === 0 ? 'X' : 'O').join(' ')
        ).join('\n');
    }

    private parseAIMove(type: GameType, response: string): any {
        switch (type) {
            case 'tictactoe':
            case 'connect4':
                const num = parseInt(response.trim());
                return type === 'tictactoe' ? { position: num } : { column: num };
            case 'negotiation':
                return JSON.parse(response);
            default:
                return response;
        }
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    getGameStats(playerId?: string): {
        gamesPlayed: number;
        wins: number;
        losses: number;
        draws: number;
        winRate: number;
    } {
        let results = this.gameResults;
        if (playerId) {
            results = results.filter(r =>
                Object.keys(r.scores).includes(playerId)
            );
        }

        const wins = results.filter(r => r.winner === playerId).length;
        const draws = results.filter(r => r.winner === 'draw').length;
        const losses = results.length - wins - draws;

        return {
            gamesPlayed: results.length,
            wins,
            losses,
            draws,
            winRate: results.length > 0 ? wins / results.length : 0,
        };
    }

    getActiveGames(): GameState[] {
        return Array.from(this.activeGames.values());
    }

    getGameHistory(): GameResult[] {
        return [...this.gameResults];
    }
}

export const multiAgentGames = MultiAgentGames.getInstance();
