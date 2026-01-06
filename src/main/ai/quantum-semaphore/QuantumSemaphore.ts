/**
 * Quantum Semaphore
 * 
 * A semaphore that exists in quantum superposition,
 * allowing controlled concurrency across dimensions.
 */

import { EventEmitter } from 'events';

export interface QuantumSemaphore { id: string; name: string; permits: number; acquired: number; dimension: number; }

export class QuantumSemaphoreManager extends EventEmitter {
    private static instance: QuantumSemaphoreManager;
    private semaphores: Map<string, QuantumSemaphore> = new Map();

    private constructor() { super(); }
    static getInstance(): QuantumSemaphoreManager {
        if (!QuantumSemaphoreManager.instance) { QuantumSemaphoreManager.instance = new QuantumSemaphoreManager(); }
        return QuantumSemaphoreManager.instance;
    }

    create(name: string, permits: number): QuantumSemaphore {
        const sem: QuantumSemaphore = { id: `sem_${Date.now()}`, name, permits, acquired: 0, dimension: Math.floor(Math.random() * 7) };
        this.semaphores.set(sem.id, sem);
        return sem;
    }

    acquire(semId: string): boolean {
        const sem = this.semaphores.get(semId);
        if (sem && sem.acquired < sem.permits) { sem.acquired++; return true; }
        return false;
    }

    release(semId: string): boolean {
        const sem = this.semaphores.get(semId);
        if (sem && sem.acquired > 0) { sem.acquired--; return true; }
        return false;
    }

    getStats(): { total: number; totalPermits: number } {
        const sems = Array.from(this.semaphores.values());
        return { total: sems.length, totalPermits: sems.reduce((s, sem) => s + sem.permits, 0) };
    }
}

export const quantumSemaphoreManager = QuantumSemaphoreManager.getInstance();
