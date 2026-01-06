/**
 * Cloud IDE Mode
 * 
 * Run Shadow AI in browser with cloud-based compute.
 * No installation required.
 */

import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface CloudInstance {
    id: string;
    status: 'starting' | 'running' | 'stopping' | 'stopped';
    url?: string;
    port: number;
    workspacePath: string;
    startedAt: Date;
    resources: {
        cpu: string;
        memory: string;
        storage: string;
    };
}

export interface CloudSession {
    id: string;
    instanceId: string;
    userId: string;
    token: string;
    expiresAt: Date;
}

export interface CloudConfig {
    basePort: number;
    maxInstances: number;
    timeout: number;
    allowedOrigins: string[];
}

// ============================================================================
// CLOUD IDE SERVER
// ============================================================================

export class CloudIDEServer extends EventEmitter {
    private static instance: CloudIDEServer;
    private instances: Map<string, CloudInstance> = new Map();
    private sessions: Map<string, CloudSession> = new Map();
    private processes: Map<string, ChildProcess> = new Map();
    private config: CloudConfig = {
        basePort: 8000,
        maxInstances: 10,
        timeout: 3600000, // 1 hour
        allowedOrigins: ['*'],
    };

    private constructor() {
        super();
    }

    static getInstance(): CloudIDEServer {
        if (!CloudIDEServer.instance) {
            CloudIDEServer.instance = new CloudIDEServer();
        }
        return CloudIDEServer.instance;
    }

    // ========================================================================
    // INSTANCE MANAGEMENT
    // ========================================================================

    /**
     * Start a cloud instance
     */
    async startInstance(workspacePath: string): Promise<CloudInstance> {
        if (this.instances.size >= this.config.maxInstances) {
            throw new Error('Maximum instances reached');
        }

        const id = `instance_${Date.now()}`;
        const port = await this.findAvailablePort();

        const instance: CloudInstance = {
            id,
            status: 'starting',
            port,
            workspacePath,
            startedAt: new Date(),
            resources: {
                cpu: '2 vCPU',
                memory: '4GB',
                storage: '10GB',
            },
        };

        this.instances.set(id, instance);
        this.emit('instance:starting', instance);

        try {
            // Start the development server
            const child = spawn('npx', ['serve', '-l', port.toString(), '-s'], {
                cwd: workspacePath,
                stdio: 'pipe',
            });

            this.processes.set(id, child);

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            instance.status = 'running';
            instance.url = `http://localhost:${port}`;

            this.emit('instance:started', instance);

            // Set timeout
            setTimeout(() => this.stopInstance(id), this.config.timeout);

            return instance;

        } catch (error: any) {
            instance.status = 'stopped';
            this.emit('instance:failed', { instance, error: error.message });
            throw error;
        }
    }

    /**
     * Stop an instance
     */
    async stopInstance(id: string): Promise<boolean> {
        const instance = this.instances.get(id);
        const process = this.processes.get(id);

        if (!instance) return false;

        instance.status = 'stopping';
        this.emit('instance:stopping', instance);

        if (process) {
            process.kill();
            this.processes.delete(id);
        }

        instance.status = 'stopped';
        this.instances.delete(id);

        this.emit('instance:stopped', instance);
        return true;
    }

    /**
     * Get instance status
     */
    getInstance(id: string): CloudInstance | undefined {
        return this.instances.get(id);
    }

    /**
     * List all instances
     */
    listInstances(): CloudInstance[] {
        return Array.from(this.instances.values());
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    /**
     * Create a session
     */
    createSession(instanceId: string, userId: string): CloudSession {
        const instance = this.instances.get(instanceId);
        if (!instance || instance.status !== 'running') {
            throw new Error('Instance not available');
        }

        const session: CloudSession = {
            id: `session_${Date.now()}`,
            instanceId,
            userId,
            token: this.generateToken(),
            expiresAt: new Date(Date.now() + this.config.timeout),
        };

        this.sessions.set(session.id, session);
        this.emit('session:created', session);

        return session;
    }

    /**
     * Validate session token
     */
    validateSession(token: string): CloudSession | null {
        for (const session of this.sessions.values()) {
            if (session.token === token) {
                if (new Date() > session.expiresAt) {
                    this.sessions.delete(session.id);
                    return null;
                }
                return session;
            }
        }
        return null;
    }

    /**
     * End a session
     */
    endSession(id: string): boolean {
        const session = this.sessions.get(id);
        if (session) {
            this.sessions.delete(id);
            this.emit('session:ended', session);
            return true;
        }
        return false;
    }

    // ========================================================================
    // WEB SERVER
    // ========================================================================

    /**
     * Start the Cloud IDE web server
     */
    startWebServer(port = 3000): http.Server {
        const server = http.createServer(async (req, res) => {
            // CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            const url = new URL(req.url || '', `http://localhost:${port}`);

            try {
                // API routes
                if (url.pathname === '/api/instances' && req.method === 'GET') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(this.listInstances()));
                    return;
                }

                if (url.pathname === '/api/instances' && req.method === 'POST') {
                    const body = await this.readBody(req);
                    const instance = await this.startInstance(body.workspacePath);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(instance));
                    return;
                }

                if (url.pathname.startsWith('/api/instances/') && req.method === 'DELETE') {
                    const id = url.pathname.split('/').pop();
                    const success = await this.stopInstance(id!);
                    res.writeHead(success ? 200 : 404);
                    res.end();
                    return;
                }

                // Default: serve static files or return 404
                res.writeHead(404);
                res.end('Not Found');

            } catch (error: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });

        server.listen(port, () => {
            this.emit('server:started', { port });
        });

        return server;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async findAvailablePort(): Promise<number> {
        let port = this.config.basePort;
        const usedPorts = new Set(
            Array.from(this.instances.values()).map(i => i.port)
        );

        while (usedPorts.has(port)) {
            port++;
        }

        return port;
    }

    private generateToken(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 64; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    private readBody(req: http.IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve({});
                }
            });
            req.on('error', reject);
        });
    }

    /**
     * Set configuration
     */
    setConfig(config: Partial<CloudConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// Export singleton
export const cloudIDEServer = CloudIDEServer.getInstance();
