/**
 * Container Manager - Docker containers
 */
import { EventEmitter } from 'events';
import { spawn } from 'child_process';

export interface Container { id: string; name: string; image: string; status: 'created' | 'running' | 'stopped'; ports?: string[]; createdAt: number; }

export class ContainerManager extends EventEmitter {
    private static instance: ContainerManager;
    private containers: Map<string, Container> = new Map();
    private constructor() { super(); }
    static getInstance(): ContainerManager { if (!ContainerManager.instance) ContainerManager.instance = new ContainerManager(); return ContainerManager.instance; }

    async run(name: string, image: string, ports?: string[]): Promise<Container> {
        const container: Container = { id: `cnt_${Date.now()}`, name, image, status: 'created', ports, createdAt: Date.now() };
        this.containers.set(container.id, container);

        // Simulate docker run (actual implementation would use docker CLI or API)
        container.status = 'running';
        this.emit('started', container);
        return container;
    }

    async stop(id: string): Promise<boolean> { const c = this.containers.get(id); if (!c) return false; c.status = 'stopped'; this.emit('stopped', c); return true; }
    async remove(id: string): Promise<boolean> { const c = this.containers.get(id); if (!c) return false; await this.stop(id); this.containers.delete(id); this.emit('removed', c); return true; }

    async exec(id: string, command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn('docker', ['exec', id, 'sh', '-c', command]);
            let output = '';
            proc.stdout.on('data', (data) => output += data.toString());
            proc.on('close', () => resolve(output));
            proc.on('error', reject);
        });
    }

    getRunning(): Container[] { return Array.from(this.containers.values()).filter(c => c.status === 'running'); }
    getAll(): Container[] { return Array.from(this.containers.values()); }
}

export function getContainerManager(): ContainerManager { return ContainerManager.getInstance(); }
