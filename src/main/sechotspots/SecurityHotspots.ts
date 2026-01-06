/**
 * Security Hotspots - Security-sensitive code
 */
import { EventEmitter } from 'events';

export interface SecurityHotspot { id: string; file: string; line: number; category: 'sql-injection' | 'xss' | 'path-traversal' | 'hardcoded-secrets' | 'insecure-crypto'; status: 'to-review' | 'safe' | 'vulnerable'; message: string; }

export class SecurityHotspots extends EventEmitter {
    private static instance: SecurityHotspots;
    private hotspots: Map<string, SecurityHotspot[]> = new Map();
    private patterns = [
        { regex: /password\s*=\s*['"][^'"]+['"]/gi, category: 'hardcoded-secrets' as const, message: 'Hardcoded password detected' },
        { regex: /eval\s*\(/g, category: 'xss' as const, message: 'Use of eval() is dangerous' },
        { regex: /exec\s*\(/g, category: 'sql-injection' as const, message: 'Use of exec() may allow injection' }
    ];
    private constructor() { super(); }
    static getInstance(): SecurityHotspots { if (!SecurityHotspots.instance) SecurityHotspots.instance = new SecurityHotspots(); return SecurityHotspots.instance; }

    scan(file: string, code: string): SecurityHotspot[] {
        const results: SecurityHotspot[] = [];
        this.patterns.forEach(p => { let match; while ((match = p.regex.exec(code)) !== null) { results.push({ id: `hs_${Date.now()}_${results.length}`, file, line: code.slice(0, match.index).split('\n').length, category: p.category, status: 'to-review', message: p.message }); } p.regex.lastIndex = 0; });
        this.hotspots.set(file, results); this.emit('scanned', { file, count: results.length }); return results;
    }

    review(id: string, status: 'safe' | 'vulnerable'): boolean { for (const hs of this.hotspots.values()) { const h = hs.find(x => x.id === id); if (h) { h.status = status; return true; } } return false; }
    getUnreviewed(): SecurityHotspot[] { return Array.from(this.hotspots.values()).flat().filter(h => h.status === 'to-review'); }
    getAll(): SecurityHotspot[] { return Array.from(this.hotspots.values()).flat(); }
}
export function getSecurityHotspots(): SecurityHotspots { return SecurityHotspots.getInstance(); }
