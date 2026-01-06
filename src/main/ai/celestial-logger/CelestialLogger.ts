/**
 * Celestial Logger
 * 
 * Logs messages to the celestial record, where every
 * event is preserved in cosmic history.
 */

import { EventEmitter } from 'events';

export interface CelestialLog {
    id: string;
    level: 'info' | 'warning' | 'error' | 'cosmic';
    message: string;
    constellation: string;
    timestamp: Date;
}

export class CelestialLogger extends EventEmitter {
    private static instance: CelestialLogger;
    private logs: Map<string, CelestialLog> = new Map();

    private constructor() { super(); }

    static getInstance(): CelestialLogger {
        if (!CelestialLogger.instance) {
            CelestialLogger.instance = new CelestialLogger();
        }
        return CelestialLogger.instance;
    }

    log(level: CelestialLog['level'], message: string): CelestialLog {
        const log: CelestialLog = {
            id: `log_${Date.now()}`,
            level,
            message,
            constellation: this.assignConstellation(level),
            timestamp: new Date(),
        };

        this.logs.set(log.id, log);
        this.emit('log:created', log);
        return log;
    }

    private assignConstellation(level: string): string {
        const map: Record<string, string> = {
            info: 'Cassiopeia',
            warning: 'Draco',
            error: 'Scorpius',
            cosmic: 'Andromeda',
        };
        return map[level] || 'Unknown';
    }

    query(level?: string): CelestialLog[] {
        const logs = Array.from(this.logs.values());
        return level ? logs.filter(l => l.level === level) : logs;
    }

    getStats(): { total: number; byLevel: Record<string, number> } {
        const logs = Array.from(this.logs.values());
        const byLevel: Record<string, number> = {};
        for (const log of logs) {
            byLevel[log.level] = (byLevel[log.level] || 0) + 1;
        }
        return { total: logs.length, byLevel };
    }
}

export const celestialLogger = CelestialLogger.getInstance();
