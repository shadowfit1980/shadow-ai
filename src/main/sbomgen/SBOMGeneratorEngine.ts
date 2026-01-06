/**
 * SBOM Generator - Software Bill of Materials
 */
import { EventEmitter } from 'events';

export interface SBOMComponent { name: string; version: string; purl: string; licenses: string[]; hashes: { algorithm: string; value: string }[]; supplier?: string; }
export interface SBOM { id: string; format: 'cyclonedx' | 'spdx'; version: string; projectName: string; components: SBOMComponent[]; createdAt: number; }

export class SBOMGeneratorEngine extends EventEmitter {
    private static instance: SBOMGeneratorEngine;
    private sboms: Map<string, SBOM> = new Map();
    private constructor() { super(); }
    static getInstance(): SBOMGeneratorEngine { if (!SBOMGeneratorEngine.instance) SBOMGeneratorEngine.instance = new SBOMGeneratorEngine(); return SBOMGeneratorEngine.instance; }

    async generate(projectPath: string, format: SBOM['format'] = 'cyclonedx'): Promise<SBOM> {
        const components: SBOMComponent[] = [
            { name: 'express', version: '4.18.2', purl: 'pkg:npm/express@4.18.2', licenses: ['MIT'], hashes: [{ algorithm: 'SHA-256', value: 'abc123' }], supplier: 'npm' },
            { name: 'lodash', version: '4.17.21', purl: 'pkg:npm/lodash@4.17.21', licenses: ['MIT'], hashes: [{ algorithm: 'SHA-256', value: 'def456' }] }
        ];
        const sbom: SBOM = { id: `sbom_${Date.now()}`, format, version: format === 'cyclonedx' ? '1.5' : '2.3', projectName: projectPath.split('/').pop() || 'project', components, createdAt: Date.now() };
        this.sboms.set(sbom.id, sbom); this.emit('generated', sbom); return sbom;
    }

    export(sbomId: string): string { const sbom = this.sboms.get(sbomId); if (!sbom) return ''; return JSON.stringify(sbom, null, 2); }
    get(sbomId: string): SBOM | null { return this.sboms.get(sbomId) || null; }
    getAll(): SBOM[] { return Array.from(this.sboms.values()); }
}
export function getSBOMGeneratorEngine(): SBOMGeneratorEngine { return SBOMGeneratorEngine.getInstance(); }
