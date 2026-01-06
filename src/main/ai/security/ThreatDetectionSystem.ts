/**
 * Threat Detection System
 * 
 * Real-time security threat detection and response
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export enum ThreatLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum ThreatCategory {
    MALICIOUS_CODE = 'malicious_code',
    DATA_EXFILTRATION = 'data_exfiltration',
    UNAUTHORIZED_ACCESS = 'unauthorized_access',
    RESOURCE_ABUSE = 'resource_abuse',
    CONFIGURATION_RISK = 'configuration_risk',
    DEPENDENCY_VULNERABILITY = 'dependency_vulnerability',
}

export interface Threat {
    id: string;
    category: ThreatCategory;
    level: ThreatLevel;
    title: string;
    description: string;
    source: string;
    timestamp: Date;
    indicators: string[];
    remediation: string[];
    status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
}

export interface ThreatRule {
    id: string;
    name: string;
    category: ThreatCategory;
    level: ThreatLevel;
    enabled: boolean;
    patterns: RegExp[];
    fileTypes: string[];
    description: string;
    remediation: string;
}

export interface ThreatScanResult {
    scannedFiles: number;
    threatsFound: number;
    threats: Threat[];
    scanDuration: number;
    timestamp: Date;
}

/**
 * ThreatDetectionSystem - Real-time security monitoring
 */
export class ThreatDetectionSystem extends EventEmitter {
    private static instance: ThreatDetectionSystem;
    private rules: Map<string, ThreatRule> = new Map();
    private threats: Map<string, Threat> = new Map();
    private isMonitoring: boolean = false;

    private constructor() {
        super();
        this.initializeRules();
    }

    static getInstance(): ThreatDetectionSystem {
        if (!ThreatDetectionSystem.instance) {
            ThreatDetectionSystem.instance = new ThreatDetectionSystem();
        }
        return ThreatDetectionSystem.instance;
    }

