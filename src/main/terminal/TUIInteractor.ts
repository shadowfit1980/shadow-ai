/**
 * TUI Interactor
 * Enables interaction with Terminal User Interface (TUI) applications
 * Like vim, htop, top, interactive debuggers, REPLs
 * Uses child_process with pseudo-terminal support when available
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';

export interface ScreenPosition {
    row: number;
    col: number;
}

export interface ScreenCell {
    char: string;
    fg?: string;
    bg?: string;
    bold?: boolean;
    underline?: boolean;
}

export interface ScreenBuffer {
    width: number;
    height: number;
    cells: ScreenCell[][];
    cursorPosition: ScreenPosition;
    timestamp: number;
}

export interface TUISession {
    id: string;
    command: string;
    pid: number;
    status: 'running' | 'stopped' | 'exited';
    startTime: number;
    exitCode?: number;
}

interface TUISessionInternal {
    id: string;
    command: string;
    args: string[];
    process: ChildProcess;
    buffer: ScreenBuffer;
    rawOutput: string;
    status: 'running' | 'stopped' | 'exited';
    startTime: number;
    exitCode?: number;
}

/**
 * TUIInteractor
 * Manages terminal sessions for interactive TUI apps
 * Falls back to child_process when node-pty is not available
 */
export class TUIInteractor extends EventEmitter {
    private static instance: TUIInteractor;
    private sessions: Map<string, TUISessionInternal> = new Map();
    private sessionCounter = 0;

    private constructor() {
        super();
    }

    static getInstance(): TUIInteractor {
        if (!TUIInteractor.instance) {
            TUIInteractor.instance = new TUIInteractor();
        }
        return TUIInteractor.instance;
    }

    /**
     * Start a new TUI session
     */
    async startSession(command: string, args: string[] = [], options?: {
        cwd?: string;
        env?: Record<string, string>;
        cols?: number;
        rows?: number;
    }): Promise<string> {
        const sessionId = `tui_${++this.sessionCounter}_${Date.now()}`;

        const cols = options?.cols || 120;
        const rows = options?.rows || 40;

        const spawnOptions: SpawnOptions = {
            cwd: options?.cwd || process.cwd(),
            env: { ...process.env, ...options?.env, TERM: 'xterm-256color' },
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        };

        try {
            const proc = spawn(command, args, spawnOptions);

            const session: TUISessionInternal = {
                id: sessionId,
                command,
                args,
                process: proc,
                buffer: this.createEmptyBuffer(cols, rows),
                rawOutput: '',
                status: 'running',
                startTime: Date.now(),
            };

            // Handle stdout
            proc.stdout?.on('data', (data: Buffer) => {
                const str = data.toString();
                session.rawOutput += str;
                this.processOutput(sessionId, str);
                this.emit('output', { sessionId, data: str });
            });

            // Handle stderr
            proc.stderr?.on('data', (data: Buffer) => {
                const str = data.toString();
                session.rawOutput += str;
                this.emit('stderr', { sessionId, data: str });
            });

            // Handle exit
            proc.on('exit', (code) => {
                session.status = 'exited';
                session.exitCode = code ?? 0;
                this.emit('exit', { sessionId, exitCode: code });
            });

            // Handle error
            proc.on('error', (error) => {
                session.status = 'exited';
                this.emit('error', { sessionId, error: error.message });
            });

            this.sessions.set(sessionId, session);
            this.emit('sessionStarted', { sessionId, command });

            return sessionId;
        } catch (error: any) {
            throw new Error(`Failed to start TUI session: ${error.message}`);
        }
    }

    /**
     * Send input to a TUI session
     */
    async sendInput(sessionId: string, input: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        if (session.status !== 'running') {
            throw new Error(`Session is not running: ${session.status}`);
        }

        session.process.stdin?.write(input);
    }

    /**
     * Send key sequence (escape codes)
     */
    async sendKey(sessionId: string, key: string): Promise<void> {
        const keyMap: Record<string, string> = {
            'enter': '\r',
            'escape': '\x1b',
            'tab': '\t',
            'backspace': '\x7f',
            'up': '\x1b[A',
            'down': '\x1b[B',
            'right': '\x1b[C',
            'left': '\x1b[D',
            'home': '\x1b[H',
            'end': '\x1b[F',
            'pageup': '\x1b[5~',
            'pagedown': '\x1b[6~',
            'delete': '\x1b[3~',
            'insert': '\x1b[2~',
            'f1': '\x1bOP',
            'f2': '\x1bOQ',
            'f3': '\x1bOR',
            'f4': '\x1bOS',
            'f5': '\x1b[15~',
            'f6': '\x1b[17~',
            'f7': '\x1b[18~',
            'f8': '\x1b[19~',
            'f9': '\x1b[20~',
            'f10': '\x1b[21~',
            'f11': '\x1b[23~',
            'f12': '\x1b[24~',
            'ctrl+c': '\x03',
            'ctrl+d': '\x04',
            'ctrl+z': '\x1a',
            'ctrl+l': '\x0c',
            'ctrl+a': '\x01',
            'ctrl+e': '\x05',
            'ctrl+k': '\x0b',
            'ctrl+u': '\x15',
            'ctrl+w': '\x17',
        };

        const sequence = keyMap[key.toLowerCase()] || key;
        await this.sendInput(sessionId, sequence);
    }

