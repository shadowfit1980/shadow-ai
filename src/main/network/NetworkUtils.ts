/**
 * Network Utilities
 */
import { EventEmitter } from 'events';
import * as os from 'os';
import * as dns from 'dns';

export class NetworkUtils extends EventEmitter {
    private static instance: NetworkUtils;
    private constructor() { super(); }
    static getInstance(): NetworkUtils { if (!NetworkUtils.instance) NetworkUtils.instance = new NetworkUtils(); return NetworkUtils.instance; }

    getInterfaces(): Record<string, any[]> { return os.networkInterfaces(); }
    getLocalIP(): string {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
                if (iface.family === 'IPv4' && !iface.internal) return iface.address;
            }
        }
        return '127.0.0.1';
    }
    async lookup(hostname: string): Promise<string> {
        return new Promise((resolve, reject) => {
            dns.lookup(hostname, (err, address) => err ? reject(err) : resolve(address));
        });
    }
    async ping(host: string): Promise<boolean> { try { await this.lookup(host); return true; } catch { return false; } }
}

export function getNetworkUtils(): NetworkUtils { return NetworkUtils.getInstance(); }
