/**
 * Performance Profiler
 * Code performance analysis and optimization suggestions
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';

export interface ProfileResult {
    id: string;
    file: string;
    duration: number;
    metrics: PerformanceMetrics;
    hotspots: Hotspot[];
    suggestions: OptimizationSuggestion[];
}

export interface PerformanceMetrics {
    complexity: number;
    linesOfCode: number;
    functions: number;
    nestedLoops: number;
    asyncOperations: number;
    memoryAllocations: number;
}

export interface Hotspot {
    line: number;
    type: 'loop' | 'recursion' | 'io' | 'memory' | 'cpu';
    severity: 'low' | 'medium' | 'high';
    description: string;
    code: string;
}

export interface OptimizationSuggestion {
    target: string;
    line: number;
    type: 'algorithm' | 'caching' | 'async' | 'memory' | 'structure';
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
    code?: string;
}

/**
 * PerformanceProfiler
 * Analyze code for performance issues
 */
export class PerformanceProfiler extends EventEmitter {
    private static instance: PerformanceProfiler;
    private profiles: Map<string, ProfileResult> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): PerformanceProfiler {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }

    /**
     * Profile a file
     */
    async profileFile(filePath: string): Promise<ProfileResult> {
        const id = `profile_${Date.now()}`;
        const startTime = Date.now();

        this.emit('profilingStarted', { id, file: filePath });

        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        const metrics = this.calculateMetrics(content, lines);
        const hotspots = this.findHotspots(lines);
        const suggestions = this.generateSuggestions(lines, hotspots);

        const result: ProfileResult = {
            id,
            file: filePath,
            duration: Date.now() - startTime,
            metrics,
            hotspots,
            suggestions,
        };

        this.profiles.set(id, result);
        this.emit('profilingCompleted', result);

        return result;
    }

    /**
     * Calculate metrics
     */
    private calculateMetrics(content: string, lines: string[]): PerformanceMetrics {
        let complexity = 0;
        let functions = 0;
        let nestedLoops = 0;
        let asyncOperations = 0;
        let memoryAllocations = 0;
        let currentLoopDepth = 0;
        let maxLoopDepth = 0;

        for (const line of lines) {
            // Cyclomatic complexity
            if (/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bswitch\b|\bcase\b|\?\s*:/.test(line)) {
                complexity++;
            }

            // Functions
            if (/function\s+\w+|=>\s*{|=>\s*[^{]/.test(line)) {
                functions++;
            }

            // Loop detection
            if (/\bfor\b|\bwhile\b|\.forEach\(|\.map\(|\.filter\(/.test(line)) {
                currentLoopDepth++;
                maxLoopDepth = Math.max(maxLoopDepth, currentLoopDepth);
            }
            if (/^\s*}/.test(line) && currentLoopDepth > 0) {
                currentLoopDepth--;
            }

            // Async operations
            if (/\bawait\b|\bPromise\b|\.then\(|\basync\b/.test(line)) {
                asyncOperations++;
            }

            // Memory allocations
            if (/new\s+\w+|Array\(|Object\.|\.push\(|\.concat\(/.test(line)) {
                memoryAllocations++;
            }
        }

        nestedLoops = maxLoopDepth > 1 ? maxLoopDepth : 0;

        return {
            complexity,
            linesOfCode: lines.filter(l => l.trim().length > 0).length,
            functions,
            nestedLoops,
            asyncOperations,
            memoryAllocations,
        };
    }

    /**
     * Find performance hotspots
     */
    private findHotspots(lines: string[]): Hotspot[] {
        const hotspots: Hotspot[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Nested loops
            if (/\bfor\b.*for\b|\bwhile\b.*while\b/.test(lines.slice(Math.max(0, i - 5), i + 1).join(' '))) {
                hotspots.push({
                    line: lineNum,
                    type: 'loop',
                    severity: 'high',
                    description: 'Nested loop detected - O(n²) complexity',
                    code: line.trim(),
                });
            }

            // Recursion
            const funcMatch = line.match(/function\s+(\w+)/);
            if (funcMatch) {
                const funcName = funcMatch[1];
                const funcBody = lines.slice(i, Math.min(i + 50, lines.length)).join('\n');
                if (new RegExp(`\\b${funcName}\\s*\\(`).test(funcBody.slice(funcMatch[0].length))) {
                    hotspots.push({
                        line: lineNum,
                        type: 'recursion',
                        severity: 'medium',
                        description: 'Recursive function - ensure base case exists',
                        code: line.trim(),
                    });
                }
            }

            // Sync file operations
            if (/readFileSync|writeFileSync|readdirSync|statSync/.test(line)) {
                hotspots.push({
                    line: lineNum,
                    type: 'io',
                    severity: 'high',
                    description: 'Synchronous file I/O blocks event loop',
                    code: line.trim(),
                });
            }

            // Large array operations
            if (/\.sort\(|\.reverse\(|\.splice\(/.test(line)) {
                hotspots.push({
                    line: lineNum,
                    type: 'memory',
                    severity: 'low',
                    description: 'In-place array mutation may impact performance with large arrays',
                    code: line.trim(),
                });
            }

            // String concatenation in loop
            if (/\+=\s*['"`]/.test(line)) {
                const contextLines = lines.slice(Math.max(0, i - 5), i);
                if (contextLines.some(l => /\bfor\b|\bwhile\b/.test(l))) {
                    hotspots.push({
                        line: lineNum,
                        type: 'memory',
                        severity: 'medium',
                        description: 'String concatenation in loop - use array join instead',
                        code: line.trim(),
                    });
                }
            }

            // JSON parse/stringify
            if (/JSON\.parse|JSON\.stringify/.test(line)) {
                hotspots.push({
                    line: lineNum,
                    type: 'cpu',
                    severity: 'low',
                    description: 'JSON serialization can be expensive for large objects',
                    code: line.trim(),
                });
            }
        }

        return hotspots;
    }

    /**
     * Generate optimization suggestions
     */
    private generateSuggestions(lines: string[], hotspots: Hotspot[]): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        for (const hotspot of hotspots) {
            switch (hotspot.type) {
                case 'loop':
                    suggestions.push({
                        target: 'Nested Loop',
                        line: hotspot.line,
                        type: 'algorithm',
                        suggestion: 'Consider using a Map/Set for O(1) lookups instead of nested iteration',
                        impact: 'high',
                    });
                    break;

                case 'io':
                    suggestions.push({
                        target: 'File I/O',
                        line: hotspot.line,
                        type: 'async',
                        suggestion: 'Use async file operations: readFile, writeFile instead of sync versions',
                        impact: 'high',
                    });
                    break;

                case 'memory':
                    if (hotspot.description.includes('String concatenation')) {
                        suggestions.push({
                            target: 'String Building',
                            line: hotspot.line,
                            type: 'memory',
                            suggestion: 'Use array.push() and array.join("") for string building in loops',
                            impact: 'medium',
                        });
                    }
                    break;
            }
        }

        // Look for caching opportunities
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/\.find\(|\.filter\(|\.map\(/.test(line)) {
                const varMatch = line.match(/const\s+(\w+)/);
                if (varMatch) {
                    const varName = varMatch[1];
                    const usageCount = lines.filter(l => l.includes(varName)).length;
                    if (usageCount > 3) {
                        suggestions.push({
                            target: varName,
                            line: i + 1,
                            type: 'caching',
                            suggestion: `Consider memoizing '${varName}' if computed multiple times with same inputs`,
                            impact: 'medium',
                        });
                    }
                }
            }
        }

        return suggestions;
    }

    /**
     * Get profile
     */
    getProfile(id: string): ProfileResult | null {
        return this.profiles.get(id) || null;
    }

    /**
     * Get all profiles
     */
    getAllProfiles(): ProfileResult[] {
        return Array.from(this.profiles.values());
    }

    /**
     * Generate report
     */
    generateReport(result: ProfileResult): string {
        const lines = [
            `# Performance Report: ${result.file}`,
            '',
            '## Metrics',
            `- Complexity: ${result.metrics.complexity}`,
            `- Lines of Code: ${result.metrics.linesOfCode}`,
            `- Functions: ${result.metrics.functions}`,
            `- Nested Loops: ${result.metrics.nestedLoops}`,
            `- Async Operations: ${result.metrics.asyncOperations}`,
            '',
            '## Hotspots',
        ];

        for (const h of result.hotspots) {
            lines.push(`- Line ${h.line} [${h.severity}]: ${h.description}`);
        }

        lines.push('', '## Suggestions');
        for (const s of result.suggestions) {
            lines.push(`- Line ${s.line}: ${s.suggestion} (${s.impact} impact)`);
        }

        return lines.join('\n');
    }
}

// Singleton getter
export function getPerformanceProfiler(): PerformanceProfiler {
    return PerformanceProfiler.getInstance();
}
