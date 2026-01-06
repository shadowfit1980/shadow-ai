/**
 * Hosting Manager - Static/dynamic hosting
 */
import { EventEmitter } from 'events';

export interface HostedSite { id: string; name: string; domain: string; type: 'static' | 'dynamic'; ssl: boolean; status: 'active' | 'inactive'; visits: number; }

export class HostingManager extends EventEmitter {
    private static instance: HostingManager;
    private sites: Map<string, HostedSite> = new Map();
    private constructor() { super(); }
    static getInstance(): HostingManager { if (!HostingManager.instance) HostingManager.instance = new HostingManager(); return HostingManager.instance; }

    host(name: string, type: HostedSite['type'] = 'static'): HostedSite {
        const site: HostedSite = { id: `host_${Date.now()}`, name, domain: `${name.toLowerCase().replace(/\s/g, '-')}.shadow.app`, type, ssl: true, status: 'active', visits: 0 };
        this.sites.set(site.id, site);
        this.emit('hosted', site);
        return site;
    }

    setCustomDomain(id: string, domain: string): boolean { const s = this.sites.get(id); if (!s) return false; s.domain = domain; return true; }
    toggleSSL(id: string): boolean { const s = this.sites.get(id); if (!s) return false; s.ssl = !s.ssl; return true; }
    deactivate(id: string): boolean { const s = this.sites.get(id); if (!s) return false; s.status = 'inactive'; return true; }
    getActive(): HostedSite[] { return Array.from(this.sites.values()).filter(s => s.status === 'active'); }
    getAll(): HostedSite[] { return Array.from(this.sites.values()); }
}
export function getHostingManager(): HostingManager { return HostingManager.getInstance(); }
