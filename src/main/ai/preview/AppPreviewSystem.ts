/**
 * App Preview System
 * 
 * Preview and test apps on Android, iOS, and Web
 * with hot reload and device simulation.
 */

import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type PreviewTarget = 'android' | 'ios' | 'web' | 'desktop';

export interface PreviewConfig {
    projectPath: string;
    target: PreviewTarget;
    device?: string;
    port?: number;
    hotReload?: boolean;
}

export interface PreviewSession {
    id: string;
    target: PreviewTarget;
    url?: string;
    device?: string;
    port: number;
    status: 'starting' | 'running' | 'stopped' | 'error';
    process?: ChildProcess;
    startedAt: Date;
}

export interface DeviceInfo {
    id: string;
    name: string;
    platform: 'android' | 'ios';
    type: 'emulator' | 'physical';
    status: 'online' | 'offline' | 'unknown';
}

// ============================================================================
// APP PREVIEW SYSTEM
// ============================================================================

export class AppPreviewSystem extends EventEmitter {
    private static instance: AppPreviewSystem;
    private sessions: Map<string, PreviewSession> = new Map();
    private nextPort = 8100;

    private constructor() {
        super();
    }

    static getInstance(): AppPreviewSystem {
        if (!AppPreviewSystem.instance) {
            AppPreviewSystem.instance = new AppPreviewSystem();
        }
        return AppPreviewSystem.instance;
    }

    // ========================================================================
    // PREVIEW MANAGEMENT
    // ========================================================================

    /**
     * Start a preview session
     */
    async startPreview(config: PreviewConfig): Promise<PreviewSession> {
        const port = config.port || this.nextPort++;

        const session: PreviewSession = {
            id: `preview_${Date.now()}`,
            target: config.target,
            port,
            status: 'starting',
            startedAt: new Date(),
        };

        this.sessions.set(session.id, session);
        this.emit('preview:starting', session);

        try {
            const command = this.getPreviewCommand(config, port);

            const child = spawn(command.cmd, command.args, {
                cwd: config.projectPath,
                shell: true,
                stdio: 'pipe',
            });

            session.process = child;

            // Handle output
            child.stdout?.on('data', (data) => {
                const output = data.toString();
                this.emit('preview:output', { sessionId: session.id, output });

                // Extract URL from output
                const urlMatch = output.match(/https?:\/\/[^\s]+/);
                if (urlMatch && !session.url) {
                    session.url = urlMatch[0];
                    this.emit('preview:url', { sessionId: session.id, url: session.url });
                }
            });

            child.stderr?.on('data', (data) => {
                this.emit('preview:error', { sessionId: session.id, error: data.toString() });
            });

            child.on('exit', (code) => {
                session.status = code === 0 ? 'stopped' : 'error';
                this.emit('preview:stopped', { sessionId: session.id, code });
            });

            // Wait for startup
            await new Promise(resolve => setTimeout(resolve, 3000));

            session.status = 'running';
            session.url = session.url || `http://localhost:${port}`;
            session.device = config.device;

            this.emit('preview:started', session);
            return session;

        } catch (error: any) {
            session.status = 'error';
            this.emit('preview:failed', { session, error: error.message });
            throw error;
        }
    }

    private getPreviewCommand(config: PreviewConfig, port: number): { cmd: string; args: string[] } {
        const { target, device, projectPath } = config;

        switch (target) {
            case 'android':
                return {
                    cmd: 'npx',
                    args: ['react-native', 'run-android', device ? `--deviceId=${device}` : ''],
                };

            case 'ios':
                return {
                    cmd: 'npx',
                    args: ['react-native', 'run-ios', device ? `--simulator=${device}` : ''],
                };

            case 'web':
                return {
                    cmd: 'npx',
                    args: ['expo', 'start', '--web', '--port', port.toString()],
                };

            case 'desktop':
                return {
                    cmd: 'npm',
                    args: ['run', 'dev'],
                };

            default:
                return { cmd: 'npm', args: ['run', 'dev'] };
        }
    }

    /**
     * Stop a preview session
     */
    async stopPreview(sessionId: string): Promise<boolean> {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        if (session.process) {
            session.process.kill();
        }

        session.status = 'stopped';
        this.emit('preview:stopped', { sessionId });

        return true;
    }

