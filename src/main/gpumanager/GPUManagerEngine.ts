/**
 * GPU Manager - GPU allocation and scheduling
 */
import { EventEmitter } from 'events';

export interface GPUDevice { id: number; name: string; vram: number; vramUsed: number; compute: string; driver: string; }
export interface GPUAllocation { modelId: string; gpuIds: number[]; layers: number; vramRequired: number; }

export class GPUManagerEngine extends EventEmitter {
    private static instance: GPUManagerEngine;
    private devices: GPUDevice[] = [];
    private allocations: Map<string, GPUAllocation> = new Map();
    private constructor() { super(); this.detectGPUs(); }
    static getInstance(): GPUManagerEngine { if (!GPUManagerEngine.instance) GPUManagerEngine.instance = new GPUManagerEngine(); return GPUManagerEngine.instance; }

    private detectGPUs(): void { this.devices = [{ id: 0, name: 'Apple M2 GPU', vram: 8192, vramUsed: 0, compute: 'metal', driver: 'Metal 3' }]; }

    allocate(modelId: string, vramRequired: number): GPUAllocation | null {
        const available = this.devices.filter(d => d.vram - d.vramUsed >= vramRequired);
        if (available.length === 0) return null;
        const gpu = available[0]; gpu.vramUsed += vramRequired;
        const alloc: GPUAllocation = { modelId, gpuIds: [gpu.id], layers: 32, vramRequired };
        this.allocations.set(modelId, alloc); this.emit('allocated', alloc); return alloc;
    }

    release(modelId: string): boolean { const alloc = this.allocations.get(modelId); if (!alloc) return false; alloc.gpuIds.forEach(id => { const gpu = this.devices.find(d => d.id === id); if (gpu) gpu.vramUsed -= alloc.vramRequired; }); this.allocations.delete(modelId); return true; }
    getDevices(): GPUDevice[] { return [...this.devices]; }
    getAllocations(): GPUAllocation[] { return Array.from(this.allocations.values()); }
    getAvailableVRAM(): number { return this.devices.reduce((s, d) => s + d.vram - d.vramUsed, 0); }
}
export function getGPUManagerEngine(): GPUManagerEngine { return GPUManagerEngine.getInstance(); }
