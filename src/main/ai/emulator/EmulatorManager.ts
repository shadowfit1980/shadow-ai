/**
 * Emulator Manager
 * 
 * Android, iOS, and Web emulator management for testing
 * mobile and web applications directly within the agent.
 */

import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type EmulatorType = 'android' | 'ios' | 'web';

export interface Emulator {
    id: string;
    name: string;
    type: EmulatorType;
    status: 'running' | 'stopped' | 'booting';
    deviceName?: string;
    osVersion?: string;
    port?: number;
}

export interface AndroidDevice {
    id: string;
    name: string;
    avdName: string;
    status: string;
}

export interface IOSSimulator {
    udid: string;
    name: string;
    runtime: string;
    state: 'Booted' | 'Shutdown';
    deviceType: string;
}

export interface WebBrowser {
    name: string;
    command: string;
    available: boolean;
}

// ============================================================================
// EMULATOR MANAGER
// ============================================================================

export class EmulatorManager extends EventEmitter {
    private static instance: EmulatorManager;
    private runningEmulators: Map<string, ChildProcess> = new Map();
    private webServers: Map<string, ChildProcess> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): EmulatorManager {
        if (!EmulatorManager.instance) {
            EmulatorManager.instance = new EmulatorManager();
        }
        return EmulatorManager.instance;
    }

    // ========================================================================
    // ANDROID EMULATOR
    // ========================================================================

    /**
     * Check if Android SDK is available
     */
    async isAndroidAvailable(): Promise<boolean> {
        try {
            await execAsync('adb version');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * List available Android emulators (AVDs)
     */
    async listAndroidEmulators(): Promise<AndroidDevice[]> {
        try {
            const { stdout } = await execAsync('emulator -list-avds');
            const avds = stdout.trim().split('\n').filter(Boolean);

            return avds.map(avd => ({
                id: avd,
                name: avd,
                avdName: avd,
                status: 'stopped',
            }));
        } catch {
            return [];
        }
    }

    /**
     * List running Android devices
     */
    async listRunningAndroidDevices(): Promise<string[]> {
        try {
            const { stdout } = await execAsync('adb devices');
            const lines = stdout.trim().split('\n').slice(1);
            return lines
                .filter(l => l.includes('device') || l.includes('emulator'))
                .map(l => l.split('\t')[0]);
        } catch {
            return [];
        }
    }

    /**
     * Start an Android emulator
     */
    async startAndroidEmulator(avdName: string): Promise<boolean> {
        try {
            const child = spawn('emulator', ['-avd', avdName], {
                detached: true,
                stdio: 'ignore',
            });

            child.unref();
            this.runningEmulators.set(`android:${avdName}`, child);
            this.emit('emulator:started', { type: 'android', name: avdName });

            // Wait for device to boot
            await this.waitForDevice('android');

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create a new Android emulator
     */
    async createAndroidEmulator(options: {
        name: string;
        device?: string;
        apiLevel?: number;
    }): Promise<boolean> {
        const { name, device = 'pixel_6', apiLevel = 34 } = options;

        try {
            const cmd = `echo "no" | avdmanager create avd -n ${name} -k "system-images;android-${apiLevel};google_apis;x86_64" -d ${device}`;
            await execAsync(cmd);
            this.emit('emulator:created', { type: 'android', name });
            return true;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // IOS SIMULATOR
    // ========================================================================

    /**
     * Check if Xcode/Simulators are available
     */
    async isIOSAvailable(): Promise<boolean> {
        try {
            await execAsync('xcrun simctl list');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * List iOS simulators
     */
    async listIOSSimulators(): Promise<IOSSimulator[]> {
        try {
            const { stdout } = await execAsync('xcrun simctl list devices -j');
            const data = JSON.parse(stdout);
            const simulators: IOSSimulator[] = [];

            for (const [runtime, devices] of Object.entries(data.devices as Record<string, any[]>)) {
                for (const device of devices) {
                    if (device.isAvailable) {
                        simulators.push({
                            udid: device.udid,
                            name: device.name,
                            runtime,
                            state: device.state,
                            deviceType: device.deviceTypeIdentifier || 'unknown',
                        });
                    }
                }
            }

            return simulators;
        } catch {
            return [];
        }
    }

    /**
     * Start an iOS simulator
     */
    async startIOSSimulator(udid: string): Promise<boolean> {
        try {
            await execAsync(`xcrun simctl boot ${udid}`);
            await execAsync('open -a Simulator');
            this.emit('emulator:started', { type: 'ios', udid });
            return true;
        } catch (error: any) {
            // May already be booted
            if (error.message.includes('already booted')) {
                return true;
            }
            return false;
        }
    }

    /**
     * Stop an iOS simulator
     */
    async stopIOSSimulator(udid: string): Promise<boolean> {
        try {
            await execAsync(`xcrun simctl shutdown ${udid}`);
            this.emit('emulator:stopped', { type: 'ios', udid });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Install app on iOS simulator
     */
    async installIOSApp(udid: string, appPath: string): Promise<boolean> {
        try {
            await execAsync(`xcrun simctl install ${udid} "${appPath}"`);
            return true;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // WEB BROWSER EMULATION
    // ========================================================================

    /**
     * List available browsers
     */
    async listBrowsers(): Promise<WebBrowser[]> {
        const browsers: WebBrowser[] = [];

        // Check for Chrome
        try {
            await execAsync('which google-chrome || which /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome');
            browsers.push({ name: 'Chrome', command: 'google-chrome', available: true });
        } catch {
            browsers.push({ name: 'Chrome', command: '', available: false });
        }

        // Check for Firefox
        try {
            await execAsync('which firefox');
            browsers.push({ name: 'Firefox', command: 'firefox', available: true });
        } catch {
            browsers.push({ name: 'Firefox', command: '', available: false });
        }

        // Check for Safari (macOS)
        try {
            await execAsync('ls /Applications/Safari.app');
            browsers.push({ name: 'Safari', command: 'open -a Safari', available: true });
        } catch {
            browsers.push({ name: 'Safari', command: '', available: false });
        }

        return browsers;
    }

    /**
     * Start a web dev server
     */
    async startWebServer(projectPath: string, port = 3000): Promise<{
        success: boolean;
        url?: string;
        error?: string;
    }> {
        try {
            // Try to detect the project type and start appropriate server
            const child = spawn('npx', ['serve', '-l', port.toString()], {
                cwd: projectPath,
                stdio: 'pipe',
            });

            this.webServers.set(projectPath, child);

            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));

            const url = `http://localhost:${port}`;
            this.emit('webserver:started', { path: projectPath, url });

            return { success: true, url };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop web server
     */
    stopWebServer(projectPath: string): boolean {
        const server = this.webServers.get(projectPath);
        if (server) {
            server.kill();
            this.webServers.delete(projectPath);
            this.emit('webserver:stopped', { path: projectPath });
            return true;
        }
        return false;
    }

    /**
     * Open URL in browser with device emulation
     */
    async openInBrowser(url: string, device?: 'mobile' | 'tablet' | 'desktop'): Promise<boolean> {
        try {
            let chromeArgs = '';

            if (device === 'mobile') {
                chromeArgs = '--window-size=375,812 --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"';
            } else if (device === 'tablet') {
                chromeArgs = '--window-size=768,1024 --user-agent="Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)"';
            }

            // macOS specific
            await execAsync(`open -a "Google Chrome" "${url}" --args ${chromeArgs}`);
            return true;
        } catch {
            // Fallback to default browser
            try {
                await execAsync(`open "${url}"`);
                return true;
            } catch {
                return false;
            }
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Wait for device to be ready
     */
    private async waitForDevice(type: 'android' | 'ios', timeout = 60000): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (type === 'android') {
                const devices = await this.listRunningAndroidDevices();
                if (devices.length > 0) return true;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return false;
    }

    /**
     * Get all running emulators
     */
    async getRunningEmulators(): Promise<Emulator[]> {
        const emulators: Emulator[] = [];

        // Android
        const androidDevices = await this.listRunningAndroidDevices();
        for (const id of androidDevices) {
            emulators.push({
                id,
                name: id,
                type: 'android',
                status: 'running',
            });
        }

        // iOS
        const iosSimulators = await this.listIOSSimulators();
        for (const sim of iosSimulators.filter(s => s.state === 'Booted')) {
            emulators.push({
                id: sim.udid,
                name: sim.name,
                type: 'ios',
                status: 'running',
                osVersion: sim.runtime,
            });
        }

        // Web servers
        for (const [path] of this.webServers) {
            emulators.push({
                id: path,
                name: `Web: ${path.split('/').pop()}`,
                type: 'web',
                status: 'running',
            });
        }

        return emulators;
    }

    /**
     * Stop all emulators
     */
    async stopAll(): Promise<void> {
        // Stop Android emulators
        for (const [key, child] of this.runningEmulators) {
            child.kill();
        }
        this.runningEmulators.clear();

        // Stop iOS simulators
        const iosSimulators = await this.listIOSSimulators();
        for (const sim of iosSimulators.filter(s => s.state === 'Booted')) {
            await this.stopIOSSimulator(sim.udid);
        }

        // Stop web servers
        for (const [path] of this.webServers) {
            this.stopWebServer(path);
        }

        this.emit('emulators:stopped');
    }

    /**
     * Take screenshot
     */
    async takeScreenshot(emulatorId: string, type: EmulatorType): Promise<string | null> {
        const screenshotPath = `/tmp/screenshot_${Date.now()}.png`;

        try {
            if (type === 'android') {
                await execAsync(`adb -s ${emulatorId} exec-out screencap -p > ${screenshotPath}`);
            } else if (type === 'ios') {
                await execAsync(`xcrun simctl io ${emulatorId} screenshot ${screenshotPath}`);
            }
            return screenshotPath;
        } catch {
            return null;
        }
    }
}

// Export singleton
export const emulatorManager = EmulatorManager.getInstance();
