/**
 * System Info
 */
import { EventEmitter } from 'events';
import * as os from 'os';

export class SystemInfo extends EventEmitter {
    private static instance: SystemInfo;
    private constructor() { super(); }
    static getInstance(): SystemInfo { if (!SystemInfo.instance) SystemInfo.instance = new SystemInfo(); return SystemInfo.instance; }

    getPlatform(): string { return os.platform(); }
    getArch(): string { return os.arch(); }
    getHostname(): string { return os.hostname(); }
    getUptime(): number { return os.uptime(); }
    getTotalMemory(): number { return os.totalmem(); }
    getFreeMemory(): number { return os.freemem(); }
    getCPUs(): os.CpuInfo[] { return os.cpus(); }
    getVersion(): string { return os.version(); }
    getRelease(): string { return os.release(); }
    getInfo(): Record<string, any> {
        return {
            platform: this.getPlatform(), arch: this.getArch(), hostname: this.getHostname(),
            uptime: this.getUptime(), totalMem: this.getTotalMemory(), freeMem: this.getFreeMemory(), cpus: this.getCPUs().length
        };
    }
}

export function getSystemInfo(): SystemInfo { return SystemInfo.getInstance(); }
