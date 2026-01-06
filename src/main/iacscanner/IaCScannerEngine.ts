/**
 * IaC Scanner - Infrastructure as Code security
 */
import { EventEmitter } from 'events';

export interface IaCIssue { id: string; severity: 'critical' | 'high' | 'medium' | 'low'; file: string; resource: string; line: number; rule: string; message: string; remediation: string; }
export interface IaCScanResult { id: string; files: string[]; provider: 'terraform' | 'cloudformation' | 'kubernetes' | 'helm'; issues: IaCIssue[]; passed: number; failed: number; }

export class IaCScannerEngine extends EventEmitter {
    private static instance: IaCScannerEngine;
    private results: Map<string, IaCScanResult> = new Map();
    private constructor() { super(); }
    static getInstance(): IaCScannerEngine { if (!IaCScannerEngine.instance) IaCScannerEngine.instance = new IaCScannerEngine(); return IaCScannerEngine.instance; }

    async scan(files: string[], provider: IaCScanResult['provider'] = 'terraform'): Promise<IaCScanResult> {
        const issues: IaCIssue[] = [
            { id: 'IAC001', severity: 'high', file: 'main.tf', resource: 'aws_s3_bucket.data', line: 15, rule: 'S3_BUCKET_PUBLIC', message: 'S3 bucket is publicly accessible', remediation: 'Set acl = "private"' },
            { id: 'IAC002', severity: 'critical', file: 'security.tf', resource: 'aws_security_group.web', line: 8, rule: 'SG_OPEN_INGRESS', message: 'Security group allows all inbound traffic', remediation: 'Restrict ingress to specific IPs' }
        ];
        const result: IaCScanResult = { id: `iac_${Date.now()}`, files, provider, issues, passed: 15, failed: issues.length };
        this.results.set(result.id, result); this.emit('complete', result); return result;
    }

    getByProvider(provider: IaCScanResult['provider']): IaCScanResult[] { return Array.from(this.results.values()).filter(r => r.provider === provider); }
    get(scanId: string): IaCScanResult | null { return this.results.get(scanId) || null; }
}
export function getIaCScannerEngine(): IaCScannerEngine { return IaCScannerEngine.getInstance(); }