    /**
     * Initialize threat detection rules
     */
    private initializeRules(): void {
        // Malicious code patterns
        this.addRule({
            id: 'exec-injection',
            name: 'Command Injection',
            category: ThreatCategory.MALICIOUS_CODE,
            level: ThreatLevel.CRITICAL,
            enabled: true,
            patterns: [
                /exec\s*\(\s*[`'"].*\$\{/gi,
                /child_process.*exec.*\+/gi,
                /spawn\s*\(\s*.*\+/gi,
            ],
            fileTypes: ['.js', '.ts', '.tsx'],
            description: 'Detected potential command injection vulnerability',
            remediation: 'Use parameterized commands and sanitize user input',
        });

        this.addRule({
            id: 'eval-usage',
            name: 'Dangerous Eval Usage',
            category: ThreatCategory.MALICIOUS_CODE,
            level: ThreatLevel.HIGH,
            enabled: true,
            patterns: [
                /eval\s*\([^)]*\+/gi,
                /new\s+Function\s*\([^)]*\+/gi,
                /setTimeout\s*\(\s*[`'"][^)]+\+/gi,
            ],
            fileTypes: ['.js', '.ts', '.tsx'],
            description: 'Detected dangerous use of eval or dynamic code execution',
            remediation: 'Avoid eval; use safer alternatives like JSON.parse',
        });

        // Data exfiltration
        this.addRule({
            id: 'hardcoded-secrets',
            name: 'Hardcoded Secrets',
            category: ThreatCategory.DATA_EXFILTRATION,
            level: ThreatLevel.HIGH,
            enabled: true,
            patterns: [
                /['"]sk[-_]live[-_][a-zA-Z0-9]{20,}['"]/gi,
                /['"]AIza[0-9A-Za-z-_]{35}['"]/gi,
                /password\s*[=:]\s*['"][^'"]{8,}['"]/gi,
                /api[_-]?key\s*[=:]\s*['"][^'"]{16,}['"]/gi,
            ],
            fileTypes: ['.js', '.ts', '.tsx', '.env', '.json'],
            description: 'Detected hardcoded secrets or API keys',
            remediation: 'Use environment variables and secret management',
        });

        this.addRule({
            id: 'suspicious-network',
            name: 'Suspicious Network Activity',
            category: ThreatCategory.DATA_EXFILTRATION,
            level: ThreatLevel.MEDIUM,
            enabled: true,
            patterns: [
                /fetch\s*\(\s*['"]http:\/\/(?!localhost)/gi,
                /axios\s*\.\s*\w+\s*\(\s*['"]http:\/\/(?!localhost)/gi,
                /webhook.*['"][^'"]+['"]/gi,
            ],
            fileTypes: ['.js', '.ts', '.tsx'],
            description: 'Detected potentially suspicious network requests',
            remediation: 'Review network destinations and use HTTPS',
        });

        // Unauthorized access
        this.addRule({
            id: 'weak-auth',
            name: 'Weak Authentication',
            category: ThreatCategory.UNAUTHORIZED_ACCESS,
            level: ThreatLevel.MEDIUM,
            enabled: true,
            patterns: [
                /jwt\.sign\([^)]*expiresIn:\s*['"]?\d+d/gi,
                /bcrypt\..*rounds?\s*[:<]\s*[1-9]\b/gi,
                /basic\s+auth/gi,
            ],
            fileTypes: ['.js', '.ts'],
            description: 'Detected weak authentication patterns',
            remediation: 'Use strong authentication mechanisms',
        });

        // Resource abuse
        this.addRule({
            id: 'memory-leak',
            name: 'Potential Memory Leak',
            category: ThreatCategory.RESOURCE_ABUSE,
            level: ThreatLevel.LOW,
            enabled: true,
            patterns: [
                /setInterval\s*\([^)]+\)\s*[^.]/gi,
                /addEventListener.*(?!removeEventListener)/gi,
            ],
            fileTypes: ['.js', '.ts', '.tsx'],
            description: 'Detected potential memory leak patterns',
            remediation: 'Ensure event listeners are properly cleaned up',
        });

        // Configuration risks
        this.addRule({
            id: 'insecure-config',
            name: 'Insecure Configuration',
            category: ThreatCategory.CONFIGURATION_RISK,
            level: ThreatLevel.MEDIUM,
            enabled: true,
            patterns: [
                /cors\s*:\s*['"]?\*['"]?/gi,
                /secure\s*:\s*false/gi,
                /disable.*ssl/gi,
                /NODE_TLS_REJECT_UNAUTHORIZED.*0/gi,
            ],
            fileTypes: ['.js', '.ts', '.json', '.yaml', '.yml'],
            description: 'Detected insecure configuration settings',
            remediation: 'Review and harden security configurations',
        });

        // SQL Injection
        this.addRule({
            id: 'sql-injection',
            name: 'SQL Injection',
            category: ThreatCategory.MALICIOUS_CODE,
            level: ThreatLevel.CRITICAL,
            enabled: true,
            patterns: [
                /query\s*\([^)]*\$\{[^}]+\}/gi,
                /execute\s*\([^)]*\+[^)]*\)/gi,
                /['"]SELECT.*FROM.*WHERE.*\+/gi,
            ],
            fileTypes: ['.js', '.ts'],
            description: 'Detected potential SQL injection vulnerability',
            remediation: 'Use parameterized queries or ORM',
        });

        // XSS
        this.addRule({
            id: 'xss-vulnerability',
            name: 'XSS Vulnerability',
            category: ThreatCategory.MALICIOUS_CODE,
            level: ThreatLevel.HIGH,
            enabled: true,
            patterns: [
                /innerHTML\s*=\s*[^'"]/gi,
                /dangerouslySetInnerHTML/gi,
                /document\.write\s*\(/gi,
            ],
            fileTypes: ['.js', '.ts', '.tsx', '.html'],
            description: 'Detected potential XSS vulnerability',
            remediation: 'Sanitize user input and use safe DOM methods',
        });

        console.log(`🛡️ [ThreatDetection] Initialized ${this.rules.size} detection rules`);
    }

    /**
     * Add a detection rule
     */
    addRule(rule: ThreatRule): void {
        this.rules.set(rule.id, rule);
    }

    /**
     * Scan a file for threats
     */
    async scanFile(filePath: string): Promise<Threat[]> {
        const threats: Threat[] = [];
        const ext = path.extname(filePath).toLowerCase();

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            for (const [, rule] of this.rules) {
                if (!rule.enabled) continue;
                if (!rule.fileTypes.includes(ext)) continue;

                for (const pattern of rule.patterns) {
                    pattern.lastIndex = 0; // Reset regex
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        const lineNum = content.slice(0, match.index).split('\n').length;
                        const threat = this.createThreat(rule, filePath, lineNum, match[0]);
                        threats.push(threat);
                        this.threats.set(threat.id, threat);
                        this.emit('threat:detected', threat);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning file ${filePath}:`, error);
        }

        return threats;
    }

    /**
     * Scan a directory for threats
     */
    async scanDirectory(dirPath: string): Promise<ThreatScanResult> {
        const startTime = Date.now();
        const threats: Threat[] = [];
        let scannedFiles = 0;

        const scanRecursive = async (currentPath: string) => {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);

                // Skip node_modules and hidden directories
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await scanRecursive(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    const hasMatchingRule = Array.from(this.rules.values())
                        .some(r => r.fileTypes.includes(ext));

                    if (hasMatchingRule) {
                        const fileThreats = await this.scanFile(fullPath);
                        threats.push(...fileThreats);
                        scannedFiles++;
                    }
                }
            }
        };

        await scanRecursive(dirPath);

        const result: ThreatScanResult = {
            scannedFiles,
            threatsFound: threats.length,
            threats,
            scanDuration: Date.now() - startTime,
            timestamp: new Date(),
        };

        this.emit('scan:complete', result);
        return result;
    }

    /**
     * Create a threat record
     */
    private createThreat(rule: ThreatRule, source: string, line: number, matchedCode: string): Threat {
        return {
            id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            category: rule.category,
            level: rule.level,
            title: rule.name,
            description: rule.description,
            source: `${source}:${line}`,
            timestamp: new Date(),
            indicators: [matchedCode.substring(0, 100)],
            remediation: [rule.remediation],
            status: 'detected',
        };
    }

    /**
     * Update threat status
     */
    updateThreatStatus(threatId: string, status: Threat['status']): boolean {
        const threat = this.threats.get(threatId);
        if (threat) {
            threat.status = status;
            this.emit('threat:updated', threat);
            return true;
        }
        return false;
    }

    /**
     * Get active threats
     */
    getActiveThreats(): Threat[] {
        return Array.from(this.threats.values())
            .filter(t => t.status !== 'resolved');
    }

    /**
     * Get threats by level
     */
    getThreatsByLevel(level: ThreatLevel): Threat[] {
        return Array.from(this.threats.values())
            .filter(t => t.level === level);
    }

    /**
     * Get threat summary
     */
    getThreatSummary(): Record<string, number> {
        const summary: Record<string, number> = {
            total: this.threats.size,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        for (const threat of this.threats.values()) {
            summary[threat.level]++;
        }

        return summary;
    }

    /**
     * Get all rules
     */
    getRules(): ThreatRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Enable/disable a rule
     */
    setRuleEnabled(ruleId: string, enabled: boolean): boolean {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = enabled;
            return true;
        }
        return false;
    }

    /**
     * Start real-time monitoring
     */
    startMonitoring(): void {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.emit('monitoring:started');
        console.log('🛡️ [ThreatDetection] Real-time monitoring started');
    }

    /**
     * Stop real-time monitoring
     */
    stopMonitoring(): void {
        this.isMonitoring = false;
        this.emit('monitoring:stopped');
        console.log('🛡️ [ThreatDetection] Real-time monitoring stopped');
    }

    /**
     * Check if monitoring is active
     */
    isMonitoringActive(): boolean {
        return this.isMonitoring;
    }

    /**
     * Clear resolved threats
     */
    clearResolvedThreats(): number {
        let cleared = 0;
        for (const [id, threat] of this.threats) {
            if (threat.status === 'resolved') {
                this.threats.delete(id);
                cleared++;
            }
        }
        return cleared;
    }
}

export default ThreatDetectionSystem;