    /**
     * Stop all previews
     */
    async stopAllPreviews(): Promise<void> {
        for (const sessionId of this.sessions.keys()) {
            await this.stopPreview(sessionId);
        }
    }

    // ========================================================================
    // DEVICE MANAGEMENT
    // ========================================================================

    /**
     * List available devices
     */
    async listDevices(): Promise<DeviceInfo[]> {
        const devices: DeviceInfo[] = [];

        // Android devices
        try {
            const { stdout } = await execAsync('adb devices -l');
            const lines = stdout.trim().split('\n').slice(1);

            for (const line of lines) {
                if (!line.trim()) continue;
                const [id, status, ...rest] = line.split(/\s+/);
                const model = rest.find(r => r.startsWith('model:'))?.split(':')[1] || id;

                devices.push({
                    id,
                    name: model,
                    platform: 'android',
                    type: id.includes('emulator') ? 'emulator' : 'physical',
                    status: status === 'device' ? 'online' : 'offline',
                });
            }
        } catch { }

        // iOS devices/simulators
        try {
            const { stdout } = await execAsync('xcrun simctl list devices --json');
            const data = JSON.parse(stdout);

            for (const [runtime, deviceList] of Object.entries(data.devices) as any) {
                for (const device of deviceList) {
                    devices.push({
                        id: device.udid,
                        name: device.name,
                        platform: 'ios',
                        type: 'emulator',
                        status: device.state === 'Booted' ? 'online' : 'offline',
                    });
                }
            }
        } catch { }

        return devices;
    }

    /**
     * Start an emulator
     */
    async startEmulator(platform: 'android' | 'ios', name?: string): Promise<boolean> {
        try {
            if (platform === 'android') {
                const devices = await this.listAndroidEmulators();
                const emulator = name || devices[0];
                if (!emulator) return false;

                spawn('emulator', ['-avd', emulator], { detached: true, stdio: 'ignore' });
                return true;

            } else if (platform === 'ios') {
                const devices = await this.listDevices();
                const simulator = devices.find(d => d.platform === 'ios' && (!name || d.name === name));
                if (!simulator) return false;

                await execAsync(`xcrun simctl boot ${simulator.id}`);
                await execAsync('open -a Simulator');
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }

    private async listAndroidEmulators(): Promise<string[]> {
        try {
            const { stdout } = await execAsync('emulator -list-avds');
            return stdout.trim().split('\n').filter(Boolean);
        } catch {
            return [];
        }
    }

    // ========================================================================
    // HOT RELOAD
    // ========================================================================

    /**
     * Trigger hot reload for a session
     */
    async hotReload(sessionId: string): Promise<boolean> {
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'running') return false;

        // Send reload signal (platform-specific)
        if (session.target === 'web') {
            // Web servers usually auto-reload
            return true;
        }

        // For React Native, send 'r' key to Metro
        if (session.process?.stdin) {
            session.process.stdin.write('r');
            this.emit('preview:reloaded', { sessionId });
            return true;
        }

        return false;
    }

    // ========================================================================
    // SCREENSHOTS
    // ========================================================================

    /**
     * Take screenshot
     */
    async takeScreenshot(sessionId: string, outputPath: string): Promise<string> {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        if (session.target === 'android') {
            await execAsync(`adb shell screencap -p /sdcard/screenshot.png`);
            await execAsync(`adb pull /sdcard/screenshot.png ${outputPath}`);
        } else if (session.target === 'ios') {
            await execAsync(`xcrun simctl io booted screenshot ${outputPath}`);
        } else {
            throw new Error('Screenshot only supported for mobile');
        }

        this.emit('screenshot:taken', { sessionId, path: outputPath });
        return outputPath;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Get all sessions
     */
    getSessions(): PreviewSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get running sessions
     */
    getRunningSessions(): PreviewSession[] {
        return Array.from(this.sessions.values()).filter(s => s.status === 'running');
    }

    /**
     * Get session by ID
     */
    getSession(id: string): PreviewSession | undefined {
        return this.sessions.get(id);
    }
}

// Export singleton
export const appPreviewSystem = AppPreviewSystem.getInstance();