    /**
     * Get current screen buffer
     */
    async captureScreen(sessionId: string): Promise<ScreenBuffer> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Return a copy of the current buffer
        return {
            ...session.buffer,
            cells: session.buffer.cells.map(row => [...row]),
            timestamp: Date.now(),
        };
    }

    /**
     * Get screen as plain text
     */
    async getScreenText(sessionId: string): Promise<string> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Return raw output for now (simplified)
        return session.rawOutput;
    }

    /**
     * Wait for specific pattern in output
     */
    async waitForPattern(sessionId: string, pattern: RegExp, timeout = 10000): Promise<string> {
        return new Promise((resolve, reject) => {
            const session = this.sessions.get(sessionId);
            if (!session) {
                reject(new Error(`Session not found: ${sessionId}`));
                return;
            }

            // Check if pattern already matches
            if (pattern.test(session.rawOutput)) {
                resolve(session.rawOutput);
                return;
            }

            const timeoutHandle = setTimeout(() => {
                cleanup();
                reject(new Error(`Timeout waiting for pattern: ${pattern}`));
            }, timeout);

            const handleOutput = ({ sessionId: sid }: { sessionId: string; data: string }) => {
                if (sid !== sessionId) return;

                if (pattern.test(session.rawOutput)) {
                    cleanup();
                    resolve(session.rawOutput);
                }
            };

            const cleanup = () => {
                clearTimeout(timeoutHandle);
                this.off('output', handleOutput);
            };

            this.on('output', handleOutput);
        });
    }

    /**
     * Wait for prompt (common shell prompts)
     */
    async waitForPrompt(sessionId: string, timeout = 5000): Promise<void> {
        const promptPatterns = /[$#>%]\s*$/;
        await this.waitForPattern(sessionId, promptPatterns, timeout);
    }

    /**
     * Resize the terminal (placeholder - requires node-pty)
     */
    async resize(sessionId: string, cols: number, rows: number): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        session.buffer = this.createEmptyBuffer(cols, rows);
        // Note: True resize requires node-pty
    }

    /**
     * Stop a session
     */
    async stopSession(sessionId: string, signal: 'SIGTERM' | 'SIGKILL' = 'SIGTERM'): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        session.status = 'stopped';
        session.process.kill(signal);
    }

    /**
     * Get session info
     */
    getSession(sessionId: string): TUISession | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        return {
            id: session.id,
            command: session.command,
            pid: session.process.pid || 0,
            status: session.status,
            startTime: session.startTime,
            exitCode: session.exitCode,
        };
    }

    /**
     * Get all active sessions
     */
    getActiveSessions(): TUISession[] {
        return Array.from(this.sessions.values())
            .filter(s => s.status === 'running')
            .map(s => ({
                id: s.id,
                command: s.command,
                pid: s.process.pid || 0,
                status: s.status,
                startTime: s.startTime,
            }));
    }

    /**
     * Clean up exited sessions
     */
    cleanupSessions(): number {
        let cleaned = 0;
        for (const [id, session] of this.sessions) {
            if (session.status === 'exited') {
                this.sessions.delete(id);
                cleaned++;
            }
        }
        return cleaned;
    }

    // Private methods

    private createEmptyBuffer(cols: number, rows: number): ScreenBuffer {
        const cells: ScreenCell[][] = [];
        for (let r = 0; r < rows; r++) {
            const row: ScreenCell[] = [];
            for (let c = 0; c < cols; c++) {
                row.push({ char: ' ' });
            }
            cells.push(row);
        }
        return {
            width: cols,
            height: rows,
            cells,
            cursorPosition: { row: 0, col: 0 },
            timestamp: Date.now(),
        };
    }

    private processOutput(sessionId: string, data: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Simple processing - update buffer with output
        let cursor = { ...session.buffer.cursorPosition };

        for (let i = 0; i < data.length; i++) {
            const char = data[i];

            if (char === '\x1b') {
                // Skip ANSI escape sequences
                while (i < data.length && !(/[a-zA-Z]/.test(data[i]))) {
                    i++;
                }
                continue;
            }

            if (char === '\r') {
                cursor.col = 0;
            } else if (char === '\n') {
                cursor.row++;
                if (cursor.row >= session.buffer.height) {
                    session.buffer.cells.shift();
                    session.buffer.cells.push(
                        Array(session.buffer.width).fill(null).map(() => ({ char: ' ' }))
                    );
                    cursor.row = session.buffer.height - 1;
                }
            } else if (char === '\t') {
                cursor.col = Math.min(cursor.col + 8 - (cursor.col % 8), session.buffer.width - 1);
            } else if (char === '\b') {
                cursor.col = Math.max(cursor.col - 1, 0);
            } else if (char >= ' ') {
                if (cursor.row < session.buffer.height && cursor.col < session.buffer.width) {
                    session.buffer.cells[cursor.row][cursor.col] = { char };
                    cursor.col++;
                    if (cursor.col >= session.buffer.width) {
                        cursor.col = 0;
                        cursor.row++;
                    }
                }
            }
        }

        session.buffer.cursorPosition = cursor;
    }
}

// Singleton getter
export function getTUIInteractor(): TUIInteractor {
    return TUIInteractor.getInstance();
}
