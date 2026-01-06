/**
 * Omnipresent Code Guardian
 * 
 * An always-watching guardian that monitors code health across
 * all dimensions: quality, security, performance, and maintainability.
 */

import { EventEmitter } from 'events';

export interface GuardianReport {
    id: string;
    code: string;
    dimensions: GuardianDimension[];
    alerts: Alert[];
    overallHealth: number;
    guardianAdvice: string[];
    timestamp: Date;
}

export interface GuardianDimension {
    name: 'quality' | 'security' | 'performance' | 'maintainability';
    score: number;
    issues: Issue[];
    improvements: string[];
}

export interface Issue {
    severity: 'critical' | 'warning' | 'info';
    description: string;
    location?: string;
    fix?: string;
}

export interface Alert {
    id: string;
    type: 'danger' | 'warning' | 'suggestion';
    message: string;
    actionRequired: boolean;
}

export class OmnipresentCodeGuardian extends EventEmitter {
    private static instance: OmnipresentCodeGuardian;
    private reports: Map<string, GuardianReport> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): OmnipresentCodeGuardian {
        if (!OmnipresentCodeGuardian.instance) {
            OmnipresentCodeGuardian.instance = new OmnipresentCodeGuardian();
        }
        return OmnipresentCodeGuardian.instance;
    }

    watch(code: string): GuardianReport {
        const dimensions = this.analyzeDimensions(code);
        const alerts = this.generateAlerts(dimensions);
        const overallHealth = this.calculateOverallHealth(dimensions);
        const guardianAdvice = this.generateAdvice(dimensions, alerts);

        const report: GuardianReport = {
            id: `guardian_${Date.now()}`,
            code,
            dimensions,
            alerts,
            overallHealth,
            guardianAdvice,
            timestamp: new Date(),
        };

        this.reports.set(report.id, report);
        this.emit('report:generated', report);
        return report;
    }

    private analyzeDimensions(code: string): GuardianDimension[] {
        return [
            this.analyzeQuality(code),
            this.analyzeSecurity(code),
            this.analyzePerformance(code),
            this.analyzeMaintainability(code),
        ];
    }

    private analyzeQuality(code: string): GuardianDimension {
        const issues: Issue[] = [];
        const improvements: string[] = [];
        let score = 1;

        // Check for any type
        if (code.includes(': any')) {
            issues.push({
                severity: 'warning',
                description: 'Usage of any type bypasses type checking',
                fix: 'Use specific types or unknown',
            });
            score -= 0.15;
        }

        // Check for console.log
        if (code.includes('console.log')) {
            issues.push({
                severity: 'info',
                description: 'Debug console.log statements found',
                fix: 'Remove or use proper logging',
            });
            score -= 0.05;
        }

        // Check for type annotations
        if (code.includes('function') && !code.includes(': ')) {
            improvements.push('Add type annotations for better type safety');
            score -= 0.1;
        }

        if (code.includes('interface') || code.includes('type ')) {
            score += 0.1; // Bonus for type definitions
        }

        return {
            name: 'quality',
            score: Math.max(0, Math.min(1, score)),
            issues,
            improvements,
        };
    }

    private analyzeSecurity(code: string): GuardianDimension {
        const issues: Issue[] = [];
        const improvements: string[] = [];
        let score = 1;

        // Check for eval
        if (code.includes('eval(')) {
            issues.push({
                severity: 'critical',
                description: 'eval() is a security risk',
                fix: 'Use safer alternatives like JSON.parse',
            });
            score -= 0.4;
        }

        // Check for innerHTML
        if (code.includes('innerHTML')) {
            issues.push({
                severity: 'warning',
                description: 'innerHTML can lead to XSS vulnerabilities',
                fix: 'Use textContent or sanitize input',
            });
            score -= 0.2;
        }

        // Check for hardcoded secrets
        if (code.match(/password|secret|apikey|api_key/i) && code.match(/['"]\w{10,}['"]/)) {
            issues.push({
                severity: 'critical',
                description: 'Possible hardcoded credentials detected',
                fix: 'Use environment variables',
            });
            score -= 0.3;
        }

        if (issues.length === 0) {
            improvements.push('Consider adding input validation');
        }

        return {
            name: 'security',
            score: Math.max(0, Math.min(1, score)),
            issues,
            improvements,
        };
    }

    private analyzePerformance(code: string): GuardianDimension {
        const issues: Issue[] = [];
        const improvements: string[] = [];
        let score = 1;

        // Check for nested loops
        const forLoops = (code.match(/for\s*\(/g) || []).length;
        if (forLoops > 2) {
            issues.push({
                severity: 'warning',
                description: 'Multiple nested loops may cause performance issues',
                fix: 'Consider using Map/Set or optimizing algorithm',
            });
            score -= 0.15;
        }

        // Check for synchronous file operations
        if (code.includes('Sync(')) {
            issues.push({
                severity: 'warning',
                description: 'Synchronous operations block the event loop',
                fix: 'Use async versions',
            });
            score -= 0.2;
        }

        // Bonus for async/await usage
        if (code.includes('async') && code.includes('await')) {
            improvements.push('Good use of async/await for non-blocking operations');
            score += 0.05;
        }

        return {
            name: 'performance',
            score: Math.max(0, Math.min(1, score)),
            issues,
            improvements,
        };
    }

    private analyzeMaintainability(code: string): GuardianDimension {
        const issues: Issue[] = [];
        const improvements: string[] = [];
        let score = 1;
        const lines = code.split('\n');

        // Check for long functions
        if (lines.length > 100) {
            issues.push({
                severity: 'warning',
                description: 'Long file may be difficult to maintain',
                fix: 'Break into smaller modules',
            });
            score -= 0.15;
        }

        // Check for comments
        const hasComments = code.includes('//') || code.includes('/*');
        if (!hasComments && lines.length > 50) {
            issues.push({
                severity: 'info',
                description: 'Lack of comments in sizeable code',
                fix: 'Add documentation comments',
            });
            score -= 0.1;
        }

        // Check for exports
        if (code.includes('export')) {
            improvements.push('Good modular structure with exports');
            score += 0.05;
        }

        return {
            name: 'maintainability',
            score: Math.max(0, Math.min(1, score)),
            issues,
            improvements,
        };
    }

    private generateAlerts(dimensions: GuardianDimension[]): Alert[] {
        const alerts: Alert[] = [];

        for (const dim of dimensions) {
            for (const issue of dim.issues) {
                if (issue.severity === 'critical') {
                    alerts.push({
                        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        type: 'danger',
                        message: `[${dim.name.toUpperCase()}] ${issue.description}`,
                        actionRequired: true,
                    });
                }
            }

            if (dim.score < 0.5) {
                alerts.push({
                    id: `alert_low_${dim.name}`,
                    type: 'warning',
                    message: `Low ${dim.name} score: ${Math.round(dim.score * 100)}%`,
                    actionRequired: false,
                });
            }
        }

        return alerts;
    }

    private calculateOverallHealth(dimensions: GuardianDimension[]): number {
        if (dimensions.length === 0) return 0;
        return dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length;
    }

    private generateAdvice(dimensions: GuardianDimension[], alerts: Alert[]): string[] {
        const advice: string[] = [];

        if (alerts.some(a => a.type === 'danger')) {
            advice.push('⚠️ Address critical issues before deploying');
        }

        const lowestDim = dimensions.reduce((min, d) => d.score < min.score ? d : min);
        advice.push(`Focus on improving ${lowestDim.name} (currently ${Math.round(lowestDim.score * 100)}%)`);

        for (const dim of dimensions) {
            if (dim.improvements.length > 0) {
                advice.push(...dim.improvements.slice(0, 1));
            }
        }

        return advice.slice(0, 5);
    }

    getReport(id: string): GuardianReport | undefined {
        return this.reports.get(id);
    }

    getStats(): { total: number; avgHealth: number; criticalIssues: number } {
        const reports = Array.from(this.reports.values());
        const criticalIssues = reports.reduce((s, r) =>
            s + r.alerts.filter(a => a.type === 'danger').length, 0);

        return {
            total: reports.length,
            avgHealth: reports.length > 0
                ? reports.reduce((s, r) => s + r.overallHealth, 0) / reports.length
                : 0,
            criticalIssues,
        };
    }
}

export const omnipresentCodeGuardian = OmnipresentCodeGuardian.getInstance();
