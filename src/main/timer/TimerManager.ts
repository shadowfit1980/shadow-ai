/**
 * Timer Manager
 * Timers and intervals
 */

import { EventEmitter } from 'events';

export interface Timer {
    id: string;
    name: string;
    duration: number;
    remaining: number;
    running: boolean;
    startedAt?: number;
}

export class TimerManager extends EventEmitter {
    private static instance: TimerManager;
    private timers: Map<string, Timer> = new Map();
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    private constructor() { super(); }

    static getInstance(): TimerManager {
        if (!TimerManager.instance) TimerManager.instance = new TimerManager();
        return TimerManager.instance;
    }

    create(name: string, durationMs: number): Timer {
        const timer: Timer = { id: `timer_${Date.now()}`, name, duration: durationMs, remaining: durationMs, running: false };
        this.timers.set(timer.id, timer);
        return timer;
    }

    start(id: string): boolean {
        const timer = this.timers.get(id);
        if (!timer || timer.running) return false;

        timer.running = true;
        timer.startedAt = Date.now();

        const interval = setInterval(() => {
            timer.remaining = Math.max(0, timer.duration - (Date.now() - timer.startedAt!));
            if (timer.remaining <= 0) {
                this.stop(id);
                this.emit('completed', timer);
            }
        }, 100);

        this.intervals.set(id, interval);
        this.emit('started', timer);
        return true;
    }

    stop(id: string): boolean {
        const timer = this.timers.get(id);
        const interval = this.intervals.get(id);
        if (!timer) return false;

        if (interval) clearInterval(interval);
        this.intervals.delete(id);
        timer.running = false;
        this.emit('stopped', timer);
        return true;
    }

    reset(id: string): boolean {
        const timer = this.timers.get(id);
        if (!timer) return false;
        this.stop(id);
        timer.remaining = timer.duration;
        return true;
    }

    getAll(): Timer[] { return Array.from(this.timers.values()); }
    delete(id: string): boolean { this.stop(id); return this.timers.delete(id); }
}

export function getTimerManager(): TimerManager { return TimerManager.getInstance(); }
