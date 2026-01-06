/**
 * Code Archaeology System
 * Excavate and understand legacy code through AI analysis
 * Grok Recommendation: Code Archaeology
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface CodeArtifact {
    id: string;
    type: 'pattern' | 'convention' | 'architecture' | 'dependency' | 'legacy' | 'debt';
    name: string;
    description: string;
    location: CodeLocation[];
    age: string;
    significance: 'low' | 'medium' | 'high' | 'critical';
    era: string;
    relatedArtifacts: string[];
}

interface CodeLocation {
    file: string;
    startLine: number;
    endLine: number;
    snippet: string;
}

interface HistoricalLayer {
    id: string;
    era: string;
    dateRange: { start: Date; end: Date };
    authors: string[];
    technologies: string[];
    patterns: string[];
    artifacts: CodeArtifact[];
    complexity: number;
}

interface EvolutionTimeline {
    file: string;
    events: TimelineEvent[];
    currentState: CodeState;
    predictedFuture: string[];
}

interface TimelineEvent {
    timestamp: Date;
    type: 'creation' | 'major_refactor' | 'feature_add' | 'bug_fix' | 'deprecation' | 'removal';
    description: string;
    author: string;
    impact: number;
    linesChanged: number;
}

interface CodeState {
    complexity: number;
    maintainability: number;
    patterns: string[];
    dependencies: string[];
    techDebt: number;
}

interface ArchaeologyReport {
    summary: string;
    layers: HistoricalLayer[];
    keyFindings: string[];
    recommendations: string[];
    riskAreas: { location: string; risk: string; severity: string }[];
    preservationPlan: string[];
}

interface PatternFossil {
    name: string;
    era: string;
    description: string;
    modernEquivalent: string;
    migrationPath: string[];
    effort: 'low' | 'medium' | 'high';
}

export class CodeArchaeology extends EventEmitter {
    private static instance: CodeArchaeology;
    private artifacts: Map<string, CodeArtifact> = new Map();
    private layers: HistoricalLayer[] = [];
    private timelines: Map<string, EvolutionTimeline> = new Map();
    private patternFossils: Map<string, PatternFossil> = new Map();

    private constructor() {
        super();
        this.initializePatternFossils();
    }

    static getInstance(): CodeArchaeology {
        if (!CodeArchaeology.instance) {
            CodeArchaeology.instance = new CodeArchaeology();
        }
        return CodeArchaeology.instance;
    }

    private initializePatternFossils(): void {
        const fossils: PatternFossil[] = [
            {
                name: 'Callback Hell',
                era: 'Pre-ES6 (2009-2015)',
                description: 'Deeply nested callbacks for async operations',
                modernEquivalent: 'Async/Await with Promises',
                migrationPath: ['Convert callbacks to Promises', 'Add async/await', 'Add error handling'],
                effort: 'medium'
            },
            {
                name: 'jQuery DOM Manipulation',
                era: 'jQuery Era (2006-2015)',
                description: 'Direct DOM manipulation using jQuery',
                modernEquivalent: 'React/Vue/Angular Components',
                migrationPath: ['Identify DOM patterns', 'Create components', 'Migrate state management'],
                effort: 'high'
            },
            {
                name: 'var Declarations',
                era: 'ES5 (2009-2015)',
                description: 'Function-scoped variable declarations',
                modernEquivalent: 'const/let declarations',
                migrationPath: ['Replace var with let', 'Convert to const where possible', 'Fix scope issues'],
                effort: 'low'
            },
            {
                name: 'Prototype Inheritance',
                era: 'Classical JavaScript (1995-2015)',
                description: 'Using prototypes for OOP',
                modernEquivalent: 'ES6 Classes',
                migrationPath: ['Convert to class syntax', 'Add constructor', 'Update method syntax'],
                effort: 'medium'
            },
            {
                name: 'CommonJS Modules',
                era: 'Node.js Era (2009-2020)',
                description: 'require() and module.exports',
                modernEquivalent: 'ES Modules (import/export)',
                migrationPath: ['Convert to ESM syntax', 'Update package.json type', 'Fix path extensions'],
                effort: 'medium'
            },
            {
                name: 'MVC Pattern',
                era: 'Framework Era (2010-2015)',
                description: 'Model-View-Controller architecture',
                modernEquivalent: 'Component-based architecture',
                migrationPath: ['Identify view layer', 'Create components', 'Migrate state to hooks/stores'],
                effort: 'high'
            },
            {
                name: 'Global Variables',
                era: 'Ancient JavaScript',
                description: 'Variables attached to window/global object',
                modernEquivalent: 'Module-scoped exports',
                migrationPath: ['Find all globals', 'Create modules', 'Update references'],
                effort: 'medium'
            },
            {
                name: 'XMLHttpRequest',
                era: 'AJAX Era (2005-2015)',
                description: 'Legacy HTTP request API',
                modernEquivalent: 'Fetch API',
                migrationPath: ['Replace with fetch()', 'Add async/await', 'Update error handling'],
                effort: 'low'
            }
        ];

        fossils.forEach(f => this.patternFossils.set(f.name, f));
    }

    excavate(code: string, filePath: string): CodeArtifact[] {
        const discoveries: CodeArtifact[] = [];
        const lines = code.split('\n');

        // Detect legacy patterns
        const patterns = [
            { regex: /\bvar\s+\w+\s*=/g, name: 'var declarations', era: 'ES5', type: 'pattern' as const },
            { regex: /require\s*\(['"]/g, name: 'CommonJS imports', era: 'Node.js', type: 'pattern' as const },
            { regex: /\.prototype\./g, name: 'Prototype chain', era: 'Classical JS', type: 'pattern' as const },
            { regex: /\$\s*\(/g, name: 'jQuery usage', era: 'jQuery Era', type: 'dependency' as const },
            { regex: /XMLHttpRequest/g, name: 'XHR requests', era: 'AJAX Era', type: 'pattern' as const },
            { regex: /new Promise\s*\(\s*function/g, name: 'Callback promises', era: 'Pre-async/await', type: 'pattern' as const },
            { regex: /\.bind\s*\(\s*this\s*\)/g, name: 'Manual binding', era: 'Pre-arrow functions', type: 'pattern' as const },
            { regex: /angular\.(module|controller|directive)/g, name: 'AngularJS 1.x', era: 'Angular 1', type: 'legacy' as const },
            { regex: /React\.createClass/g, name: 'React createClass', era: 'Pre-React 16', type: 'legacy' as const },
            { regex: /componentWillMount|componentWillReceiveProps/g, name: 'Deprecated lifecycle', era: 'React legacy', type: 'debt' as const },
            { regex: /TODO|FIXME|HACK|XXX/g, name: 'Technical debt markers', era: 'Unknown', type: 'debt' as const },
            { regex: /eslint-disable|@ts-ignore|@ts-nocheck/g, name: 'Lint suppressions', era: 'Various', type: 'debt' as const }
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.regex.exec(code)) !== null) {
                const lineNumber = code.substring(0, match.index).split('\n').length;
                const lineContent = lines[lineNumber - 1] || '';

                const artifact: CodeArtifact = {
                    id: crypto.randomUUID(),
                    type: pattern.type,
                    name: pattern.name,
                    description: `Found ${pattern.name} from ${pattern.era}`,
                    location: [{
                        file: filePath,
                        startLine: lineNumber,
                        endLine: lineNumber,
                        snippet: lineContent.trim()
                    }],
                    age: pattern.era,
                    significance: this.calculateSignificance(pattern.name),
                    era: pattern.era,
                    relatedArtifacts: []
                };

                discoveries.push(artifact);
                this.artifacts.set(artifact.id, artifact);
            }
        }

        this.emit('excavationComplete', { file: filePath, artifacts: discoveries.length });
        return discoveries;
    }

    private calculateSignificance(patternName: string): CodeArtifact['significance'] {
        const highSignificance = ['jQuery usage', 'AngularJS 1.x', 'React createClass', 'Deprecated lifecycle'];
        const criticalSignificance = ['Technical debt markers', 'Lint suppressions'];

        if (criticalSignificance.includes(patternName)) return 'critical';
        if (highSignificance.includes(patternName)) return 'high';
        return 'medium';
    }

    analyzeEvolution(commits: { date: Date; author: string; message: string; linesChanged: number }[], filePath: string): EvolutionTimeline {
        const events: TimelineEvent[] = commits.map(commit => ({
            timestamp: commit.date,
            type: this.classifyCommit(commit.message),
            description: commit.message,
            author: commit.author,
            impact: this.calculateImpact(commit.message, commit.linesChanged),
            linesChanged: commit.linesChanged
        }));

        const timeline: EvolutionTimeline = {
            file: filePath,
            events: events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
            currentState: this.assessCurrentState(filePath),
            predictedFuture: this.predictFuture(events)
        };

        this.timelines.set(filePath, timeline);
        return timeline;
    }

    private classifyCommit(message: string): TimelineEvent['type'] {
        const lower = message.toLowerCase();
        if (/^(init|create|new|add.*file)/i.test(lower)) return 'creation';
        if (/refactor|rewrite|redesign/i.test(lower)) return 'major_refactor';
        if (/feat|feature|add|implement/i.test(lower)) return 'feature_add';
        if (/fix|bug|patch|resolve/i.test(lower)) return 'bug_fix';
        if (/deprecat/i.test(lower)) return 'deprecation';
        if (/remove|delete|drop/i.test(lower)) return 'removal';
        return 'feature_add';
    }

    private calculateImpact(message: string, linesChanged: number): number {
        let impact = linesChanged / 100; // Base on lines changed

        if (/breaking|major/i.test(message)) impact *= 2;
        if (/minor|small/i.test(message)) impact *= 0.5;

        return Math.min(10, Math.max(1, impact));
    }

    private assessCurrentState(filePath: string): CodeState {
        const artifacts = Array.from(this.artifacts.values()).filter(a =>
            a.location.some(l => l.file === filePath)
        );

        const debtCount = artifacts.filter(a => a.type === 'debt').length;
        const legacyCount = artifacts.filter(a => a.type === 'legacy').length;

        return {
            complexity: 50 + legacyCount * 5,
            maintainability: Math.max(0, 100 - debtCount * 10 - legacyCount * 5),
            patterns: artifacts.filter(a => a.type === 'pattern').map(a => a.name),
            dependencies: artifacts.filter(a => a.type === 'dependency').map(a => a.name),
            techDebt: debtCount + legacyCount * 2
        };
    }

    private predictFuture(events: TimelineEvent[]): string[] {
        const predictions: string[] = [];
        const recentEvents = events.slice(-10);

        const bugFixRatio = recentEvents.filter(e => e.type === 'bug_fix').length / recentEvents.length;
        if (bugFixRatio > 0.5) {
            predictions.push('High bug fix rate suggests need for refactoring');
        }

        const refactorEvents = recentEvents.filter(e => e.type === 'major_refactor');
        if (refactorEvents.length === 0 && events.length > 20) {
            predictions.push('No recent refactoring - technical debt may be accumulating');
        }

        const avgImpact = recentEvents.reduce((sum, e) => sum + e.impact, 0) / recentEvents.length;
        if (avgImpact > 5) {
            predictions.push('Large changes indicate active development phase');
        }

        return predictions;
    }

    generateReport(files: string[]): ArchaeologyReport {
        const allArtifacts = Array.from(this.artifacts.values())
            .filter(a => files.some(f => a.location.some(l => l.file === f)));

        const layers = this.groupByEra(allArtifacts);

        const keyFindings = this.extractKeyFindings(allArtifacts);
        const recommendations = this.generateRecommendations(allArtifacts);
        const riskAreas = this.identifyRiskAreas(allArtifacts);
        const preservationPlan = this.createPreservationPlan(allArtifacts);

        const report: ArchaeologyReport = {
            summary: `Excavated ${allArtifacts.length} artifacts across ${files.length} files spanning ${layers.length} historical eras`,
            layers,
            keyFindings,
            recommendations,
            riskAreas,
            preservationPlan
        };

        this.emit('reportGenerated', report);
        return report;
    }

    private groupByEra(artifacts: CodeArtifact[]): HistoricalLayer[] {
        const eraGroups = new Map<string, CodeArtifact[]>();

        for (const artifact of artifacts) {
            const era = artifact.era || 'Unknown';
            if (!eraGroups.has(era)) {
                eraGroups.set(era, []);
            }
            eraGroups.get(era)!.push(artifact);
        }

        return Array.from(eraGroups.entries()).map(([era, arts]) => ({
            id: crypto.randomUUID(),
            era,
            dateRange: { start: new Date('2010-01-01'), end: new Date() },
            authors: [],
            technologies: [...new Set(arts.map(a => a.name))],
            patterns: arts.filter(a => a.type === 'pattern').map(a => a.name),
            artifacts: arts,
            complexity: arts.length * 5
        }));
    }

    private extractKeyFindings(artifacts: CodeArtifact[]): string[] {
        const findings: string[] = [];

        const byType = new Map<string, number>();
        for (const a of artifacts) {
            byType.set(a.type, (byType.get(a.type) || 0) + 1);
        }

        for (const [type, count] of byType) {
            findings.push(`Found ${count} ${type} artifacts`);
        }

        const criticalArtifacts = artifacts.filter(a => a.significance === 'critical');
        if (criticalArtifacts.length > 0) {
            findings.push(`${criticalArtifacts.length} critical items requiring immediate attention`);
        }

        return findings;
    }

    private generateRecommendations(artifacts: CodeArtifact[]): string[] {
        const recommendations: string[] = [];

        const hasLegacy = artifacts.some(a => a.type === 'legacy');
        if (hasLegacy) {
            recommendations.push('Create migration plan for legacy patterns');
        }

        const hasDebt = artifacts.some(a => a.type === 'debt');
        if (hasDebt) {
            recommendations.push('Allocate sprint time for tech debt reduction');
        }

        const hasOldPatterns = artifacts.some(a => a.era.includes('ES5') || a.era.includes('Pre-'));
        if (hasOldPatterns) {
            recommendations.push('Modernize codebase to current JavaScript standards');
        }

        return recommendations;
    }

    private identifyRiskAreas(artifacts: CodeArtifact[]): ArchaeologyReport['riskAreas'] {
        return artifacts
            .filter(a => a.significance === 'critical' || a.significance === 'high')
            .map(a => ({
                location: a.location[0]?.file || 'unknown',
                risk: a.description,
                severity: a.significance
            }));
    }

    private createPreservationPlan(artifacts: CodeArtifact[]): string[] {
        const plan: string[] = [];

        plan.push('1. Document all legacy patterns before migration');
        plan.push('2. Create comprehensive test coverage');
        plan.push('3. Implement feature flags for gradual rollout');
        plan.push('4. Maintain backward compatibility during transition');

        const uniquePatterns = [...new Set(artifacts.map(a => a.name))];
        for (const pattern of uniquePatterns.slice(0, 5)) {
            const fossil = this.patternFossils.get(pattern);
            if (fossil) {
                plan.push(`5. Migrate ${pattern} to ${fossil.modernEquivalent}`);
            }
        }

        return plan;
    }

    getPatternFossil(name: string): PatternFossil | undefined {
        return this.patternFossils.get(name);
    }

    getAllFossils(): PatternFossil[] {
        return Array.from(this.patternFossils.values());
    }

    getArtifacts(): CodeArtifact[] {
        return Array.from(this.artifacts.values());
    }

    getTimeline(filePath: string): EvolutionTimeline | undefined {
        return this.timelines.get(filePath);
    }

    clearExcavation(): void {
        this.artifacts.clear();
        this.layers = [];
        this.timelines.clear();
    }
}

export const codeArchaeology = CodeArchaeology.getInstance();
