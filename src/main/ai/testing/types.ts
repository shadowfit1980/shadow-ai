/**
 * Testing System Types
 */

export interface TestCase {
    name: string;
    description: string;
    code: string;
    assertions: string[];
    setup?: string;
    teardown?: string;
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

export enum TestFramework {
    Jest = 'jest',
    Mocha = 'mocha',
    Pytest = 'pytest',
    JUnit = 'junit',
    GoTest = 'go-test',
    RustTest = 'rust-test',
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

export interface TestGenerationOptions {
    framework?: TestFramework;
    includeEdgeCases: boolean;
    includeMocks: boolean;
    coverageTarget: number; // percentage
    generateFixtures: boolean;
    testStyle: 'unit' | 'integration' | 'both';
}

export interface SecurityIssue {
    id: string;
    type: VulnerabilityType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    file: string;
    line: number;
    column?: number;
    code: string;
    description: string;
    recommendation: string;
    cwe?: string; // Common Weakness Enumeration
    owasp?: string; // OWASP category
}

export enum VulnerabilityType {
    SQL_INJECTION = 'SQL_INJECTION',
    XSS = 'XSS',
    HARDCODED_SECRET = 'HARDCODED_SECRET',
    INSECURE_DEPENDENCY = 'INSECURE_DEPENDENCY',
    WEAK_CRYPTO = 'WEAK_CRYPTO',
    PATH_TRAVERSAL = 'PATH_TRAVERSAL',
    COMMAND_INJECTION = 'COMMAND_INJECTION',
    UNSAFE_DESERIALIZATION = 'UNSAFE_DESERIALIZATION',
    BROKEN_AUTH = 'BROKEN_AUTH',
    SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE',
}

export interface VulnerabilityReport {
    scannedFiles: number;
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    issues: SecurityIssue[];
    summary: string;
    scanDuration: number;
}

export interface DependencyVulnerability {
    package: string;
    version: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    cve?: string;
    description: string;
    fixedIn?: string;
    recommendation: string;
}
