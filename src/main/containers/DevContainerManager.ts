/**
 * Dev Container Manager
 * Docker-based development environments
 * Inspired by Trae's Dev Container support
 */

import { EventEmitter } from 'events';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DevContainerConfig {
    name: string;
    image?: string;
    dockerfile?: string;
    context?: string;
    workspaceFolder: string;
    forwardPorts?: number[];
    runArgs?: string[];
    mounts?: Array<{
        source: string;
        target: string;
        type: 'bind' | 'volume';
    }>;
    remoteEnv?: Record<string, string>;
    postCreateCommand?: string;
    postStartCommand?: string;
    customizations?: {
        vscode?: {
            extensions?: string[];
            settings?: Record<string, any>;
        };
    };
}

export interface Container {
    id: string;
    name: string;
    status: 'created' | 'running' | 'paused' | 'stopped';
    image: string;
    ports: Array<{ host: number; container: number }>;
    createdAt: number;
}

/**
 * DevContainerManager
 * Manages Docker-based development containers
 */
export class DevContainerManager extends EventEmitter {
    private static instance: DevContainerManager;
    private containers: Map<string, Container> = new Map();
    private dockerAvailable: boolean | null = null;

    private constructor() {
        super();
        this.checkDocker();
    }

    static getInstance(): DevContainerManager {
        if (!DevContainerManager.instance) {
            DevContainerManager.instance = new DevContainerManager();
        }
        return DevContainerManager.instance;
    }

    /**
     * Check if Docker is available
     */
    private async checkDocker(): Promise<void> {
        try {
            await execAsync('docker version');
            this.dockerAvailable = true;
            this.emit('dockerAvailable', true);
        } catch {
            this.dockerAvailable = false;
            this.emit('dockerAvailable', false);
        }
    }

    /**
     * Is Docker available?
     */
    isDockerAvailable(): boolean {
        return this.dockerAvailable === true;
    }

    /**
     * Build a dev container from config
     */
    async buildContainer(config: DevContainerConfig): Promise<{ success: boolean; containerId?: string; error?: string }> {
        if (!this.dockerAvailable) {
            return { success: false, error: 'Docker is not available' };
        }

        this.emit('building', { name: config.name });

        try {
            const containerName = `devcontainer-${config.name}-${Date.now()}`;
            const image = config.image || 'mcr.microsoft.com/devcontainers/base:ubuntu';

            // Build args
            const args: string[] = [
                'run', '-d',
                '--name', containerName,
                '-w', config.workspaceFolder,
            ];

            // Add mounts
            if (config.mounts) {
                for (const mount of config.mounts) {
                    args.push('-v', `${mount.source}:${mount.target}`);
                }
            }

            // Add ports
            if (config.forwardPorts) {
                for (const port of config.forwardPorts) {
                    args.push('-p', `${port}:${port}`);
                }
            }

            // Add environment variables
            if (config.remoteEnv) {
                for (const [key, value] of Object.entries(config.remoteEnv)) {
                    args.push('-e', `${key}=${value}`);
                }
            }

            // Add run args
            if (config.runArgs) {
                args.push(...config.runArgs);
            }

            // Add image
            args.push(image);

            // Keep container running
            args.push('tail', '-f', '/dev/null');

            const { stdout } = await execAsync(`docker ${args.join(' ')}`);
            const containerId = stdout.trim();

            const container: Container = {
                id: containerId,
                name: containerName,
                status: 'running',
                image,
                ports: (config.forwardPorts || []).map(p => ({ host: p, container: p })),
                createdAt: Date.now(),
            };

            this.containers.set(containerId, container);

            // Run post-create command if specified
            if (config.postCreateCommand) {
                await this.execInContainer(containerId, config.postCreateCommand);
            }

            this.emit('built', { containerId, name: config.name });
            return { success: true, containerId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Start a stopped container
     */
    async startContainer(containerId: string): Promise<boolean> {
        try {
            await execAsync(`docker start ${containerId}`);

            const container = this.containers.get(containerId);
            if (container) {
                container.status = 'running';
            }

            this.emit('started', { containerId });
            return true;
        } catch (error) {
            console.error('Failed to start container:', error);
            return false;
        }
    }

    /**
     * Stop a running container
     */
    async stopContainer(containerId: string): Promise<boolean> {
        try {
            await execAsync(`docker stop ${containerId}`);

            const container = this.containers.get(containerId);
            if (container) {
                container.status = 'stopped';
            }

            this.emit('stopped', { containerId });
            return true;
        } catch (error) {
            console.error('Failed to stop container:', error);
            return false;
        }
    }

    /**
     * Remove a container
     */
    async removeContainer(containerId: string): Promise<boolean> {
        try {
            await execAsync(`docker rm -f ${containerId}`);
            this.containers.delete(containerId);
            this.emit('removed', { containerId });
            return true;
        } catch (error) {
            console.error('Failed to remove container:', error);
            return false;
        }
    }

    /**
     * Execute command in container
     */
    async execInContainer(containerId: string, command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        try {
            const { stdout, stderr } = await execAsync(`docker exec ${containerId} sh -c "${command}"`);
            return { stdout, stderr, exitCode: 0 };
        } catch (error: any) {
            return {
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                exitCode: error.code || 1
            };
        }
    }

    /**
     * Get interactive shell in container
     */
    getShell(containerId: string): any {
        return spawn('docker', ['exec', '-it', containerId, '/bin/bash'], {
            stdio: 'pipe',
        });
    }

    /**
     * List all containers
     */
    listContainers(): Container[] {
        return Array.from(this.containers.values());
    }

    /**
     * Get container by ID
     */
    getContainer(containerId: string): Container | null {
        return this.containers.get(containerId) || null;
    }

    /**
     * Get container logs
     */
    async getLogs(containerId: string, lines = 100): Promise<string> {
        try {
            const { stdout } = await execAsync(`docker logs --tail ${lines} ${containerId}`);
            return stdout;
        } catch (error) {
            return '';
        }
    }

    /**
     * Copy file into container
     */
    async copyToContainer(containerId: string, source: string, target: string): Promise<boolean> {
        try {
            await execAsync(`docker cp "${source}" ${containerId}:${target}`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy file from container
     */
    async copyFromContainer(containerId: string, source: string, target: string): Promise<boolean> {
        try {
            await execAsync(`docker cp ${containerId}:${source} "${target}"`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Parse devcontainer.json file
     */
    async parseDevContainerJson(filePath: string): Promise<DevContainerConfig | null> {
        try {
            const fs = await import('fs/promises');
            const content = await fs.readFile(filePath, 'utf-8');
            const json = JSON.parse(content);

            return {
                name: json.name || 'devcontainer',
                image: json.image,
                dockerfile: json.build?.dockerfile,
                context: json.build?.context,
                workspaceFolder: json.workspaceFolder || '/workspace',
                forwardPorts: json.forwardPorts,
                runArgs: json.runArgs,
                mounts: json.mounts?.map((m: any) => ({
                    source: m.source,
                    target: m.target,
                    type: m.type || 'bind',
                })),
                remoteEnv: json.remoteEnv,
                postCreateCommand: json.postCreateCommand,
                postStartCommand: json.postStartCommand,
                customizations: json.customizations,
            };
        } catch {
            return null;
        }
    }
}

// Singleton getter
export function getDevContainerManager(): DevContainerManager {
    return DevContainerManager.getInstance();
}
