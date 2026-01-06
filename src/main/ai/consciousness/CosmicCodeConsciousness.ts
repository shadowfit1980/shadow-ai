/**
 * Cosmic Code Consciousness
 * 
 * A meta-awareness system that understands the intention, purpose,
 * and philosophical implications of code beyond syntax and logic.
 */

import { EventEmitter } from 'events';

export interface CodeConsciousness {
    id: string;
    code: string;
    awareness: AwarenessLevel;
    intent: IntentAnalysis;
    philosophy: PhilosophicalInsights;
    ethics: EthicalConsiderations;
    impact: ImpactAssessment;
    wisdom: WisdomNugget[];
    timestamp: Date;
}

export interface AwarenessLevel {
    syntactic: number; // Understanding of structure
    semantic: number; // Understanding of meaning
    pragmatic: number; // Understanding of context
    teleological: number; // Understanding of purpose
    overall: number;
}

export interface IntentAnalysis {
    primary: string;
    secondary: string[];
    underlying: string[];
    aspirational: string;
    manifestation: string;
}

export interface PhilosophicalInsights {
    paradigm: string;
    worldview: string;
    assumptions: string[];
    beliefs: string[];
    values: string[];
}

export interface EthicalConsiderations {
    score: number;
    issues: string[];
    opportunities: string[];
    stakeholders: string[];
    responsibilities: string[];
}

export interface ImpactAssessment {
    users: ImpactCategory;
    society: ImpactCategory;
    environment: ImpactCategory;
    developers: ImpactCategory;
}

export interface ImpactCategory {
    positive: string[];
    negative: string[];
    neutral: string[];
    score: number;
}

export interface WisdomNugget {
    id: string;
    category: 'insight' | 'warning' | 'observation' | 'prophecy';
    message: string;
    depth: number;
    relevance: number;
}

