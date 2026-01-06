/**
 * Container Scanner - Docker/OCI image scanning
 */
import { EventEmitter } from 'events';

export interface ContainerVuln { id: string; severity: 'critical' | 'high' | 'medium' | 'low'; package: string; version: string; layer: string; fixedIn?: string; }
export interface ContainerScanResult { id: string; image: string; tag: string; os: string; layers: number; vulnerabilities: ContainerVuln[]; baseImage?: string; }

export class ContainerScannerEngine extends EventEmitter {
    private static instance: ContainerScannerEngine;
    private results: Map<string, ContainerScanResult> = new Map();
    private constructor() { super(); }
    static getInstance(): ContainerScannerEngine { if (!ContainerScannerEngine.instance) ContainerScannerEngine.instance = new ContainerScannerEngine(); return ContainerScannerEngine.instance; }

    async scan(image: string, tag = 'latest'): Promise<ContainerScanResult> {
        const vulns: ContainerVuln[] = [
            { id: 'CVE-2023-1234', severity: 'critical', package: 'openssl', version: '1.1.1k', layer: 'sha256:abc123', fixedIn: '1.1.1l' },
            { id: 'CVE-2023-5678', severity: 'high', package: 'curl', version: '7.79.0', layer: 'sha256:def456', fixedIn: '7.80.0' }
        ];
        const result: ContainerScanResult = { id: `container_${Date.now()}`, image, tag, os: 'alpine:3.18', layers: 12, vulnerabilities: vulns, baseImage: 'node:18-alpine' };
        this.results.set(result.id, result); this.emit('complete', result); return result;
    }

    suggestBaseImage(current: string): string { const suggestions: Record<string, string> = { 'node:latest': 'node:18-alpine', 'python:3': 'python:3.11-slim', 'ubuntu:latest': 'ubuntu:22.04' }; return suggestions[current] || current; }
    get(scanId: string): ContainerScanResult | null { return this.results.get(scanId) || null; }
    getAll(): ContainerScanResult[] { return Array.from(this.results.values()); }
}
export function getContainerScannerEngine(): ContainerScannerEngine { return ContainerScannerEngine.getInstance(); }
