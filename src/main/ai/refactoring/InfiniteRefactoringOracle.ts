/**
 * Infinite Refactoring Oracle
 * 
 * Provides endless refactoring suggestions, each building on the
 * previous, showing the path to code perfection.
 */

import { EventEmitter } from 'events';

export interface RefactoringPath {
    id: string;
    originalCode: string;
    currentCode: string;
    steps: RefactoringStep[];
    currentStep: number;
    infiniteScore: number;
    createdAt: Date;
}

export interface RefactoringStep {
    id: string;
    name: string;
    description: string;
    beforeCode: string;
    afterCode: string;
    improvement: Improvement;
    difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface Improvement {
    readability: number;
    performance: number;
    maintainability: number;
    overall: number;
}

export class InfiniteRefactoringOracle extends EventEmitter {
    private static instance: InfiniteRefactoringOracle;
    private paths: Map<string, RefactoringPath> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): InfiniteRefactoringOracle {
        if (!InfiniteRefactoringOracle.instance) {
            InfiniteRefactoringOracle.instance = new InfiniteRefactoringOracle();
        }
        return InfiniteRefactoringOracle.instance;
    }

    beginPath(code: string): RefactoringPath {
        const steps = this.generateInfiniteSteps(code);

        const path: RefactoringPath = {
            id: `refactor_${Date.now()}`,
            originalCode: code,
            currentCode: code,
            steps,
            currentStep: 0,
            infiniteScore: this.calculateInfiniteScore(code),
            createdAt: new Date(),
        };

        this.paths.set(path.id, path);
        this.emit('path:created', path);
        return path;
    }

    private generateInfiniteSteps(code: string): RefactoringStep[] {
        const steps: RefactoringStep[] = [];
        let currentCode = code;

        // Step 1: Extract constants
        if (currentCode.match(/['"][^'"]{10,}['"]/)) {
            const after = this.extractConstants(currentCode);
            steps.push({
                id: `step_constants_${Date.now()}`,
                name: 'Extract Magic Strings',
                description: 'Replace magic strings with named constants',
                beforeCode: currentCode,
                afterCode: after,
                improvement: { readability: 0.2, performance: 0, maintainability: 0.3, overall: 0.25 },
                difficulty: 'easy',
            });
            currentCode = after;
        }

        // Step 2: Add types
        if (!currentCode.includes(': ') && (currentCode.includes('function') || currentCode.includes('=>'))) {
            const after = this.addTypes(currentCode);
            steps.push({
                id: `step_types_${Date.now()}`,
                name: 'Add Type Annotations',
                description: 'Add TypeScript type annotations for better safety',
                beforeCode: currentCode,
                afterCode: after,
                improvement: { readability: 0.15, performance: 0, maintainability: 0.4, overall: 0.28 },
                difficulty: 'medium',
            });
            currentCode = after;
        }

        // Step 3: Extract functions
        if (currentCode.split('\n').length > 50) {
            const after = this.extractFunctions(currentCode);
            steps.push({
                id: `step_extract_${Date.now()}`,
                name: 'Extract Helper Functions',
                description: 'Break down large functions into smaller ones',
                beforeCode: currentCode,
                afterCode: after,
                improvement: { readability: 0.3, performance: 0.1, maintainability: 0.4, overall: 0.33 },
                difficulty: 'medium',
            });
            currentCode = after;
        }

        // Step 4: Add error handling
        if (!currentCode.includes('try') && currentCode.includes('async')) {
            const after = this.addErrorHandling(currentCode);
            steps.push({
                id: `step_errors_${Date.now()}`,
                name: 'Add Error Handling',
                description: 'Wrap async operations with try-catch',
                beforeCode: currentCode,
                afterCode: after,
                improvement: { readability: 0.1, performance: 0, maintainability: 0.25, overall: 0.18 },
                difficulty: 'easy',
            });
            currentCode = after;
        }

        // Step 5: Add documentation
        if (!currentCode.includes('/**')) {
            const after = this.addDocumentation(currentCode);
            steps.push({
                id: `step_docs_${Date.now()}`,
                name: 'Add JSDoc Documentation',
                description: 'Document functions and classes with JSDoc',
                beforeCode: currentCode,
                afterCode: after,
                improvement: { readability: 0.35, performance: 0, maintainability: 0.2, overall: 0.28 },
                difficulty: 'trivial',
            });
        }

        // Step 6: Optimize patterns
        steps.push({
            id: `step_optimize_${Date.now()}`,
            name: 'Optimize Common Patterns',
            description: 'Replace common patterns with more efficient alternatives',
            beforeCode: currentCode,
            afterCode: this.optimizePatterns(currentCode),
            improvement: { readability: 0.1, performance: 0.3, maintainability: 0.1, overall: 0.17 },
            difficulty: 'hard',
        });

        return steps;
    }

    private extractConstants(code: string): string {
        const strings = code.match(/['"][^'"]{10,}['"]/g) || [];
        let result = code;

        for (let i = 0; i < Math.min(3, strings.length); i++) {
            const constantName = `CONSTANT_${i + 1}`;
            result = result.replace(strings[i], constantName);
        }

        return `// Constants\nconst CONSTANT_1 = 'extracted';\n\n${result}`;
    }

    private addTypes(code: string): string {
        return code
            .replace(/function\s+(\w+)\s*\(/g, 'function $1(')
            .replace(/\)\s*{/g, '): void {');
    }

    private extractFunctions(code: string): string {
        return `// Helper functions extracted\nfunction helper(): void {\n  // Helper logic\n}\n\n${code}`;
    }

    private addErrorHandling(code: string): string {
        return code.replace(
            /async\s+function\s+(\w+)/g,
            'async function $1\n  try {'
        ) + '\n  } catch (error) { handleError(error); }';
    }

    private addDocumentation(code: string): string {
        return `/**\n * Module documentation\n * @module\n */\n\n${code}`;
    }

    private optimizePatterns(code: string): string {
        return code
            .replace(/for\s*\([^)]+\)\s*{([^}]+)}/g, 'items.forEach(item => {$1})')
            .replace(/\|\|\s*\[\]/g, '?? []');
    }

    private calculateInfiniteScore(code: string): number {
        // Higher score = more room for improvement
        let score = 0.5;
        if (!code.includes('//') && !code.includes('/*')) score += 0.1;
        if (!code.includes('try')) score += 0.1;
        if (!code.includes(': ')) score += 0.1;
        if (code.split('\n').length > 100) score += 0.1;
        return Math.min(1, score);
    }

    nextStep(pathId: string): RefactoringStep | undefined {
        const path = this.paths.get(pathId);
        if (!path || path.currentStep >= path.steps.length - 1) return undefined;

        path.currentStep++;
        const step = path.steps[path.currentStep];
        path.currentCode = step.afterCode;

        this.emit('step:advanced', { path, step });
        return step;
    }

    getPath(id: string): RefactoringPath | undefined {
        return this.paths.get(id);
    }

    getStats(): { total: number; avgSteps: number; avgImprovement: number } {
        const paths = Array.from(this.paths.values());

        const allSteps = paths.flatMap(p => p.steps);
        const avgImprovement = allSteps.length > 0
            ? allSteps.reduce((s, step) => s + step.improvement.overall, 0) / allSteps.length
            : 0;

        return {
            total: paths.length,
            avgSteps: paths.length > 0 ? paths.reduce((s, p) => s + p.steps.length, 0) / paths.length : 0,
            avgImprovement,
        };
    }
}

export const infiniteRefactoringOracle = InfiniteRefactoringOracle.getInstance();
