/**
 * Docker Manager
 * 
 * Comprehensive Docker integration for container management,
 * image building, and development environments.
 * Inspired by VS Code Docker extension and DevContainers.
 */

import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'stopped' | 'paused' | 'created';
    ports: string[];
    created: Date;
    mounts: string[];
}

export interface DockerImage {
    id: string;
    repository: string;
    tag: string;
    size: string;
    created: Date;
}

export interface DockerComposeService {
    name: string;
    image?: string;
    build?: string;
    ports?: string[];
    volumes?: string[];
    environment?: Record<string, string>;
    depends_on?: string[];
}

export interface DevContainerConfig {
    name: string;
    image?: string;
    dockerFile?: string;
    extensions?: string[];
    settings?: Record<string, any>;
    postCreateCommand?: string;
    forwardPorts?: number[];
}

// ============================================================================
// DOCKER MANAGER
// ============================================================================

export class DockerManager extends EventEmitter {
    private static instance: DockerManager;
    private processes: Map<string, ChildProcess> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): DockerManager {
        if (!DockerManager.instance) {
            DockerManager.instance = new DockerManager();
        }
        return DockerManager.instance;
    }

    // ========================================================================
    // DOCKER STATUS
    // ========================================================================

    /**
     * Check if Docker is available
     */
    async isDockerAvailable(): Promise<boolean> {
        try {
            await execAsync('docker --version');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get Docker version info
     */
    async getVersion(): Promise<{ client: string; server: string }> {
        try {
            const { stdout } = await execAsync('docker version --format "{{.Client.Version}},{{.Server.Version}}"');
            const [client, server] = stdout.trim().split(',');
            return { client, server };
        } catch {
            return { client: 'unknown', server: 'unknown' };
        }
    }

    // ========================================================================
    // CONTAINER MANAGEMENT
    // ========================================================================

    /**
     * List all containers
     */
    async listContainers(all = false): Promise<DockerContainer[]> {
        try {
            const allFlag = all ? '-a' : '';
            const { stdout } = await execAsync(
                `docker ps ${allFlag} --format '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","ports":"{{.Ports}}"}'`
            );

            return stdout.trim().split('\n').filter(Boolean).map(line => {
                const data = JSON.parse(line);
                return {
                    id: data.id,
                    name: data.name,
                    image: data.image,
                    status: data.status.includes('Up') ? 'running' : 'stopped',
                    ports: data.ports ? data.ports.split(',').filter(Boolean) : [],
                    created: new Date(),
                    mounts: [],
                } as DockerContainer;
            });
        } catch {
            return [];
        }
    }

    /**
     * Run a container
     */
    async runContainer(options: {
        image: string;
        name?: string;
        ports?: string[];
        volumes?: string[];
        env?: Record<string, string>;
        detach?: boolean;
        rm?: boolean;
        command?: string;
    }): Promise<{ success: boolean; containerId?: string; error?: string }> {
        const { image, name, ports = [], volumes = [], env = {}, detach = true, rm = false, command } = options;

        const args = ['run'];
        if (detach) args.push('-d');
        if (rm) args.push('--rm');
        if (name) args.push('--name', name);

        ports.forEach(p => args.push('-p', p));
        volumes.forEach(v => args.push('-v', v));
        Object.entries(env).forEach(([k, v]) => args.push('-e', `${k}=${v}`));

        args.push(image);
        if (command) args.push(command);

        try {
            const { stdout } = await execAsync(`docker ${args.join(' ')}`);
            const containerId = stdout.trim().slice(0, 12);
            this.emit('container:started', { id: containerId, image, name });
            return { success: true, containerId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop a container
     */
    async stopContainer(idOrName: string): Promise<boolean> {
        try {
            await execAsync(`docker stop ${idOrName}`);
            this.emit('container:stopped', { id: idOrName });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Remove a container
     */
    async removeContainer(idOrName: string, force = false): Promise<boolean> {
        try {
            const forceFlag = force ? '-f' : '';
            await execAsync(`docker rm ${forceFlag} ${idOrName}`);
            this.emit('container:removed', { id: idOrName });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Execute command in container
     */
    async exec(containerId: string, command: string): Promise<{ stdout: string; stderr: string }> {
        try {
            const { stdout, stderr } = await execAsync(`docker exec ${containerId} ${command}`);
            return { stdout, stderr };
        } catch (error: any) {
            return { stdout: '', stderr: error.message };
        }
    }

    /**
     * Get container logs
     */
    async getLogs(containerId: string, tail = 100): Promise<string> {
        try {
            const { stdout } = await execAsync(`docker logs --tail ${tail} ${containerId}`);
            return stdout;
        } catch {
            return '';
        }
    }

    // ========================================================================
    // IMAGE MANAGEMENT
    // ========================================================================

    /**
     * List images
     */
    async listImages(): Promise<DockerImage[]> {
        try {
            const { stdout } = await execAsync(
                'docker images --format \'{"id":"{{.ID}}","repository":"{{.Repository}}","tag":"{{.Tag}}","size":"{{.Size}}"}\''
            );

            return stdout.trim().split('\n').filter(Boolean).map(line => {
                const data = JSON.parse(line);
                return {
                    id: data.id,
                    repository: data.repository,
                    tag: data.tag,
                    size: data.size,
                    created: new Date(),
                } as DockerImage;
            });
        } catch {
            return [];
        }
    }

    /**
     * Build an image
     */
    async buildImage(options: {
        dockerfile: string;
        tag: string;
        context?: string;
        buildArgs?: Record<string, string>;
    }): Promise<{ success: boolean; error?: string }> {
        const { dockerfile, tag, context = '.', buildArgs = {} } = options;

        const args = ['build', '-f', dockerfile, '-t', tag];
        Object.entries(buildArgs).forEach(([k, v]) => args.push('--build-arg', `${k}=${v}`));
        args.push(context);

        try {
            await execAsync(`docker ${args.join(' ')}`);
            this.emit('image:built', { tag });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Pull an image
     */
    async pullImage(image: string): Promise<boolean> {
        try {
            await execAsync(`docker pull ${image}`);
            this.emit('image:pulled', { image });
            return true;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // DOCKER COMPOSE
    // ========================================================================

    /**
     * Start docker-compose services
     */
    async composeUp(projectPath: string, options: {
        detach?: boolean;
        build?: boolean;
        services?: string[];
    } = {}): Promise<boolean> {
        const { detach = true, build = false, services = [] } = options;

        const args = ['compose', 'up'];
        if (detach) args.push('-d');
        if (build) args.push('--build');
        args.push(...services);

        try {
            await execAsync(`docker ${args.join(' ')}`, { cwd: projectPath });
            this.emit('compose:up', { project: projectPath });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Stop docker-compose services
     */
    async composeDown(projectPath: string): Promise<boolean> {
        try {
            await execAsync('docker compose down', { cwd: projectPath });
            this.emit('compose:down', { project: projectPath });
            return true;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // DEV CONTAINERS
    // ========================================================================

    /**
     * Generate devcontainer.json
     */
    async generateDevContainer(projectPath: string, config: DevContainerConfig): Promise<void> {
        const devContainerDir = path.join(projectPath, '.devcontainer');
        await fs.mkdir(devContainerDir, { recursive: true });

        const devContainerJson = {
            name: config.name,
            image: config.image,
            dockerFile: config.dockerFile,
            customizations: {
                vscode: {
                    extensions: config.extensions || [],
                    settings: config.settings || {},
                },
            },
            postCreateCommand: config.postCreateCommand,
            forwardPorts: config.forwardPorts || [],
        };

        await fs.writeFile(
            path.join(devContainerDir, 'devcontainer.json'),
            JSON.stringify(devContainerJson, null, 2)
        );

        this.emit('devcontainer:created', { project: projectPath });
    }

    // ========================================================================
    // DOCKERFILE GENERATION
    // ========================================================================

    /**
     * Generate Dockerfile for a project
     */
    generateDockerfile(type: 'node' | 'python' | 'java' | 'go' | 'rust', options: {
        version?: string;
        port?: number;
        installCommand?: string;
        startCommand?: string;
    } = {}): string {
        const templates: Record<string, string> = {
            node: `FROM node:${options.version || '20-alpine'}
WORKDIR /app
COPY package*.json ./
RUN ${options.installCommand || 'npm ci'}
COPY . .
EXPOSE ${options.port || 3000}
CMD ["${options.startCommand || 'npm start'}"]`,

            python: `FROM python:${options.version || '3.12-slim'}
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${options.port || 8000}
CMD ["${options.startCommand || 'python app.py'}"]`,

            java: `FROM eclipse-temurin:${options.version || '21-jdk-alpine'}
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE ${options.port || 8080}
CMD ["java", "-jar", "app.jar"]`,

            go: `FROM golang:${options.version || '1.22-alpine'}
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .
EXPOSE ${options.port || 8080}
CMD ["./main"]`,

            rust: `FROM rust:${options.version || '1.75-alpine'}
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release
EXPOSE ${options.port || 8080}
CMD ["./target/release/app"]`,
        };

        return templates[type] || templates.node;
    }
}

// Export singleton
export const dockerManager = DockerManager.getInstance();