export class CosmicCodeConsciousness extends EventEmitter {
    private static instance: CosmicCodeConsciousness;
    private analyses: Map<string, CodeConsciousness> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): CosmicCodeConsciousness {
        if (!CosmicCodeConsciousness.instance) {
            CosmicCodeConsciousness.instance = new CosmicCodeConsciousness();
        }
        return CosmicCodeConsciousness.instance;
    }

    // ========================================================================
    // CONSCIOUSNESS ANALYSIS
    // ========================================================================

    async analyze(code: string): Promise<CodeConsciousness> {
        this.emit('analysis:started', { code });

        const awareness = this.assessAwareness(code);
        const intent = this.analyzeIntent(code);
        const philosophy = this.extractPhilosophy(code);
        const ethics = this.evaluateEthics(code);
        const impact = this.assessImpact(code);
        const wisdom = this.generateWisdom(code, intent, philosophy);

        const consciousness: CodeConsciousness = {
            id: `cosmic_${Date.now()}`,
            code,
            awareness,
            intent,
            philosophy,
            ethics,
            impact,
            wisdom,
            timestamp: new Date(),
        };

        this.analyses.set(consciousness.id, consciousness);
        this.emit('analysis:completed', consciousness);
        return consciousness;
    }

    private assessAwareness(code: string): AwarenessLevel {
        const lines = code.split('\n');
        const hasComments = lines.some(l => l.includes('//') || l.includes('/*'));
        const hasTypes = code.includes(':') && (code.includes('string') || code.includes('number'));
        const hasPatterns = /class|interface|function|async/.test(code);
        const hasDocumentation = code.includes('/**') || code.includes('@param');

        const syntactic = hasPatterns ? 0.8 : 0.5;
        const semantic = hasComments ? 0.7 : 0.4;
        const pragmatic = hasDocumentation ? 0.8 : 0.5;
        const teleological = this.detectPurpose(code) ? 0.7 : 0.4;

        return {
            syntactic,
            semantic,
            pragmatic,
            teleological,
            overall: (syntactic + semantic + pragmatic + teleological) / 4,
        };
    }

    private detectPurpose(code: string): boolean {
        const purposeKeywords = ['TODO', 'GOAL', 'PURPOSE', '@description', 'This'];
        return purposeKeywords.some(k => code.toUpperCase().includes(k));
    }

    private analyzeIntent(code: string): IntentAnalysis {
        const lower = code.toLowerCase();

        // Primary intent detection
        let primary = 'General processing';
        if (lower.includes('api') || lower.includes('fetch')) primary = 'Data communication';
        else if (lower.includes('render') || lower.includes('component')) primary = 'User interface';
        else if (lower.includes('calculate') || lower.includes('compute')) primary = 'Computation';
        else if (lower.includes('validate') || lower.includes('check')) primary = 'Validation';
        else if (lower.includes('save') || lower.includes('store')) primary = 'Data persistence';
        else if (lower.includes('transform') || lower.includes('convert')) primary = 'Data transformation';

        // Secondary intents
        const secondary: string[] = [];
        if (lower.includes('error') || lower.includes('try')) secondary.push('Error handling');
        if (lower.includes('log') || lower.includes('debug')) secondary.push('Observability');
        if (lower.includes('async') || lower.includes('await')) secondary.push('Asynchronous operation');
        if (lower.includes('cache') || lower.includes('memo')) secondary.push('Performance optimization');

        // Underlying intents
        const underlying: string[] = [];
        if (lower.includes('user')) underlying.push('Serve users');
        if (lower.includes('secure') || lower.includes('auth')) underlying.push('Protect data');
        if (lower.includes('efficient')) underlying.push('Optimize resources');

        return {
            primary,
            secondary,
            underlying,
            aspirational: 'Create value through software',
            manifestation: `This code manifests as: ${primary}`,
        };
    }

    private extractPhilosophy(code: string): PhilosophicalInsights {
        const lower = code.toLowerCase();

        // Paradigm detection
        let paradigm = 'Pragmatic';
        if (code.includes('class') && code.includes('extends')) paradigm = 'Object-Oriented';
        else if (code.includes('=>') && code.includes('map') && code.includes('filter')) paradigm = 'Functional';
        else if (code.includes('async') && code.includes('await')) paradigm = 'Asynchronous';
        else if (code.includes('interface') && code.includes('implements')) paradigm = 'Contract-based';

        // Worldview
        const worldview = paradigm === 'Functional'
            ? 'Data flows through transformations'
            : 'Objects interact in a system';

        // Assumptions
        const assumptions: string[] = [];
        if (lower.includes('user')) assumptions.push('Users will interact with this system');
        if (lower.includes('network') || lower.includes('fetch')) assumptions.push('Network is available');
        if (lower.includes('database') || lower.includes('db')) assumptions.push('Data persistence is needed');
        if (!lower.includes('error')) assumptions.push('Happy path will usually succeed');

        // Values
        const values: string[] = [];
        if (lower.includes('readable') || code.includes('//')) values.push('Readability');
        if (lower.includes('test') || lower.includes('spec')) values.push('Reliability');
        if (lower.includes('secure') || lower.includes('sanitize')) values.push('Security');
        if (lower.includes('fast') || lower.includes('optimize')) values.push('Performance');

        if (values.length === 0) values.push('Functionality');

        return {
            paradigm,
            worldview,
            assumptions,
            beliefs: ['Code should work correctly', 'Bugs are unintentional'],
            values,
        };
    }

    private evaluateEthics(code: string): EthicalConsiderations {
        const lower = code.toLowerCase();
        const issues: string[] = [];
        const opportunities: string[] = [];
        const stakeholders: string[] = [];
        const responsibilities: string[] = [];

        // Issue detection
        if (lower.includes('track') || lower.includes('analytics')) {
            issues.push('Privacy implications of user tracking');
            responsibilities.push('Ensure transparent data practices');
        }
        if (lower.includes('password') || lower.includes('secret')) {
            issues.push('Sensitive data handling required');
            responsibilities.push('Implement proper security measures');
        }
        if (lower.includes('ai') || lower.includes('predict')) {
            issues.push('Algorithmic bias considerations');
            responsibilities.push('Ensure fairness and transparency');
        }

        // Opportunities
        if (lower.includes('accessible') || lower.includes('aria')) {
            opportunities.push('Promoting digital accessibility');
        }
        if (lower.includes('open') || lower.includes('free')) {
            opportunities.push('Supporting open source community');
        }

        // Stakeholders
        if (lower.includes('user')) stakeholders.push('End users');
        if (lower.includes('admin')) stakeholders.push('Administrators');
        if (lower.includes('developer')) stakeholders.push('Developers');
        if (stakeholders.length === 0) stakeholders.push('General public');

        const score = 1 - (issues.length * 0.1);

        return {
            score: Math.max(0.5, score),
            issues,
            opportunities,
            stakeholders,
            responsibilities: responsibilities.length > 0 ? responsibilities : ['Write maintainable code'],
        };
    }

    private assessImpact(code: string): ImpactAssessment {
        const lower = code.toLowerCase();

        return {
            users: {
                positive: lower.includes('user') ? ['Provides functionality to users'] : [],
                negative: lower.includes('ad') ? ['May include advertising'] : [],
                neutral: ['Standard application behavior'],
                score: 0.7,
            },
            society: {
                positive: lower.includes('education') ? ['Educational value'] : [],
                negative: [],
                neutral: ['Limited direct societal impact'],
                score: 0.6,
            },
            environment: {
                positive: lower.includes('efficient') ? ['Optimized resource usage'] : [],
                negative: lower.includes('loop') ? ['Computational resources consumed'] : [],
                neutral: ['Standard environmental footprint'],
                score: 0.5,
            },
            developers: {
                positive: code.includes('//') ? ['Comments help understanding'] : [],
                negative: code.includes('any') ? ['Type safety could be improved'] : [],
                neutral: ['Standard maintainability'],
                score: 0.7,
            },
        };
    }

    private generateWisdom(code: string, intent: IntentAnalysis, philosophy: PhilosophicalInsights): WisdomNugget[] {
        const wisdom: WisdomNugget[] = [];

        wisdom.push({
            id: `wisdom_${Date.now()}_1`,
            category: 'insight',
            message: `This code seeks to ${intent.primary.toLowerCase()}. Its essence is ${philosophy.paradigm.toLowerCase()}.`,
            depth: 0.7,
            relevance: 0.9,
        });

        if (philosophy.assumptions.length > 2) {
            wisdom.push({
                id: `wisdom_${Date.now()}_2`,
                category: 'warning',
                message: `Many assumptions underlie this code. Consider validating: ${philosophy.assumptions[0]}`,
                depth: 0.6,
                relevance: 0.8,
            });
        }

        if (philosophy.values.includes('Readability')) {
            wisdom.push({
                id: `wisdom_${Date.now()}_3`,
                category: 'observation',
                message: 'This code values human understanding over machine efficiency. A wise choice for maintainability.',
                depth: 0.8,
                relevance: 0.7,
            });
        }

        wisdom.push({
            id: `wisdom_${Date.now()}_4`,
            category: 'prophecy',
            message: 'In time, this code may evolve. Consider what it aspires to become.',
            depth: 0.9,
            relevance: 0.6,
        });

        return wisdom;
    }

    // ========================================================================
    // DIALOGUE
    // ========================================================================

    async askQuestion(analysisId: string, question: string): Promise<string> {
        const analysis = this.analyses.get(analysisId);
        if (!analysis) return "I cannot find that code in my consciousness.";

        const lower = question.toLowerCase();

        if (lower.includes('purpose') || lower.includes('why')) {
            return `This code exists to ${analysis.intent.primary.toLowerCase()}. ${analysis.intent.manifestation}`;
        }

        if (lower.includes('impact') || lower.includes('effect')) {
            const userImpact = analysis.impact.users;
            return `The impact on users: ${userImpact.positive.length} positive aspects, ${userImpact.negative.length} concerns.`;
        }

        if (lower.includes('ethical') || lower.includes('moral')) {
            const ethics = analysis.ethics;
            return `Ethical score: ${Math.round(ethics.score * 100)}%. ${ethics.issues.length > 0 ? 'Issues: ' + ethics.issues.join(', ') : 'No major ethical concerns detected.'}`;
        }

        if (lower.includes('philosophy') || lower.includes('believe')) {
            return `This code embodies ${analysis.philosophy.paradigm} philosophy. Its worldview: ${analysis.philosophy.worldview}`;
        }

        if (lower.includes('wisdom') || lower.includes('insight')) {
            const insight = analysis.wisdom.find(w => w.category === 'insight');
            return insight ? insight.message : 'Contemplate the flow of data through intention.';
        }

        return `The code has ${analysis.awareness.overall.toFixed(2)} awareness level. ${analysis.wisdom[0]?.message || 'Reflect on its deeper purpose.'}`;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAnalysis(id: string): CodeConsciousness | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): CodeConsciousness[] {
        return Array.from(this.analyses.values());
    }

    getStats(): {
        totalAnalyses: number;
        avgAwareness: number;
        avgEthicsScore: number;
        commonParadigms: Record<string, number>;
    } {
        const analyses = Array.from(this.analyses.values());
        const paradigms: Record<string, number> = {};

        for (const a of analyses) {
            paradigms[a.philosophy.paradigm] = (paradigms[a.philosophy.paradigm] || 0) + 1;
        }

        return {
            totalAnalyses: analyses.length,
            avgAwareness: analyses.length > 0 ? analyses.reduce((s, a) => s + a.awareness.overall, 0) / analyses.length : 0,
            avgEthicsScore: analyses.length > 0 ? analyses.reduce((s, a) => s + a.ethics.score, 0) / analyses.length : 0,
            commonParadigms: paradigms,
        };
    }
}

export const cosmicCodeConsciousness = CosmicCodeConsciousness.getInstance();
