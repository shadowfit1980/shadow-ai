/**
 * Endpoint Versioning - Version management
 */
import { EventEmitter } from 'events';

export interface EndpointVersion { id: string; endpointId: string; version: string; modelVersion: string; configHash: string; createdAt: number; active: boolean; trafficWeight: number; }

export class EndpointVersioningEngine extends EventEmitter {
    private static instance: EndpointVersioningEngine;
    private versions: Map<string, EndpointVersion[]> = new Map();
    private constructor() { super(); }
    static getInstance(): EndpointVersioningEngine { if (!EndpointVersioningEngine.instance) EndpointVersioningEngine.instance = new EndpointVersioningEngine(); return EndpointVersioningEngine.instance; }

    createVersion(endpointId: string, modelVersion: string): EndpointVersion { const versions = this.versions.get(endpointId) || []; const version: EndpointVersion = { id: `ver_${Date.now()}`, endpointId, version: `v${versions.length + 1}`, modelVersion, configHash: Math.random().toString(36).slice(2, 10), createdAt: Date.now(), active: false, trafficWeight: 0 }; versions.push(version); this.versions.set(endpointId, versions); return version; }

    activate(versionId: string, weight = 100): boolean {
        for (const [epId, versions] of this.versions) {
            const ver = versions.find(v => v.id === versionId); if (ver) {
                if (weight === 100) versions.forEach(v => { v.active = false; v.trafficWeight = 0; });
                ver.active = true; ver.trafficWeight = weight; this.emit('activated', ver); return true;
            }
        } return false;
    }

    canary(endpointId: string, newVersionId: string, canaryWeight = 10): boolean { const versions = this.versions.get(endpointId); if (!versions) return false; const newVer = versions.find(v => v.id === newVersionId); const currentActive = versions.find(v => v.active && v.trafficWeight > 50); if (!newVer || !currentActive) return false; currentActive.trafficWeight = 100 - canaryWeight; newVer.active = true; newVer.trafficWeight = canaryWeight; return true; }
    getVersions(endpointId: string): EndpointVersion[] { return this.versions.get(endpointId) || []; }
}
export function getEndpointVersioningEngine(): EndpointVersioningEngine { return EndpointVersioningEngine.getInstance(); }
