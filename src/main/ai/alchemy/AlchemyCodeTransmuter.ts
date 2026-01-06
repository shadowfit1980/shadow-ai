/**
 * Alchemy Code Transmuter
 * 
 * Transform legacy code into modern frameworks with migration path analysis.
 * Converts COBOL to Rust, jQuery to React, etc.
 */

import { EventEmitter } from 'events';

export interface TransmutationRequest {
    id: string;
    sourceCode: string;
    sourceLanguage: string;
    sourceFramework?: string;
    targetLanguage: string;
    targetFramework?: string;
    options: TransmutationOptions;
}

export interface TransmutationOptions {
    preserveLogic: boolean;
    modernizePatterns: boolean;
    addTypeAnnotations: boolean;
    splitIntoModules: boolean;
    generateTests: boolean;
    includeComments: boolean;
    migrationStrategy: 'big-bang' | 'strangler-fig' | 'parallel-run';
}

export interface TransmutationResult {
    id: string;
    success: boolean;
    outputCode: string;
    modules?: TransmutedModule[];
    migrationPlan: MigrationStep[];
    warnings: TransmutationWarning[];
    metrics: TransmutationMetrics;
}

export interface TransmutedModule {
    name: string;
    path: string;
    code: string;
    dependencies: string[];
    exports: string[];
}

export interface MigrationStep {
    order: number;
    title: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedHours: number;
    dependencies: string[];
    rollbackPlan: string;
}

export interface TransmutationWarning {
    severity: 'info' | 'warning' | 'error';
    code: string;
    message: string;
    location?: { start: number; end: number };
    suggestion?: string;
}

export interface TransmutationMetrics {
    linesOriginal: number;
    linesOutput: number;
    complexity: { before: number; after: number };
    patterns: { recognized: number; transformed: number };
    estimatedMigrationDays: number;
}

// Pattern recognition rules
const LEGACY_PATTERNS: Record<string, { pattern: RegExp; transform: (match: string[]) => string; name: string }[]> = {
    jquery: [
        {
            name: 'selector',
            pattern: /\$\(['"]([^'"]+)['"]\)/g,
            transform: (m) => `document.querySelector('${m[1]}')`,
        },
        {
            name: 'click_handler',
            pattern: /\$\(([^)]+)\)\.click\(function\s*\(\)\s*{([^}]+)}\)/g,
            transform: (m) => `${m[1]}.addEventListener('click', () => {${m[2]}})`,
        },
        {
            name: 'ajax',
            pattern: /\$\.ajax\({([^}]+)}\)/g,
            transform: (m) => `fetch(url, {\n  method: 'POST',\n  body: JSON.stringify(data)\n})`,
        },
        {
            name: 'ready',
            pattern: /\$\(document\)\.ready\(function\s*\(\)\s*{([^}]+)}\)/g,
            transform: (m) => `document.addEventListener('DOMContentLoaded', () => {${m[1]}})`,
        },
        {
            name: 'each',
            pattern: /\$\.each\(([^,]+),\s*function\s*\(([^)]+)\)\s*{([^}]+)}\)/g,
            transform: (m) => `${m[1]}.forEach((${m[2]}) => {${m[3]}})`,
        },
    ],
    cobol: [
        {
            name: 'perform',
            pattern: /PERFORM\s+(\w+)\s+UNTIL\s+(\w+)/gi,
            transform: (m) => `while (!${m[2]}) {\n  ${m[1]}();\n}`,
        },
        {
            name: 'move',
            pattern: /MOVE\s+(\S+)\s+TO\s+(\S+)/gi,
            transform: (m) => `${m[2]} = ${m[1]};`,
        },
        {
            name: 'if_then',
            pattern: /IF\s+(\S+)\s+=\s+(\S+)\s+THEN/gi,
            transform: (m) => `if (${m[1]} === ${m[2]}) {`,
        },
        {
            name: 'display',
            pattern: /DISPLAY\s+"([^"]+)"/gi,
            transform: (m) => `console.log("${m[1]}");`,
        },
    ],
    'class-components': [
        {
            name: 'class_to_function',
            pattern: /class\s+(\w+)\s+extends\s+React\.Component\s*{/g,
            transform: (m) => `const ${m[1]}: React.FC = () => {`,
        },
        {
            name: 'this_state',
            pattern: /this\.state\.(\w+)/g,
            transform: (m) => m[1],
        },
        {
            name: 'setState',
            pattern: /this\.setState\({([^}]+)}\)/g,
            transform: (m) => `set${m[1].split(':')[0].trim().charAt(0).toUpperCase() + m[1].split(':')[0].trim().slice(1)}(${m[1].split(':')[1]?.trim()})`,
        },
    ],
};

