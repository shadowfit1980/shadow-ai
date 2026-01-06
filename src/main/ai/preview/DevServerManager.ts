/**
 * Dev Server Manager
 * 
 * Auto-detects project type and manages development servers
 * with hot reload, port management, and process lifecycle.
 * Inspired by Bolt.new and Firebase Studio.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as net from 'net';

// ============================================================================
// TYPES
// ============================================================================

export interface DevServer {
    id: string;
    projectPath: string;
    port: number;
    command: string;
    process: ChildProcess | null;
    status: 'starting' | 'running' | 'stopped' | 'error';
    url: string;
    output: string[];
    framework: string;
    startedAt?: Date;
}

export interface ProjectDetection {
    framework: string;
    command: string;
    defaultPort: number;
    hasDevScript: boolean;
}

// ============================================================================
// FRAMEWORK DETECTION
// ============================================================================

const FRAMEWORK_PATTERNS: Array<{
    name: string;
    detect: (projectPath: string, pkg: any) => boolean;
    command: string;
    defaultPort: number;
}> = [
        {
            name: 'Next.js',
            detect: (path, pkg) =>
                pkg?.dependencies?.next || pkg?.devDependencies?.next,
            command: 'npm run dev',
            defaultPort: 3000,
        },
        {
            name: 'Vite',
            detect: (path, pkg) =>
                pkg?.devDependencies?.vite || existsSync(join(path, 'vite.config.ts')),
            command: 'npm run dev',
            defaultPort: 5173,
        },
        {
            name: 'Create React App',
            detect: (path, pkg) =>
                pkg?.dependencies?.['react-scripts'],
            command: 'npm start',
            defaultPort: 3000,
        },
        {
            name: 'Vue CLI',
            detect: (path, pkg) =>
                pkg?.devDependencies?.['@vue/cli-service'],
            command: 'npm run serve',
            defaultPort: 8080,
        },
        {
            name: 'Angular',
            detect: (path, pkg) =>
                pkg?.devDependencies?.['@angular/cli'],
            command: 'npm start',
            defaultPort: 4200,
        },
        {
            name: 'SvelteKit',
            detect: (path, pkg) =>
                pkg?.devDependencies?.['@sveltejs/kit'],
            command: 'npm run dev',
            defaultPort: 5173,
        },
        {
            name: 'Express',
            detect: (path, pkg) =>
                pkg?.dependencies?.express && !pkg?.dependencies?.next,
            command: 'npm run dev',
            defaultPort: 3000,
        },
        {
            name: 'FastAPI',
            detect: (path) =>
                existsSync(join(path, 'requirements.txt')) &&
                readFileSync(join(path, 'requirements.txt'), 'utf-8').includes('fastapi'),
            command: 'uvicorn app.main:app --reload',
            defaultPort: 8000,
        },
        {
            name: 'Flask',
            detect: (path) =>
                existsSync(join(path, 'requirements.txt')) &&
                readFileSync(join(path, 'requirements.txt'), 'utf-8').includes('flask'),
            command: 'flask run',
            defaultPort: 5000,
        },
    ];

// ============================================================================
// DEV SERVER MANAGER
// ============================================================================

export class DevServerManager extends EventEmitter {
    private static instance: DevServerManager;
    private servers: Map<string, DevServer> = new Map();
    private maxOutputLines = 1000;

    private constructor() {
        super();
    }

    static getInstance(): DevServerManager {
        if (!DevServerManager.instance) {
            DevServerManager.instance = new DevServerManager();
        }
        return DevServerManager.instance;
    }

    // ========================================================================
    // PROJECT DETECTION
    // ========================================================================

    /**
     * Detect project framework and dev command
     */
    detectProject(projectPath: string): ProjectDetection | null {
        const pkgPath = join(projectPath, 'package.json');
        let pkg: any = null;

        if (existsSync(pkgPath)) {
            try {
                pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            } catch {
                // Ignore parse errors
            }
        }

        for (const pattern of FRAMEWORK_PATTERNS) {
            try {
                if (pattern.detect(projectPath, pkg)) {
                    return {
                        framework: pattern.name,
                        command: pkg?.scripts?.dev
                            ? 'npm run dev'
                            : pattern.command,
                        defaultPort: pattern.defaultPort,
                        hasDevScript: !!pkg?.scripts?.dev,
                    };
                }
            } catch {
                // Skip detection errors
            }
        }

        // Default fallback
        if (pkg?.scripts?.dev) {
            return {
                framework: 'Node.js',
                command: 'npm run dev',
                defaultPort: 3000,
                hasDevScript: true,
            };
        }

        return null;
    }

    // ========================================================================
    // SERVER MANAGEMENT
    // ========================================================================

    /**
     * Start a dev server for a project
     */
    async startServer(projectPath: string, options: {
        port?: number;
        command?: string;
    } = {}): Promise<DevServer> {
        const detection = this.detectProject(projectPath);

        const port = options.port || detection?.defaultPort || await this.findAvailablePort(3000);
        const command = options.command || detection?.command || 'npm run dev';
        const framework = detection?.framework || 'Unknown';

        const id = `server_${Date.now()}`;
        const server: DevServer = {
            id,
            projectPath,
            port,
            command,
            process: null,
            status: 'starting',
            url: `http://localhost:${port}`,
            output: [],
            framework,
            startedAt: new Date(),
        };

        this.servers.set(id, server);
        this.emit('server:starting', server);

        try {
            // Set PORT environment variable
            const env = { ...process.env, PORT: String(port) };

            const proc = spawn(command, [], {
                cwd: projectPath,
                shell: true,
                env,
            });

            server.process = proc;

            proc.stdout?.on('data', (data) => {
                const text = data.toString();
                this.addOutput(server, text);
                this.emit('server:output', { id, type: 'stdout', text });

                // Detect when server is ready
                if (this.isServerReady(text)) {
                    server.status = 'running';
                    this.emit('server:ready', server);
                }
            });

            proc.stderr?.on('data', (data) => {
                const text = data.toString();
                this.addOutput(server, text);
                this.emit('server:output', { id, type: 'stderr', text });
            });

            proc.on('exit', (code) => {
                server.status = code === 0 ? 'stopped' : 'error';
                server.process = null;
                this.emit('server:stopped', { id, code });
            });

            proc.on('error', (error) => {
                server.status = 'error';
                this.addOutput(server, `Error: ${error.message}`);
                this.emit('server:error', { id, error });
            });

            // Wait for server to be ready (max 30 seconds)
            await this.waitForServer(port, 30000);
            server.status = 'running';
            this.emit('server:ready', server);

        } catch (error) {
            server.status = 'error';
            this.emit('server:error', { id, error });
        }

        return server;
    }

    /**
     * Stop a dev server
     */
    async stopServer(serverId: string): Promise<boolean> {
        const server = this.servers.get(serverId);
        if (!server || !server.process) return false;

        return new Promise((resolve) => {
            server.process!.on('exit', () => {
                server.status = 'stopped';
                resolve(true);
            });

            // Try graceful shutdown first
            server.process!.kill('SIGTERM');

            // Force kill after 5 seconds
            setTimeout(() => {
                if (server.process) {
                    server.process.kill('SIGKILL');
                }
            }, 5000);
        });
    }

    /**
     * Stop all servers
     */
    async stopAllServers(): Promise<void> {
        const promises = Array.from(this.servers.keys()).map(id =>
            this.stopServer(id)
        );
        await Promise.all(promises);
    }

    /**
     * Get server by ID
     */
    getServer(serverId: string): DevServer | undefined {
        return this.servers.get(serverId);
    }

    /**
     * List all servers
     */
    listServers(): DevServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * Get running servers
     */
    getRunningServers(): DevServer[] {
        return this.listServers().filter(s => s.status === 'running');
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private addOutput(server: DevServer, text: string): void {
        server.output.push(text);
        if (server.output.length > this.maxOutputLines) {
            server.output.shift();
        }
    }

    private isServerReady(text: string): boolean {
        const readyPatterns = [
            /ready in/i,
            /listening on/i,
            /started server/i,
            /local:/i,
            /compiled successfully/i,
            /webpack compiled/i,
            /vite.*ready/i,
            /next.js.*ready/i,
        ];
        return readyPatterns.some(p => p.test(text));
    }

    private async findAvailablePort(startPort: number): Promise<number> {
        let port = startPort;
        while (port < startPort + 100) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
            port++;
        }
        return port;
    }

    private isPortAvailable(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.close(() => resolve(true));
            });
            server.on('error', () => resolve(false));
        });
    }

    private waitForServer(port: number, timeout: number): Promise<boolean> {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const check = () => {
                const socket = new net.Socket();

                socket.setTimeout(1000);
                socket.on('connect', () => {
                    socket.destroy();
                    resolve(true);
                });
                socket.on('error', () => {
                    socket.destroy();
                    if (Date.now() - startTime < timeout) {
                        setTimeout(check, 500);
                    } else {
                        resolve(false);
                    }
                });
                socket.on('timeout', () => {
                    socket.destroy();
                    if (Date.now() - startTime < timeout) {
                        setTimeout(check, 500);
                    } else {
                        resolve(false);
                    }
                });

                socket.connect(port, 'localhost');
            };

            check();
        });
    }

    /**
     * Restart a server
     */
    async restartServer(serverId: string): Promise<DevServer | null> {
        const server = this.servers.get(serverId);
        if (!server) return null;

        await this.stopServer(serverId);
        return this.startServer(server.projectPath, {
            port: server.port,
            command: server.command,
        });
    }

    /**
     * Get server output
     */
    getServerOutput(serverId: string): string[] {
        return this.servers.get(serverId)?.output || [];
    }

    /**
     * Clear server output
     */
    clearServerOutput(serverId: string): void {
        const server = this.servers.get(serverId);
        if (server) {
            server.output = [];
        }
    }
}

// Export singleton
export const devServerManager = DevServerManager.getInstance();
