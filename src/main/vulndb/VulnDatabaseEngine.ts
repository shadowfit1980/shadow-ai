/**
 * Vuln Database - Vulnerability intelligence
 */
import { EventEmitter } from 'events';

export interface VulnEntry { id: string; cve?: string; cwe?: string; severity: 'critical' | 'high' | 'medium' | 'low'; title: string; description: string; affectedPackages: { name: string; versions: string }[]; references: string[]; publishedAt: number; }

export class VulnDatabaseEngine extends EventEmitter {
    private static instance: VulnDatabaseEngine;
    private entries: Map<string, VulnEntry> = new Map();
    private lastUpdated = Date.now();
    private constructor() { super(); this.initSampleData(); }
    static getInstance(): VulnDatabaseEngine { if (!VulnDatabaseEngine.instance) VulnDatabaseEngine.instance = new VulnDatabaseEngine(); return VulnDatabaseEngine.instance; }

    private initSampleData(): void {
        const samples: VulnEntry[] = [
            { id: 'SNYK-JS-LODASH-567746', cve: 'CVE-2021-23337', cwe: 'CWE-1321', severity: 'high', title: 'Prototype Pollution in lodash', description: 'Lodash versions < 4.17.21 are vulnerable', affectedPackages: [{ name: 'lodash', versions: '<4.17.21' }], references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-23337'], publishedAt: Date.now() - 86400000 },
            { id: 'SNYK-JS-AXIOS-1579269', cve: 'CVE-2021-3749', severity: 'high', title: 'SSRF in axios', description: 'Axios < 0.21.1 allows SSRF', affectedPackages: [{ name: 'axios', versions: '<0.21.1' }], references: [], publishedAt: Date.now() - 172800000 }
        ];
        samples.forEach(s => this.entries.set(s.id, s));
    }

    search(query: string): VulnEntry[] { const q = query.toLowerCase(); return Array.from(this.entries.values()).filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)); }
    getById(id: string): VulnEntry | null { return this.entries.get(id) || null; }
    getBySeverity(severity: VulnEntry['severity']): VulnEntry[] { return Array.from(this.entries.values()).filter(e => e.severity === severity); }
    getRecent(limit = 10): VulnEntry[] { return Array.from(this.entries.values()).sort((a, b) => b.publishedAt - a.publishedAt).slice(0, limit); }
    getCount(): number { return this.entries.size; }
}
export function getVulnDatabaseEngine(): VulnDatabaseEngine { return VulnDatabaseEngine.getInstance(); }
