/**
 * Screen Sharing Service
 * 
 * WebRTC-based screen sharing for team collaboration
 */

import { EventEmitter } from 'events';
import { desktopCapturer, ipcMain, BrowserWindow } from 'electron';

interface ScreenShareSession {
    id: string;
    hostId: string;
    viewerIds: string[];
    sourceId: string;
    startTime: Date;
    isActive: boolean;
}

/**
 * ScreenSharingService - Share screen with team members
 */
export class ScreenSharingService extends EventEmitter {
    private static instance: ScreenSharingService;
    private sessions: Map<string, ScreenShareSession> = new Map();
    private mainWindow: BrowserWindow | null = null;

    private constructor() {
        super();
        this.setupHandlers();
    }

    static getInstance(): ScreenSharingService {
        if (!ScreenSharingService.instance) {
            ScreenSharingService.instance = new ScreenSharingService();
        }
        return ScreenSharingService.instance;
    }

    /**
     * Set main window reference
     */
    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window;
    }

    /**
     * Setup IPC handlers
     */
    private setupHandlers(): void {
        ipcMain.handle('screenShare:getSources', async () => {
            return this.getAvailableSources();
        });

        ipcMain.handle('screenShare:start', async (_, sourceId) => {
            return this.startSharing(sourceId);
        });

        ipcMain.handle('screenShare:stop', async (_, sessionId) => {
            return this.stopSharing(sessionId);
        });

        ipcMain.handle('screenShare:getSessions', async () => {
            return this.getActiveSessions();
        });
    }

    /**
     * Get available screen sources
     */
    async getAvailableSources(): Promise<Array<{ id: string; name: string; thumbnail: string }>> {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['window', 'screen'],
                thumbnailSize: { width: 320, height: 180 },
            });

            return sources.map(source => ({
                id: source.id,
                name: source.name,
                thumbnail: source.thumbnail.toDataURL(),
            }));
        } catch (error) {
            console.error('Failed to get screen sources:', error);
            return [];
        }
    }

    /**
     * Start screen sharing
     */
    async startSharing(sourceId: string, hostId: string = 'local'): Promise<ScreenShareSession> {
        const session: ScreenShareSession = {
            id: `share_${Date.now()}`,
            hostId,
            viewerIds: [],
            sourceId,
            startTime: new Date(),
            isActive: true,
        };

        this.sessions.set(session.id, session);
        this.emit('session:started', session);

        // Notify renderer to start capture
        if (this.mainWindow) {
            this.mainWindow.webContents.send('screenShare:sessionStarted', {
                sessionId: session.id,
                sourceId,
            });
        }

        return session;
    }

    /**
     * Stop screen sharing
     */
    async stopSharing(sessionId: string): Promise<boolean> {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.isActive = false;
        this.sessions.delete(sessionId);
        this.emit('session:stopped', session);

        // Notify renderer
        if (this.mainWindow) {
            this.mainWindow.webContents.send('screenShare:sessionStopped', { sessionId });
        }

        return true;
    }

    /**
     * Join a screen share session
     */
    joinSession(sessionId: string, viewerId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session || !session.isActive) return false;

        session.viewerIds.push(viewerId);
        this.emit('viewer:joined', { sessionId, viewerId });
        return true;
    }

    /**
     * Leave a screen share session
     */
    leaveSession(sessionId: string, viewerId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.viewerIds = session.viewerIds.filter(id => id !== viewerId);
        this.emit('viewer:left', { sessionId, viewerId });
        return true;
    }

    /**
     * Get active sessions
     */
    getActiveSessions(): ScreenShareSession[] {
        return Array.from(this.sessions.values()).filter(s => s.isActive);
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): ScreenShareSession | undefined {
        return this.sessions.get(sessionId);
    }
}

export default ScreenSharingService;
