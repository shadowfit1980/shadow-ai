/**
 * Ethereal Sleep Function
 */
import { EventEmitter } from 'events';
export class EtherealSleepFunction extends EventEmitter {
    private static instance: EtherealSleepFunction;
    private constructor() { super(); }
    static getInstance(): EtherealSleepFunction { if (!EtherealSleepFunction.instance) { EtherealSleepFunction.instance = new EtherealSleepFunction(); } return EtherealSleepFunction.instance; }
    sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
    async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> { let timeout: NodeJS.Timeout; const timeoutPromise = new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Timeout')), ms); }); try { return await Promise.race([promise, timeoutPromise]); } finally { clearTimeout(timeout!); } }
    getStats(): { sleeps: number } { return { sleeps: 0 }; }
}
export const etherealSleepFunction = EtherealSleepFunction.getInstance();
