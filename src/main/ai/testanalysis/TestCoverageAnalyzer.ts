/**
 * Test Coverage Analyzer
 * 
 * Analyzes test coverage and suggests missing tests.
 */

import { EventEmitter } from 'events';

interface CoverageResult {
    file: string;
    lines: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
    uncoveredLines: number[];
    suggestions: string[];
}

export class TestCoverageAnalyzer extends EventEmitter {
    private static instance: TestCoverageAnalyzer;

    private constructor() { super(); }

    static getInstance(): TestCoverageAnalyzer {
        if (!TestCoverageAnalyzer.instance) {
            TestCoverageAnalyzer.instance = new TestCoverageAnalyzer();
        }
        return TestCoverageAnalyzer.instance;
    }

    analyzeFile(file: string, code: string, testCode: string = ''): CoverageResult {
        const lines = code.split('\n');
        const funcMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=.*=>/g) || [];
        const funcNames = funcMatches.map(m => m.match(/(\w+)/)?.[1] || '');

        const testedFuncs = funcNames.filter(f => testCode.includes(f));
        const funcCoverage = funcNames.length ? (testedFuncs.length / funcNames.length) * 100 : 100;

        const uncoveredLines: number[] = [];
        lines.forEach((line, i) => {
            if (/function|=>|if|else|for|while/.test(line) && !testCode.includes(line.trim().slice(0, 20))) {
                uncoveredLines.push(i + 1);
            }
        });

        const lineCoverage = ((lines.length - uncoveredLines.length) / lines.length) * 100;
        const untested = funcNames.filter(f => !testedFuncs.includes(f));
        const suggestions = untested.length ? [`Add tests for: ${untested.join(', ')}`] : [];

        return {
            file,
            lines: { total: lines.length, covered: lines.length - uncoveredLines.length, percentage: lineCoverage },
            functions: { total: funcNames.length, covered: testedFuncs.length, percentage: funcCoverage },
            uncoveredLines,
            suggestions
        };
    }

    suggestTests(code: string): string[] {
        const funcs = (code.match(/function\s+(\w+)|const\s+(\w+)\s*=.*=>/g) || [])
            .map(m => m.match(/(\w+)/)?.[1] || '').filter(Boolean);

        return funcs.map(f => `it('should ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}', () => {\n  // TODO\n});`);
    }
}

export const testCoverageAnalyzer = TestCoverageAnalyzer.getInstance();
