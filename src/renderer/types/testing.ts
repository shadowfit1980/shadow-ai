/**
 * Frontend types for Testing Framework UI
 */

import { TestFramework } from '../../main/ai/testing/types';

export interface TestGenerationRequest {
    code?: string;
    filePath?: string;
    options: TestGenerationOptions;
}

export interface TestGenerationOptions {
    framework?: TestFramework;
    includeEdgeCases: boolean;
    includeMocks: boolean;
    coverageTarget: number;
    generateFixtures: boolean;
    testStyle: 'unit' | 'integration' | 'both';
}

export interface TestRunRequest {
    framework?: TestFramework;
    files?: string[];
    coverage: boolean;
}

export interface TestProgressEvent {
    stage: 'analyzing' | 'generating' | 'writing' | 'complete';
    progress: number;
    message: string;
}

export interface TestRunProgressEvent {
    status: 'running' | 'complete' | 'failed';
    message: string;
}

export interface CoverageData {
    overall: number;
    lines: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
    files: FileCoverage[];
    uncovered: UncoveredArea[];
    trend?: TrendPoint[];
}

export interface CoverageMetric {
    total: number;
    covered: number;
    percentage: number;
}

export interface FileCoverage {
    path: string;
    coverage: number;
    lines: {
        total: number;
        covered: number;
    };
    uncoveredLines: number[];
}

export interface UncoveredArea {
    file: string;
    type: 'function' | 'branch' | 'line';
    location: {
        line: number;
        column?: number;
    };
    name?: string;
    reason: string;
}

export interface TrendPoint {
    date: string;
    coverage: number;
}

export interface QualityAnalysis {
    quality: number; // 0-1 score
    suggestions: string[];
    metrics?: {
        totalTests: number;
        assertions: number;
        mocks: number;
        edgeCases: number;
    };
}

export interface TestSuite {
    name: string;
    framework: TestFramework;
    filePath: string;
    imports: string[];
    testCases: TestCase[];
    mocks?: MockDefinition[];
    fixtures?: FixtureDefinition[];
}

export interface TestCase {
    name: string;
    description: string;
    code: string;
    assertions: string[];
    setup?: string;
    teardown?: string;
}

export interface MockDefinition {
    name: string;
    type: string;
    implementation: string;
}

export interface FixtureDefinition {
    name: string;
    type: string;
    value: string;
}

export interface TestRunResult {
    framework: TestFramework;
    passed: number;
    failed: number;
    total: number;
    duration: number;
    coverage?: CoverageReport;
    output: string;
    success: boolean;
}

export interface CoverageReport {
    totalLines: number;
    coveredLines: number;
    totalFunctions: number;
    coveredFunctions: number;
    totalBranches: number;
    coveredBranches: number;
    percentage: number;
    uncoveredAreas: UncoveredArea[];
    suggestions: string[];
}

export { TestFramework };
