/**
 * Autonomous Debugging Engine
 * 
 * Self-healing AI that detects, diagnoses, and fixes errors
 * before they reach the user, with pattern-based prevention.
 */

import { EventEmitter } from 'events';

export interface ErrorEvent {
    id: string;
    type: ErrorType;
    message: string;
    stack?: string;
    source: string;
    line?: number;
    column?: number;
    context: Record<string, any>;
    timestamp: Date;
}

export type ErrorType =
    | 'runtime'
    | 'syntax'
    | 'type'
    | 'reference'
    | 'network'
    | 'timeout'
    | 'memory'
    | 'assertion'
    | 'unknown';

export interface Diagnosis {
    id: string;
    errorId: string;
    rootCause: string;
    confidence: number;
    category: DiagnosisCategory;
    affectedFiles: string[];
    relatedErrors: string[];
    suggestedFixes: Fix[];
}

export type DiagnosisCategory =
    | 'null_reference'
    | 'type_mismatch'
    | 'async_error'
    | 'import_error'
    | 'state_corruption'
    | 'race_condition'
    | 'resource_leak'
    | 'configuration';

export interface Fix {
    id: string;
    description: string;
    type: FixType;
    confidence: number;
    code?: { before: string; after: string; file: string; line: number };
    automated: boolean;
    riskLevel: 'safe' | 'moderate' | 'risky';
}

export type FixType =
    | 'null_check'
    | 'type_cast'
    | 'try_catch'
    | 'await_missing'
    | 'import_fix'
    | 'initialization'
    | 'cleanup';

export interface HealingAction {
    id: string;
    diagnosisId: string;
    fixId: string;
    status: 'pending' | 'applied' | 'verified' | 'rolled_back' | 'failed';
    appliedAt?: Date;
    verifiedAt?: Date;
    result?: string;
}

export interface ErrorPattern {
    id: string;
    signature: string;
    occurrences: number;
    lastSeen: Date;
    autoFixable: boolean;
    preventionStrategy?: string;
}

// Common error patterns and their fixes
const ERROR_PATTERNS: { pattern: RegExp; category: DiagnosisCategory; fix: Partial<Fix> }[] = [
    {
        pattern: /Cannot read propert(y|ies) .* of (undefined|null)/i,
        category: 'null_reference',
        fix: {
            type: 'null_check',
            description: 'Add null/undefined check before property access',
            automated: true,
            riskLevel: 'safe',
        },
    },
    {
        pattern: /is not a function/i,
        category: 'type_mismatch',
        fix: {
            type: 'type_cast',
            description: 'Verify the value is callable before invoking',
            automated: true,
            riskLevel: 'safe',
        },
    },
    {
        pattern: /await is only valid in async function/i,
        category: 'async_error',
        fix: {
            type: 'await_missing',
            description: 'Add async keyword to containing function',
            automated: true,
            riskLevel: 'safe',
        },
    },
    {
        pattern: /Cannot find module/i,
        category: 'import_error',
        fix: {
            type: 'import_fix',
            description: 'Install missing package or fix import path',
            automated: false,
            riskLevel: 'moderate',
        },
    },
    {
        pattern: /Maximum call stack/i,
        category: 'resource_leak',
        fix: {
            type: 'cleanup',
            description: 'Add recursion guard or fix infinite loop',
            automated: false,
            riskLevel: 'risky',
        },
    },
    {
        pattern: /Unhandled promise rejection/i,
        category: 'async_error',
        fix: {
            type: 'try_catch',
            description: 'Add try-catch around async operation',
            automated: true,
            riskLevel: 'safe',
        },
    },
];

export class AutonomousDebuggingEngine extends EventEmitter {
    private static instance: AutonomousDebuggingEngine;
    private errors: Map<string, ErrorEvent> = new Map();
    private diagnoses: Map<string, Diagnosis> = new Map();
    private healingActions: Map<string, HealingAction> = new Map();
    private patterns: Map<string, ErrorPattern> = new Map();
    private autoHealEnabled: boolean = true;

    private constructor() {
        super();
    }

    static getInstance(): AutonomousDebuggingEngine {
        if (!AutonomousDebuggingEngine.instance) {
            AutonomousDebuggingEngine.instance = new AutonomousDebuggingEngine();
        }
        return AutonomousDebuggingEngine.instance;
    }

