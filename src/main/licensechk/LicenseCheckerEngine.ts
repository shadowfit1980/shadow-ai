/**
 * License Checker - OSS license compliance
 */
import { EventEmitter } from 'events';

export interface LicenseInfo { packageName: string; version: string; license: string; spdxId?: string; riskLevel: 'low' | 'medium' | 'high'; compatible: boolean; }
export interface LicensePolicy { allowed: string[]; denied: string[]; requireReview: string[]; }

export class LicenseCheckerEngine extends EventEmitter {
    private static instance: LicenseCheckerEngine;
    private policy: LicensePolicy = { allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'], denied: ['GPL-3.0', 'AGPL-3.0'], requireReview: ['LGPL-2.1', 'MPL-2.0'] };
    private results: Map<string, LicenseInfo[]> = new Map();
    private constructor() { super(); }
    static getInstance(): LicenseCheckerEngine { if (!LicenseCheckerEngine.instance) LicenseCheckerEngine.instance = new LicenseCheckerEngine(); return LicenseCheckerEngine.instance; }

    async check(projectPath: string): Promise<LicenseInfo[]> {
        const licenses: LicenseInfo[] = [
            { packageName: 'express', version: '4.18.2', license: 'MIT', spdxId: 'MIT', riskLevel: 'low', compatible: true },
            { packageName: 'some-gpl-lib', version: '1.0.0', license: 'GPL-3.0', spdxId: 'GPL-3.0', riskLevel: 'high', compatible: false }
        ];
        this.results.set(projectPath, licenses); this.emit('checked', { projectPath, licenses }); return licenses;
    }

    setPolicy(policy: Partial<LicensePolicy>): void { Object.assign(this.policy, policy); }
    getPolicy(): LicensePolicy { return { ...this.policy }; }
    getViolations(projectPath: string): LicenseInfo[] { return (this.results.get(projectPath) || []).filter(l => !l.compatible); }
    getByRisk(projectPath: string, risk: LicenseInfo['riskLevel']): LicenseInfo[] { return (this.results.get(projectPath) || []).filter(l => l.riskLevel === risk); }
}
export function getLicenseCheckerEngine(): LicenseCheckerEngine { return LicenseCheckerEngine.getInstance(); }