// Framework upgrade templates
const FRAMEWORK_UPGRADES: Record<string, { template: string; imports: string[] }> = {
    'jquery:react': {
        template: `import React, { useState, useEffect } from 'react';

const Component: React.FC = () => {
  {{STATE_HOOKS}}

  {{EFFECTS}}

  return (
    {{JSX}}
  );
};

export default Component;`,
        imports: ['react'],
    },
    'express:fastify': {
        template: `import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

{{ROUTES}}

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();`,
        imports: ['fastify'],
    },
};

export class AlchemyCodeTransmuter extends EventEmitter {
    private static instance: AlchemyCodeTransmuter;
    private transmutations: Map<string, TransmutationResult> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): AlchemyCodeTransmuter {
        if (!AlchemyCodeTransmuter.instance) {
            AlchemyCodeTransmuter.instance = new AlchemyCodeTransmuter();
        }
        return AlchemyCodeTransmuter.instance;
    }

    // ========================================================================
    // TRANSMUTATION
    // ========================================================================

    /**
     * Transmute code from legacy to modern
     */
    transmute(request: TransmutationRequest): TransmutationResult {
        const warnings: TransmutationWarning[] = [];
        let outputCode = request.sourceCode;
        let patternsRecognized = 0;
        let patternsTransformed = 0;

        // Get transformation rules
        const sourceKey = request.sourceFramework?.toLowerCase() || request.sourceLanguage.toLowerCase();
        const rules = LEGACY_PATTERNS[sourceKey] || [];

        // Apply transformations
        for (const rule of rules) {
            const matches = outputCode.match(rule.pattern);
            if (matches) {
                patternsRecognized += matches.length;

                outputCode = outputCode.replace(rule.pattern, (...args) => {
                    patternsTransformed++;
                    return rule.transform(args);
                });

                warnings.push({
                    severity: 'info',
                    code: `TRANSFORM_${rule.name.toUpperCase()}`,
                    message: `Transformed ${matches.length} ${rule.name} patterns`,
                });
            }
        }

        // Apply framework upgrade if specified
        const upgradeKey = `${request.sourceFramework}:${request.targetFramework}`.toLowerCase();
        if (FRAMEWORK_UPGRADES[upgradeKey]) {
            outputCode = this.applyFrameworkUpgrade(outputCode, upgradeKey, warnings);
        }

        // Generate migration plan
        const migrationPlan = this.generateMigrationPlan(request, patternsTransformed);

        // Add type annotations if requested
        if (request.options.addTypeAnnotations && request.targetLanguage === 'typescript') {
            outputCode = this.addTypeAnnotations(outputCode);
        }

        // Split into modules if requested
        let modules: TransmutedModule[] | undefined;
        if (request.options.splitIntoModules) {
            modules = this.splitIntoModules(outputCode, request.targetLanguage);
        }

        // Calculate metrics
        const metrics: TransmutationMetrics = {
            linesOriginal: request.sourceCode.split('\n').length,
            linesOutput: outputCode.split('\n').length,
            complexity: {
                before: this.calculateComplexity(request.sourceCode),
                after: this.calculateComplexity(outputCode),
            },
            patterns: { recognized: patternsRecognized, transformed: patternsTransformed },
            estimatedMigrationDays: Math.ceil(migrationPlan.reduce((sum, s) => sum + s.estimatedHours, 0) / 8),
        };

        const result: TransmutationResult = {
            id: request.id,
            success: patternsTransformed > 0 || warnings.length === 0,
            outputCode,
            modules,
            migrationPlan,
            warnings,
            metrics,
        };

        this.transmutations.set(request.id, result);
        this.emit('transmutation:complete', result);
        return result;
    }

    private applyFrameworkUpgrade(code: string, upgradeKey: string, warnings: TransmutationWarning[]): string {
        const upgrade = FRAMEWORK_UPGRADES[upgradeKey];
        if (!upgrade) return code;

        warnings.push({
            severity: 'info',
            code: 'FRAMEWORK_UPGRADE',
            message: `Applying ${upgradeKey} framework upgrade template`,
        });

        // Simplified upgrade - real implementation would parse and restructure
        let result = upgrade.template;
        result = result.replace('{{STATE_HOOKS}}', '// TODO: Add state hooks');
        result = result.replace('{{EFFECTS}}', '// TODO: Add effects');
        result = result.replace('{{JSX}}', '<div>{/* TODO: Convert to JSX */}</div>');
        result = result.replace('{{ROUTES}}', '// TODO: Define routes');

        return `// Original code requires manual review:\n/*\n${code}\n*/\n\n${result}`;
    }

    private addTypeAnnotations(code: string): string {
        let typed = code;

        // Add function parameter types
        typed = typed.replace(
            /function\s+(\w+)\s*\(([^)]*)\)/g,
            (match, name, params) => {
                if (params.trim() === '') return match;
                const typedParams = params
                    .split(',')
                    .map((p: string) => `${p.trim()}: any`)
                    .join(', ');
                return `function ${name}(${typedParams}): void`;
            }
        );

        // Add const types for literals
        typed = typed.replace(
            /const\s+(\w+)\s*=\s*(['"][^'"]+['"])/g,
            'const $1: string = $2'
        );

        typed = typed.replace(
            /const\s+(\w+)\s*=\s*(\d+)/g,
            'const $1: number = $2'
        );

        return typed;
    }

    private splitIntoModules(code: string, language: string): TransmutedModule[] {
        const modules: TransmutedModule[] = [];

        // Extract functions/classes as separate modules
        const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)[^{]+{[\s\S]*?^\}/gm;
        const classPattern = /(?:export\s+)?class\s+(\w+)[^{]+{[\s\S]*?^\}/gm;

        let match;

        // Extract functions
        const funcRegex = new RegExp(functionPattern);
        while ((match = funcRegex.exec(code)) !== null) {
            modules.push({
                name: match[1],
                path: `./${match[1]}.${language === 'typescript' ? 'ts' : 'js'}`,
                code: match[0],
                dependencies: [],
                exports: [match[1]],
            });
        }

        // Extract classes
        const classRegex = new RegExp(classPattern);
        while ((match = classRegex.exec(code)) !== null) {
            modules.push({
                name: match[1],
                path: `./${match[1]}.${language === 'typescript' ? 'ts' : 'js'}`,
                code: match[0],
                dependencies: [],
                exports: [match[1]],
            });
        }

        return modules;
    }

    private calculateComplexity(code: string): number {
        let complexity = 1;

        // Count decision points
        complexity += (code.match(/\bif\b/g) || []).length;
        complexity += (code.match(/\belse\b/g) || []).length;
        complexity += (code.match(/\bfor\b/g) || []).length;
        complexity += (code.match(/\bwhile\b/g) || []).length;
        complexity += (code.match(/\bswitch\b/g) || []).length;
        complexity += (code.match(/\bcase\b/g) || []).length;
        complexity += (code.match(/\bcatch\b/g) || []).length;
        complexity += (code.match(/\?\s*:/g) || []).length; // Ternary

        return complexity;
    }

    // ========================================================================
    // MIGRATION PLANNING
    // ========================================================================

    private generateMigrationPlan(request: TransmutationRequest, transformedPatterns: number): MigrationStep[] {
        const steps: MigrationStep[] = [];

        const strategy = request.options.migrationStrategy;

        if (strategy === 'big-bang') {
            steps.push({
                order: 1,
                title: 'Full Migration',
                description: `Convert all ${request.sourceLanguage} code to ${request.targetLanguage} in one release`,
                riskLevel: 'high',
                estimatedHours: transformedPatterns * 2 + 40,
                dependencies: [],
                rollbackPlan: 'Revert to previous codebase version',
            });
        } else if (strategy === 'strangler-fig') {
            steps.push(
                {
                    order: 1,
                    title: 'Setup Compatibility Layer',
                    description: 'Create adapter interfaces between old and new code',
                    riskLevel: 'low',
                    estimatedHours: 16,
                    dependencies: [],
                    rollbackPlan: 'Remove adapter layer',
                },
                {
                    order: 2,
                    title: 'Migrate Core Components',
                    description: 'Convert high-value, low-risk components first',
                    riskLevel: 'medium',
                    estimatedHours: transformedPatterns * 1.5 + 24,
                    dependencies: ['Setup Compatibility Layer'],
                    rollbackPlan: 'Disable new components, fall back to adapters',
                },
                {
                    order: 3,
                    title: 'Migrate Edge Cases',
                    description: 'Convert remaining components with special handling',
                    riskLevel: 'medium',
                    estimatedHours: 32,
                    dependencies: ['Migrate Core Components'],
                    rollbackPlan: 'Keep hybrid state longer',
                },
                {
                    order: 4,
                    title: 'Remove Legacy Code',
                    description: 'Clean up old implementation and adapters',
                    riskLevel: 'low',
                    estimatedHours: 8,
                    dependencies: ['Migrate Edge Cases'],
                    rollbackPlan: 'Restore from version control',
                }
            );
        } else { // parallel-run
            steps.push(
                {
                    order: 1,
                    title: 'Build New Implementation',
                    description: 'Create new codebase alongside existing',
                    riskLevel: 'low',
                    estimatedHours: transformedPatterns * 2 + 40,
                    dependencies: [],
                    rollbackPlan: 'Continue using old system',
                },
                {
                    order: 2,
                    title: 'Run in Shadow Mode',
                    description: 'Run both systems, compare outputs, fix discrepancies',
                    riskLevel: 'low',
                    estimatedHours: 40,
                    dependencies: ['Build New Implementation'],
                    rollbackPlan: 'Disable shadow mode',
                },
                {
                    order: 3,
                    title: 'Gradual Traffic Migration',
                    description: 'Route increasing percentage of traffic to new system',
                    riskLevel: 'medium',
                    estimatedHours: 24,
                    dependencies: ['Run in Shadow Mode'],
                    rollbackPlan: 'Route 100% back to old system',
                },
                {
                    order: 4,
                    title: 'Decommission Old System',
                    description: 'Shut down legacy codebase',
                    riskLevel: 'low',
                    estimatedHours: 8,
                    dependencies: ['Gradual Traffic Migration'],
                    rollbackPlan: 'Spin up old system from backup',
                }
            );
        }

        return steps;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSupportedTransformations(): { from: string; to: string[] }[] {
        return [
            { from: 'jQuery', to: ['Vanilla JS', 'React', 'Vue', 'Svelte'] },
            { from: 'COBOL', to: ['Java', 'TypeScript', 'Rust', 'Go'] },
            { from: 'React Class', to: ['React Hooks', 'Preact', 'Solid'] },
            { from: 'Express', to: ['Fastify', 'Koa', 'Hono'] },
            { from: 'JavaScript', to: ['TypeScript'] },
            { from: 'AngularJS', to: ['Angular', 'React', 'Vue'] },
        ];
    }

    getResult(id: string): TransmutationResult | undefined {
        return this.transmutations.get(id);
    }

    getAllResults(): TransmutationResult[] {
        return Array.from(this.transmutations.values());
    }
}

export const alchemyCodeTransmuter = AlchemyCodeTransmuter.getInstance();