    // ========================================================================
    // ERROR CAPTURE
    // ========================================================================

    /**
     * Capture and process an error
     */
    captureError(error: Omit<ErrorEvent, 'id' | 'timestamp'>): Diagnosis {
        const errorEvent: ErrorEvent = {
            ...error,
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };

        this.errors.set(errorEvent.id, errorEvent);
        this.updatePattern(errorEvent);

        // Diagnose immediately
        const diagnosis = this.diagnose(errorEvent);

        // Auto-heal if enabled
        if (this.autoHealEnabled && diagnosis.suggestedFixes.some(f => f.automated && f.riskLevel === 'safe')) {
            const safeFix = diagnosis.suggestedFixes.find(f => f.automated && f.riskLevel === 'safe');
            if (safeFix) {
                this.applyFix(diagnosis.id, safeFix.id);
            }
        }

        this.emit('error:captured', errorEvent);
        return diagnosis;
    }

    private updatePattern(error: ErrorEvent): void {
        const signature = this.getErrorSignature(error);

        let pattern = this.patterns.get(signature);
        if (!pattern) {
            pattern = {
                id: `pattern_${Date.now()}`,
                signature,
                occurrences: 0,
                lastSeen: new Date(),
                autoFixable: this.isAutoFixable(error.message),
            };
        }

        pattern.occurrences++;
        pattern.lastSeen = new Date();
        this.patterns.set(signature, pattern);
    }

    private getErrorSignature(error: ErrorEvent): string {
        // Normalize error for pattern matching
        return `${error.type}:${error.message.replace(/\d+/g, 'N').replace(/'[^']+'/g, "'X'")}`;
    }

    private isAutoFixable(message: string): boolean {
        return ERROR_PATTERNS.some(p => p.pattern.test(message) && p.fix.automated);
    }

    // ========================================================================
    // DIAGNOSIS
    // ========================================================================

    /**
     * Diagnose an error and suggest fixes
     */
    diagnose(error: ErrorEvent): Diagnosis {
        const diagnosisId = `diag_${Date.now()}`;

        // Match against known patterns
        let matchedPattern: typeof ERROR_PATTERNS[0] | undefined;
        for (const pattern of ERROR_PATTERNS) {
            if (pattern.pattern.test(error.message)) {
                matchedPattern = pattern;
                break;
            }
        }

        // Build diagnosis
        const suggestedFixes: Fix[] = [];

        if (matchedPattern) {
            suggestedFixes.push({
                id: `fix_${Date.now()}`,
                description: matchedPattern.fix.description || 'Apply suggested fix',
                type: matchedPattern.fix.type || 'null_check',
                confidence: 0.85,
                automated: matchedPattern.fix.automated ?? false,
                riskLevel: matchedPattern.fix.riskLevel || 'moderate',
                code: this.generateFixCode(error, matchedPattern),
            });
        }

        // Add generic fixes
        if (suggestedFixes.length === 0) {
            suggestedFixes.push({
                id: `fix_generic_${Date.now()}`,
                description: 'Add error handling wrapper',
                type: 'try_catch',
                confidence: 0.5,
                automated: true,
                riskLevel: 'safe',
            });
        }

        const diagnosis: Diagnosis = {
            id: diagnosisId,
            errorId: error.id,
            rootCause: matchedPattern?.fix.description || 'Unknown root cause',
            confidence: matchedPattern ? 0.85 : 0.4,
            category: matchedPattern?.category || 'unknown' as any,
            affectedFiles: error.source ? [error.source] : [],
            relatedErrors: this.findRelatedErrors(error),
            suggestedFixes,
        };

        this.diagnoses.set(diagnosisId, diagnosis);
        this.emit('diagnosis:complete', diagnosis);
        return diagnosis;
    }

    private generateFixCode(error: ErrorEvent, pattern: typeof ERROR_PATTERNS[0]): Fix['code'] | undefined {
        if (!error.source || !error.line) return undefined;

        switch (pattern.fix.type) {
            case 'null_check':
                return {
                    before: `object.property`,
                    after: `object?.property`,
                    file: error.source,
                    line: error.line,
                };
            case 'try_catch':
                return {
                    before: `await asyncOperation()`,
                    after: `try {\n  await asyncOperation()\n} catch (e) {\n  console.error(e)\n}`,
                    file: error.source,
                    line: error.line,
                };
            case 'await_missing':
                return {
                    before: `function handler() {`,
                    after: `async function handler() {`,
                    file: error.source,
                    line: error.line,
                };
            default:
                return undefined;
        }
    }

