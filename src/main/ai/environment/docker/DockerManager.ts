/**
 * DockerManager - Manages Docker containers and services
 */

import Docker from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
    DockerConfig,
    DockerInfo,
    ContainerInfo,
    ServiceConfig,
    ContainerCreateOptions
} from '../types';

const execAsync = promisify(exec);

export class DockerManager {
    private docker: Docker;

    constructor() {
        this.docker = new Docker();
    }

    /**
     * Check if Docker is installed
     */
    async isInstalled(): Promise<boolean> {
        try {
            await execAsync('docker --version');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if Docker daemon is running
     */
    async isRunning(): Promise<boolean> {
        try {
            await this.docker.ping();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Start Docker daemon (macOS/Linux)
     */
    async startDaemon(): Promise<void> {
        console.log('🐳 Starting Docker daemon...');

        try {
            if (process.platform === 'darwin') {
                await execAsync('open -a Docker');

                // Wait for Docker to start
                for (let i = 0; i < 30; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if (await this.isRunning()) {
                        console.log('✅ Docker daemon started');
                        return;
                    }
                }

                throw new Error('Docker daemon failed to start within 30 seconds');
            } else {
                await execAsync('sudo systemctl start docker');
                console.log('✅ Docker daemon started');
            }
        } catch (error: any) {
            throw new Error(`Failed to start Docker daemon: ${error.message}`);
        }
    }

    /**
     * Ensure Docker is running
     */
    async ensureRunning(): Promise<void> {
        if (!await this.isRunning()) {
            await this.startDaemon();
        }
    }

    /**
     * Setup Docker environment with services
     */
    async setup(config: DockerConfig): Promise<void> {
        console.log('\n🐳 Setting up Docker environment...\n');

        // Ensure Docker is running
        await this.ensureRunning();

        // Create network if specified
        if (config.network) {
            await this.createNetwork(config.network);
        }

        // Create volumes if specified
        if (config.volumes) {
            for (const volume of config.volumes) {
                await this.createVolume(volume.name);
            }
        }

        // Start services
        for (const service of config.services) {
            await this.startService(service, config.network);
        }

        console.log('✅ Docker environment setup complete\n');
    }

    /**
     * Create Docker network
     */
    async createNetwork(name: string): Promise<void> {
        try {
            const networks = await this.docker.listNetworks();
            const exists = networks.some(n => n.Name === name);

            if (!exists) {
                console.log(`📡 Creating network: ${name}`);
                await this.docker.createNetwork({ Name: name });
                console.log(`✅ Network created: ${name}`);
            } else {
                console.log(`📡 Network already exists: ${name}`);
            }
        } catch (error: any) {
            throw new Error(`Failed to create network ${name}: ${error.message}`);
        }
    }

    /**
     * Create Docker volume
     */
    async createVolume(name: string): Promise<void> {
        try {
            const volumes = await this.docker.listVolumes();
            const exists = volumes.Volumes.some(v => v.Name === name);

            if (!exists) {
                console.log(`💾 Creating volume: ${name}`);
                await this.docker.createVolume({ Name: name });
                console.log(`✅ Volume created: ${name}`);
            } else {
                console.log(`💾 Volume already exists: ${name}`);
            }
        } catch (error: any) {
            throw new Error(`Failed to create volume ${name}: ${error.message}`);
        }
    }

    /**
     * Start a service (pull image and run container)
     */
    async startService(service: ServiceConfig, network?: string): Promise<void> {
        console.log(`🚀 Starting service: ${service.name}`);

        try {
            // Check if container already exists
            const containers = await this.docker.listContainers({ all: true });
            const existing = containers.find(c =>
                c.Names.some(n => n === `/${service.name}` || n === service.name)
            );

            if (existing) {
                const container = this.docker.getContainer(existing.Id);

                if (existing.State === 'running') {
                    console.log(`✅ Service already running: ${service.name}`);
                    return;
                }

                // Start existing container
                console.log(`▶️  Starting existing container: ${service.name}`);
                await container.start();
                console.log(`✅ Service started: ${service.name}`);
                return;
            }

            // Pull image
            console.log(`📥 Pulling image: ${service.image}`);
            await this.pullImage(service.image);

            // Create container options
            const createOptions: any = {
                name: service.name,
                Image: service.image,
                Env: service.env ? Object.entries(service.env).map(([k, v]) => `${k}=${v}`) : [],
                HostConfig: {
                    RestartPolicy: {
                        Name: service.restart || 'unless-stopped'
                    }
                }
            };

            // Add port bindings
            if (service.ports) {
                createOptions.ExposedPorts = {};
                createOptions.HostConfig.PortBindings = {};

                service.ports.forEach(portMapping => {
                    const [hostPort, containerPort] = portMapping.split(':');
                    const port = `${containerPort}/tcp`;
                    createOptions.ExposedPorts[port] = {};
                    createOptions.HostConfig.PortBindings[port] = [{ HostPort: hostPort }];
                });
            }

            // Add volumes
            if (service.volumes) {
                createOptions.HostConfig.Binds = service.volumes;
            }

            // Add network
            if (network) {
                createOptions.NetworkingConfig = {
                    EndpointsConfig: {
                        [network]: {}
                    }
                };
            }

            // Create and start container
            const container = await this.docker.createContainer(createOptions);
            await container.start();

            console.log(`✅ Service started: ${service.name}`);

        } catch (error: any) {
            throw new Error(`Failed to start service ${service.name}: ${error.message}`);
        }
    }

    /**
     * Stop a service
     */
    async stopService(name: string): Promise<void> {
        console.log(`🛑 Stopping service: ${name}`);

        try {
            const containers = await this.docker.listContainers();
            const container = containers.find(c =>
                c.Names.some(n => n === `/${name}` || n === name)
            );

            if (!container) {
                console.log(`⚠️  Service not found: ${name}`);
                return;
            }

            const dockerContainer = this.docker.getContainer(container.Id);
            await dockerContainer.stop();

            console.log(`✅ Service stopped: ${name}`);

        } catch (error: any) {
            throw new Error(`Failed to stop service ${name}: ${error.message}`);
        }
    }

    /**
     * Remove a service (stop and remove container)
     */
    async removeService(name: string): Promise<void> {
        console.log(`🗑️  Removing service: ${name}`);

        try {
            const containers = await this.docker.listContainers({ all: true });
            const container = containers.find(c =>
                c.Names.some(n => n === `/${name}` || n === name)
            );

            if (!container) {
                console.log(`⚠️  Service not found: ${name}`);
                return;
            }

            const dockerContainer = this.docker.getContainer(container.Id);

            // Stop if running
            if (container.State === 'running') {
                await dockerContainer.stop();
            }

            // Remove container
            await dockerContainer.remove();

            console.log(`✅ Service removed: ${name}`);

        } catch (error: any) {
            throw new Error(`Failed to remove service ${name}: ${error.message}`);
        }
    }

    /**
     * Pull Docker image
     */
    private async pullImage(image: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.docker.pull(image, (err: any, stream: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.docker.modem.followProgress(stream, (err: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * List all containers
     */
    async listContainers(all: boolean = false): Promise<ContainerInfo[]> {
        try {
            const containers = await this.docker.listContainers({ all });

            return containers.map(c => ({
                id: c.Id,
                name: c.Names[0]?.replace('/', '') || 'unnamed',
                image: c.Image,
                status: c.State as any,
                ports: c.Ports.map(p => `${p.PublicPort || '?'}:${p.PrivatePort}`)
            }));

        } catch (error: any) {
            throw new Error(`Failed to list containers: ${error.message}`);
        }
    }

    /**
     * Get Docker info
     */
    async getInfo(): Promise<DockerInfo> {
        try {
            const running = await this.isRunning();
            const containers = running ? await this.listContainers(true) : [];
            const images = running ? await this.listImages() : [];

            return {
                installed: await this.isInstalled(),
                version: await this.getVersion(),
                running,
                containers,
                images,
                networks: [],
                volumes: []
            };

        } catch (error) {
            return {
                installed: false,
                running: false,
                containers: [],
                images: [],
                networks: [],
                volumes: []
            };
        }
    }

    /**
     * Get Docker version
     */
    private async getVersion(): Promise<string | undefined> {
        try {
            const { stdout } = await execAsync('docker --version');
            const match = stdout.match(/Docker version ([\d.]+)/);
            return match ? match[1] : undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * List images
     */
    private async listImages(): Promise<string[]> {
        try {
            const images = await this.docker.listImages();
            return images
                .filter(img => img.RepoTags && img.RepoTags.length > 0)
                .map(img => img.RepoTags[0]);
        } catch {
            return [];
        }
    }
}
