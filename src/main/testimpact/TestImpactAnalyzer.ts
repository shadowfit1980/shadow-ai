/**
 * Test Impact Analyzer - Affected tests detection
 */
import { EventEmitter } from 'events';

export interface ImpactedTest { testFile: string; testName: string; affectedBy: string[]; priority: 'critical' | 'high' | 'medium' | 'low'; }
export interface ImpactAnalysis { changedFiles: string[]; impactedTests: ImpactedTest[]; estimatedTime: number; }

export class TestImpactAnalyzer extends EventEmitter {
    private static instance: TestImpactAnalyzer;
    private testDependencies: Map<string, string[]> = new Map();
    private constructor() { super(); }
    static getInstance(): TestImpactAnalyzer { if (!TestImpactAnalyzer.instance) TestImpactAnalyzer.instance = new TestImpactAnalyzer(); return TestImpactAnalyzer.instance; }

    registerDependency(testFile: string, sourceFiles: string[]): void { this.testDependencies.set(testFile, sourceFiles); }

    async analyze(changedFiles: string[]): Promise<ImpactAnalysis> {
        const impactedTests: ImpactedTest[] = [];
        this.testDependencies.forEach((sources, testFile) => {
            const affected = sources.filter(s => changedFiles.includes(s));
            if (affected.length > 0) {
                impactedTests.push({ testFile, testName: testFile.replace('.test.ts', ''), affectedBy: affected, priority: affected.length > 2 ? 'critical' : affected.length > 1 ? 'high' : 'medium' });
            }
        });
        const analysis: ImpactAnalysis = { changedFiles, impactedTests, estimatedTime: impactedTests.length * 100 };
        this.emit('analyzed', analysis);
        return analysis;
    }

    getTestDependencies(): Map<string, string[]> { return new Map(this.testDependencies); }
}
export function getTestImpactAnalyzer(): TestImpactAnalyzer { return TestImpactAnalyzer.getInstance(); }