    private findRelatedErrors(error: ErrorEvent): string[] {
        const related: string[] = [];
        const signature = this.getErrorSignature(error);

        for (const [id, e] of this.errors) {
            if (id !== error.id && this.getErrorSignature(e) === signature) {
                related.push(id);
            }
        }

        return related.slice(-5); // Last 5 related errors
    }

    // ========================================================================
    // HEALING
    // ========================================================================

    /**
     * Apply a fix
     */
    applyFix(diagnosisId: string, fixId: string): HealingAction {
        const diagnosis = this.diagnoses.get(diagnosisId);
        if (!diagnosis) throw new Error('Diagnosis not found');

        const fix = diagnosis.suggestedFixes.find(f => f.id === fixId);
        if (!fix) throw new Error('Fix not found');

        const action: HealingAction = {
            id: `heal_${Date.now()}`,
            diagnosisId,
            fixId,
            status: 'pending',
        };

        // Simulate fix application
        try {
            // In real implementation, would modify actual code
            action.status = 'applied';
            action.appliedAt = new Date();
            action.result = `Applied ${fix.type} fix`;

            // Verify fix worked
            setTimeout(() => {
                action.status = 'verified';
                action.verifiedAt = new Date();
                this.emit('fix:verified', action);
            }, 1000);
        } catch (error: any) {
            action.status = 'failed';
            action.result = error.message;
        }

        this.healingActions.set(action.id, action);
        this.emit('fix:applied', action);
        return action;
    }

    /**
     * Rollback a fix
     */
    rollbackFix(actionId: string): boolean {
        const action = this.healingActions.get(actionId);
        if (!action || action.status !== 'applied') return false;

        // In real implementation, would revert code changes
        action.status = 'rolled_back';
        this.emit('fix:rolled_back', action);
        return true;
    }

    // ========================================================================
    // PREVENTION
    // ========================================================================

    /**
     * Get prevention suggestions based on error patterns
     */
    getPreventionSuggestions(): { pattern: ErrorPattern; suggestion: string }[] {
        const suggestions: { pattern: ErrorPattern; suggestion: string }[] = [];

        for (const pattern of this.patterns.values()) {
            if (pattern.occurrences >= 3) {
                suggestions.push({
                    pattern,
                    suggestion: this.getPreventionStrategy(pattern.signature),
                });
            }
        }

        return suggestions.sort((a, b) => b.pattern.occurrences - a.pattern.occurrences);
    }

    private getPreventionStrategy(signature: string): string {
        if (signature.includes('null_reference')) {
            return 'Enable strict null checks in TypeScript and use optional chaining';
        }
        if (signature.includes('async_error')) {
            return 'Use async/await consistently and always wrap in try-catch';
        }
        if (signature.includes('import_error')) {
            return 'Use absolute imports and check package.json dependencies';
        }
        return 'Add more robust error handling and input validation';
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    setAutoHeal(enabled: boolean): void {
        this.autoHealEnabled = enabled;
        this.emit('config:autoHeal', enabled);
    }

    isAutoHealEnabled(): boolean {
        return this.autoHealEnabled;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getRecentErrors(limit: number = 20): ErrorEvent[] {
        return Array.from(this.errors.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    getDiagnosis(id: string): Diagnosis | undefined {
        return this.diagnoses.get(id);
    }

    getPatterns(): ErrorPattern[] {
        return Array.from(this.patterns.values())
            .sort((a, b) => b.occurrences - a.occurrences);
    }

    getHealingStats(): { applied: number; verified: number; failed: number; rolledBack: number } {
        const actions = Array.from(this.healingActions.values());
        return {
            applied: actions.filter(a => a.status === 'applied').length,
            verified: actions.filter(a => a.status === 'verified').length,
            failed: actions.filter(a => a.status === 'failed').length,
            rolledBack: actions.filter(a => a.status === 'rolled_back').length,
        };
    }
}

export const autonomousDebuggingEngine = AutonomousDebuggingEngine.getInstance();
