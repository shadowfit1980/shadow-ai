/**
 * 🎯 Intent Alignment Engine
 * 
 * TRUE understanding of user intent with:
 * - Intent validation and clarification
 * - Tradeoff explanation with data
 * - Skill-level adaptation
 * - Goal-driven architecture extraction
 * - Business context awareness
 * 
 * This makes Shadow AI a true engineering PARTNER, not just a tool.
 */

import { projectKnowledgeGraph } from '../knowledge/ProjectKnowledgeGraph';

// Intent Types
export type IntentCategory =
    | 'create'      // Build something new
    | 'modify'      // Change existing code
    | 'debug'       // Fix an issue
    | 'optimize'    // Improve performance
    | 'refactor'    // Restructure without changing behavior
    | 'document'    // Create documentation
    | 'deploy'      // Ship to production
    | 'analyze'     // Understand code/system
    | 'migrate'     // Move between technologies
    | 'secure'      // Add security measures
    | 'test'        // Create or run tests
    | 'collaborate' // Team work
    | 'learn';      // Educational inquiry

export interface UserIntent {
    id: string;
    rawInput: string;
    category: IntentCategory;
    confidence: number;

    // Extracted components
    action: string;
    target: string;
    context: string;
    constraints: string[];

    // Business alignment
    businessGoal?: string;
    kpis?: { name: string; target: string }[];
    stakeholders?: string[];

    // Technical details
    techStack?: string[];
    nonFunctionalRequirements?: {
        performance?: { latency?: string; throughput?: string };
        scalability?: { users?: string; growth?: string };
        security?: { level: string; compliance?: string[] };
        availability?: string;
    };

    // Clarifications needed
    ambiguities: Ambiguity[];
    assumptions: Assumption[];

    // Tradeoffs
    tradeoffs: Tradeoff[];
}

export interface Ambiguity {
    aspect: string;
    question: string;
    options: string[];
    defaultOption?: string;
    impact: 'low' | 'medium' | 'high';
}

export interface Assumption {
    assumption: string;
    reasoning: string;
    confidence: number;
    validationNeeded: boolean;
}

export interface Tradeoff {
    decision: string;
    optionA: { choice: string; pros: string[]; cons: string[] };
    optionB: { choice: string; pros: string[]; cons: string[] };
    recommendation: string;
    dataPoints?: { metric: string; optionA: number; optionB: number; unit: string }[];
}

export interface SkillProfile {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    domains: string[];
    preferredExplanationDepth: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
    learningGoals?: string[];
}

export interface AlignmentResult {
    intent: UserIntent;
    validationPassed: boolean;
    clarificationsRequired: boolean;
    suggestedQuestions: string[];
    readyToExecute: boolean;
    executionPlan?: string[];
    adaptedResponse?: string;
}

class IntentAlignmentEngine {
    private static instance: IntentAlignmentEngine;
    private userProfile: SkillProfile = {
        level: 'intermediate',
        domains: [],
        preferredExplanationDepth: 'standard'
    };
    private intentHistory: UserIntent[] = [];
    private learningData: Map<string, { successes: number; failures: number }> = new Map();

    private constructor() { }

    public static getInstance(): IntentAlignmentEngine {
        if (!IntentAlignmentEngine.instance) {
            IntentAlignmentEngine.instance = new IntentAlignmentEngine();
        }
        return IntentAlignmentEngine.instance;
    }

    // ==================== INTENT PARSING ====================

    /**
     * Parse user input into structured intent
     */
    public async parseIntent(input: string, projectId?: string): Promise<UserIntent> {
        const intent: UserIntent = {
            id: `intent-${Date.now()}`,
            rawInput: input,
            category: this.categorizeIntent(input),
            confidence: 0,
            action: '',
            target: '',
            context: '',
            constraints: [],
            ambiguities: [],
            assumptions: [],
            tradeoffs: []
        };

        // Extract action and target
        const extraction = this.extractComponents(input);
        intent.action = extraction.action;
        intent.target = extraction.target;
        intent.context = extraction.context;
        intent.constraints = extraction.constraints;

        // Extract technical requirements
        intent.techStack = this.extractTechStack(input);
        intent.nonFunctionalRequirements = this.extractNFRs(input);

        // Identify ambiguities
        intent.ambiguities = this.identifyAmbiguities(input, intent);

        // Make assumptions with reasoning
        intent.assumptions = this.makeAssumptions(input, intent, projectId);

        // Identify tradeoffs
        intent.tradeoffs = this.identifyTradeoffs(intent);

        // Calculate confidence
        intent.confidence = this.calculateConfidence(intent);

        // Store in history
        this.intentHistory.push(intent);

        return intent;
    }

    private categorizeIntent(input: string): IntentCategory {
        const patterns: { category: IntentCategory; keywords: string[] }[] = [
            { category: 'create', keywords: ['create', 'build', 'make', 'generate', 'new', 'add', 'implement'] },
            { category: 'modify', keywords: ['change', 'update', 'modify', 'edit', 'alter', 'adjust'] },
            { category: 'debug', keywords: ['fix', 'debug', 'solve', 'error', 'bug', 'issue', 'problem', 'broken'] },
            { category: 'optimize', keywords: ['optimize', 'improve', 'speed', 'faster', 'performance', 'efficient'] },
            { category: 'refactor', keywords: ['refactor', 'restructure', 'clean', 'reorganize', 'simplify'] },
            { category: 'document', keywords: ['document', 'docs', 'readme', 'explain', 'describe', 'comment'] },
            { category: 'deploy', keywords: ['deploy', 'ship', 'release', 'publish', 'launch', 'production'] },
            { category: 'analyze', keywords: ['analyze', 'understand', 'explain', 'review', 'audit', 'examine'] },
            { category: 'migrate', keywords: ['migrate', 'port', 'convert', 'upgrade', 'transition'] },
            { category: 'secure', keywords: ['secure', 'security', 'auth', 'protect', 'encrypt', 'vulnerability'] },
            { category: 'test', keywords: ['test', 'testing', 'spec', 'coverage', 'unit', 'integration', 'e2e'] },
            { category: 'collaborate', keywords: ['share', 'team', 'collaborate', 'review', 'together'] },
            { category: 'learn', keywords: ['how', 'what', 'why', 'explain', 'teach', 'learn', 'tutorial'] }
        ];

        const inputLower = input.toLowerCase();
        let bestMatch: IntentCategory = 'create';
        let maxScore = 0;

        for (const pattern of patterns) {
            const score = pattern.keywords.filter(k => inputLower.includes(k)).length;
            if (score > maxScore) {
                maxScore = score;
                bestMatch = pattern.category;
            }
        }

        return bestMatch;
    }

    private extractComponents(input: string): { action: string; target: string; context: string; constraints: string[] } {
        const inputLower = input.toLowerCase();

        // Extract action verb
        const actionVerbs = ['create', 'build', 'make', 'fix', 'add', 'remove', 'update', 'change',
            'implement', 'deploy', 'test', 'refactor', 'optimize', 'analyze', 'migrate'];
        let action = 'create';
        for (const verb of actionVerbs) {
            if (inputLower.includes(verb)) {
                action = verb;
                break;
            }
        }

        // Extract target - what is being acted upon
        const targetPatterns = [
            /(?:a|an|the)\s+(\w+(?:\s+\w+)?(?:\s+\w+)?)/i,
            /(?:for|with|using)\s+(\w+(?:\s+\w+)?)/i
        ];
        let target = '';
        for (const pattern of targetPatterns) {
            const match = input.match(pattern);
            if (match) {
                target = match[1];
                break;
            }
        }
        if (!target) {
            // Fallback: take significant nouns
            const words = input.split(/\s+/).filter(w => w.length > 3 && !actionVerbs.includes(w.toLowerCase()));
            target = words.slice(0, 3).join(' ');
        }

        // Extract context
        const contextPatterns = [
            /(?:for|because|since|to)\s+(.+?)(?:\.|$)/i,
            /(?:so that|in order to)\s+(.+?)(?:\.|$)/i
        ];
        let context = '';
        for (const pattern of contextPatterns) {
            const match = input.match(pattern);
            if (match) {
                context = match[1];
                break;
            }
        }

        // Extract constraints
        const constraints: string[] = [];
        const constraintPatterns = [
            /(?:must|should|need to)\s+(.+?)(?:\.|,|$)/gi,
            /(?:without|no|don't|avoid)\s+(.+?)(?:\.|,|$)/gi,
            /(?:within|under|max|maximum|limit)\s+(.+?)(?:\.|,|$)/gi
        ];
        for (const pattern of constraintPatterns) {
            let match;
            while ((match = pattern.exec(input)) !== null) {
                constraints.push(match[1].trim());
            }
        }

        return { action, target, context, constraints };
    }

    private extractTechStack(input: string): string[] {
        const technologies = [
            // Languages
            'javascript', 'typescript', 'python', 'java', 'kotlin', 'swift', 'go', 'rust', 'c#', 'ruby', 'php',
            // Frontend
            'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby', 'remix',
            // Backend
            'node', 'express', 'fastapi', 'django', 'flask', 'spring', 'rails', 'laravel',
            // Database
            'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'dynamodb', 'firebase', 'supabase',
            // Mobile
            'flutter', 'react native', 'swift ui', 'kotlin multiplatform',
            // Cloud
            'aws', 'gcp', 'azure', 'vercel', 'netlify', 'cloudflare',
            // DevOps
            'docker', 'kubernetes', 'terraform', 'jenkins', 'github actions'
        ];

        const inputLower = input.toLowerCase();
        return technologies.filter(tech => inputLower.includes(tech));
    }

    private extractNFRs(input: string): UserIntent['nonFunctionalRequirements'] {
        const nfrs: UserIntent['nonFunctionalRequirements'] = {};
        const inputLower = input.toLowerCase();

        // Performance
        const latencyMatch = input.match(/(\d+)\s*(?:ms|milliseconds?)/i);
        const throughputMatch = input.match(/(\d+)\s*(?:rps|requests?\s*per\s*second)/i);
        if (latencyMatch || throughputMatch) {
            nfrs.performance = {
                latency: latencyMatch ? `${latencyMatch[1]}ms` : undefined,
                throughput: throughputMatch ? `${throughputMatch[1]} rps` : undefined
            };
        }

        // Scalability
        const usersMatch = input.match(/(\d+[kmb]?)\s*(?:users?|concurrent)/i);
        if (usersMatch || inputLower.includes('scale') || inputLower.includes('growth')) {
            nfrs.scalability = {
                users: usersMatch ? usersMatch[1] : 'unspecified',
                growth: inputLower.includes('10x') ? '10x' : inputLower.includes('rapid') ? 'rapid' : 'moderate'
            };
        }

        // Security
        const compliance = [];
        if (inputLower.includes('hipaa')) compliance.push('HIPAA');
        if (inputLower.includes('gdpr')) compliance.push('GDPR');
        if (inputLower.includes('soc')) compliance.push('SOC2');
        if (inputLower.includes('pci')) compliance.push('PCI-DSS');

        if (compliance.length > 0 || inputLower.includes('secure') || inputLower.includes('enterprise')) {
            nfrs.security = {
                level: compliance.length > 0 ? 'enterprise' : 'standard',
                compliance
            };
        }

        // Availability
        const availabilityMatch = input.match(/(99\.9+%?|high\s*availability|ha)/i);
        if (availabilityMatch) {
            nfrs.availability = availabilityMatch[1] || '99.9%';
        }

        return Object.keys(nfrs).length > 0 ? nfrs : undefined;
    }

    // ==================== AMBIGUITY & ASSUMPTION HANDLING ====================

    private identifyAmbiguities(input: string, intent: UserIntent): Ambiguity[] {
        const ambiguities: Ambiguity[] = [];
        const inputLower = input.toLowerCase();

        // Check for unspecified tech stack on create/build
        if (['create', 'build'].includes(intent.category) && (!intent.techStack || intent.techStack.length === 0)) {
            ambiguities.push({
                aspect: 'technology',
                question: 'What technology stack would you like to use?',
                options: ['React + Node.js', 'Vue + Python', 'Next.js Full-Stack', 'Flutter Mobile', 'Let AI decide'],
                defaultOption: 'Let AI decide',
                impact: 'high'
            });
        }

        // Check for unspecified target platform
        if (inputLower.includes('app') && !inputLower.includes('web') && !inputLower.includes('mobile') && !inputLower.includes('desktop')) {
            ambiguities.push({
                aspect: 'platform',
                question: 'What platform should this app target?',
                options: ['Web', 'Mobile (iOS + Android)', 'Desktop', 'Cross-platform (all)'],
                defaultOption: 'Web',
                impact: 'high'
            });
        }

        // Check for unspecified database
        if (inputLower.includes('data') || inputLower.includes('store') || inputLower.includes('save')) {
            if (!intent.techStack?.some(t => ['postgresql', 'mysql', 'mongodb', 'firebase', 'supabase'].includes(t))) {
                ambiguities.push({
                    aspect: 'database',
                    question: 'What type of database do you prefer?',
                    options: ['PostgreSQL (relational)', 'MongoDB (document)', 'Firebase (real-time)', 'SQLite (local)', 'No preference'],
                    defaultOption: 'No preference',
                    impact: 'medium'
                });
            }
        }

        // Check for unspecified authentication
        if (inputLower.includes('user') || inputLower.includes('login') || inputLower.includes('auth')) {
            ambiguities.push({
                aspect: 'authentication',
                question: 'What authentication method do you need?',
                options: ['Email/Password', 'OAuth (Google, GitHub)', 'Magic Link', 'SSO/SAML', 'All of the above'],
                defaultOption: 'OAuth (Google, GitHub)',
                impact: 'medium'
            });
        }

        return ambiguities;
    }

    private makeAssumptions(input: string, intent: UserIntent, projectId?: string): Assumption[] {
        const assumptions: Assumption[] = [];
        const inputLower = input.toLowerCase();

        // Cross-reference with project history
        if (projectId) {
            const projectHistory = projectKnowledgeGraph.getDecisionHistory(projectId);

            // Check if we have prior tech stack decisions
            const techDecisions = projectHistory.filter(d =>
                d.decision.question.toLowerCase().includes('technology') ||
                d.decision.question.toLowerCase().includes('stack')
            );

            if (techDecisions.length > 0 && (!intent.techStack || intent.techStack.length === 0)) {
                const lastTech = techDecisions[techDecisions.length - 1];
                assumptions.push({
                    assumption: `Using ${lastTech.decision.answer} based on project history`,
                    reasoning: `You chose ${lastTech.decision.answer} for this project previously`,
                    confidence: 0.9,
                    validationNeeded: false
                });
            }
        }

        // Assume modern best practices
        if (intent.category === 'create') {
            assumptions.push({
                assumption: 'Using TypeScript for type safety',
                reasoning: 'TypeScript reduces bugs and improves maintainability',
                confidence: 0.85,
                validationNeeded: false
            });

            assumptions.push({
                assumption: 'Including basic testing setup',
                reasoning: 'Tests are essential for production code quality',
                confidence: 0.8,
                validationNeeded: false
            });
        }

        // Assume security requirements for certain domains
        if (inputLower.includes('payment') || inputLower.includes('financial') || inputLower.includes('health')) {
            assumptions.push({
                assumption: 'Implementing enterprise-grade security',
                reasoning: 'Sensitive data domains require strict security measures',
                confidence: 0.95,
                validationNeeded: true
            });
        }

        return assumptions;
    }

    // ==================== TRADEOFF ANALYSIS ====================

    private identifyTradeoffs(intent: UserIntent): Tradeoff[] {
        const tradeoffs: Tradeoff[] = [];

        // Speed vs Quality tradeoff
        if (intent.category === 'create') {
            tradeoffs.push({
                decision: 'Development approach',
                optionA: {
                    choice: 'Rapid Prototype',
                    pros: ['Faster time to market', 'Quick validation', 'Lower initial cost'],
                    cons: ['Technical debt', 'May need rewrite', 'Limited scalability']
                },
                optionB: {
                    choice: 'Production-Ready',
                    pros: ['Scalable from start', 'Lower long-term cost', 'Better architecture'],
                    cons: ['Longer development', 'Higher initial cost', 'Delayed feedback']
                },
                recommendation: 'Production-Ready for core features, Prototype for experimental features',
                dataPoints: [
                    { metric: 'Development Time', optionA: 2, optionB: 6, unit: 'weeks' },
                    { metric: 'Maintenance Cost', optionA: 800, optionB: 200, unit: '$/month' },
                    { metric: 'Bug Rate', optionA: 15, optionB: 3, unit: 'bugs/kloc' }
                ]
            });
        }

        // Monolith vs Microservices
        if (intent.nonFunctionalRequirements?.scalability) {
            tradeoffs.push({
                decision: 'Architecture style',
                optionA: {
                    choice: 'Monolith',
                    pros: ['Simpler deployment', 'Easier debugging', 'Lower ops overhead'],
                    cons: ['Scaling limitations', 'Tight coupling', 'Larger blast radius']
                },
                optionB: {
                    choice: 'Microservices',
                    pros: ['Independent scaling', 'Team autonomy', 'Technology flexibility'],
                    cons: ['Complex operations', 'Network latency', 'Data consistency challenges']
                },
                recommendation: 'Start monolith, extract services as needed',
                dataPoints: [
                    { metric: 'Initial Complexity', optionA: 2, optionB: 8, unit: 'scale 1-10' },
                    { metric: 'Scale Ceiling', optionA: 100000, optionB: 10000000, unit: 'users' },
                    { metric: 'Ops Team Size', optionA: 1, optionB: 3, unit: 'engineers' }
                ]
            });
        }

        // SQL vs NoSQL
        if (intent.ambiguities.some(a => a.aspect === 'database')) {
            tradeoffs.push({
                decision: 'Database type',
                optionA: {
                    choice: 'SQL (PostgreSQL)',
                    pros: ['ACID compliance', 'Complex queries', 'Data integrity'],
                    cons: ['Rigid schema', 'Horizontal scaling harder', 'Migration overhead']
                },
                optionB: {
                    choice: 'NoSQL (MongoDB)',
                    pros: ['Flexible schema', 'Easy horizontal scaling', 'Fast development'],
                    cons: ['No joins', 'Eventual consistency', 'Duplicate data']
                },
                recommendation: 'SQL for transactional data, NoSQL for logs/events',
                dataPoints: [
                    { metric: 'Write Performance', optionA: 10000, optionB: 50000, unit: 'ops/sec' },
                    { metric: 'Query Flexibility', optionA: 9, optionB: 5, unit: 'scale 1-10' },
                    { metric: 'Schema Changes', optionA: 2, optionB: 9, unit: 'ease 1-10' }
                ]
            });
        }

        return tradeoffs;
    }

    // ==================== VALIDATION & ALIGNMENT ====================

    /**
     * Validate intent and provide alignment result
     */
    public async alignIntent(intent: UserIntent): Promise<AlignmentResult> {
        const clarificationsRequired = intent.ambiguities.some(a => a.impact === 'high');
        const suggestedQuestions = intent.ambiguities
            .filter(a => a.impact === 'high' || a.impact === 'medium')
            .map(a => a.question);

        // Check if assumptions need validation
        const unvalidatedAssumptions = intent.assumptions.filter(a => a.validationNeeded && a.confidence < 0.9);
        if (unvalidatedAssumptions.length > 0) {
            suggestedQuestions.push(
                ...unvalidatedAssumptions.map(a => `Is it correct that: ${a.assumption}?`)
            );
        }

        const readyToExecute = !clarificationsRequired && intent.confidence > 0.7;

        // Generate execution plan if ready
        let executionPlan: string[] | undefined;
        if (readyToExecute) {
            executionPlan = this.generateExecutionPlan(intent);
        }

        // Adapt response based on user skill level
        const adaptedResponse = this.adaptResponseForSkillLevel(intent);

        return {
            intent,
            validationPassed: intent.confidence > 0.5,
            clarificationsRequired,
            suggestedQuestions,
            readyToExecute,
            executionPlan,
            adaptedResponse
        };
    }

    private calculateConfidence(intent: UserIntent): number {
        let confidence = 0.5; // Base confidence

        // Increase for clear action
        if (intent.action) confidence += 0.1;

        // Increase for clear target
        if (intent.target) confidence += 0.1;

        // Increase for specified tech stack
        if (intent.techStack && intent.techStack.length > 0) confidence += 0.1;

        // Decrease for ambiguities
        confidence -= intent.ambiguities.filter(a => a.impact === 'high').length * 0.1;
        confidence -= intent.ambiguities.filter(a => a.impact === 'medium').length * 0.05;

        // Increase for context from history
        if (intent.assumptions.some(a => a.confidence > 0.8)) confidence += 0.1;

        return Math.max(0, Math.min(1, confidence));
    }

    private generateExecutionPlan(intent: UserIntent): string[] {
        const plan: string[] = [];

        plan.push(`1. Analyze requirements for: ${intent.target}`);

        if (intent.category === 'create') {
            plan.push('2. Design system architecture');
            plan.push('3. Set up project structure');
            plan.push('4. Implement core features');
            plan.push('5. Add testing');
            plan.push('6. Security review');
            plan.push('7. Documentation');
        } else if (intent.category === 'debug') {
            plan.push('2. Reproduce the issue');
            plan.push('3. Identify root cause');
            plan.push('4. Implement fix');
            plan.push('5. Add regression test');
        } else if (intent.category === 'optimize') {
            plan.push('2. Profile current performance');
            plan.push('3. Identify bottlenecks');
            plan.push('4. Implement optimizations');
            plan.push('5. Benchmark improvements');
        } else if (intent.category === 'deploy') {
            plan.push('2. Run pre-deployment checks');
            plan.push('3. Build production bundle');
            plan.push('4. Deploy to staging');
            plan.push('5. Run smoke tests');
            plan.push('6. Deploy to production');
            plan.push('7. Monitor for 15 minutes');
        }

        return plan;
    }

    private adaptResponseForSkillLevel(intent: UserIntent): string {
        const { level, preferredExplanationDepth } = this.userProfile;

        if (level === 'beginner' || preferredExplanationDepth === 'comprehensive') {
            return `I'll help you ${intent.action} ${intent.target}. Let me explain what this involves:\n\n` +
                `This task falls under "${intent.category}" which means we'll ${this.explainCategory(intent.category)}.\n\n` +
                (intent.tradeoffs.length > 0 ?
                    `There are some important decisions to make:\n${intent.tradeoffs.map(t => `- ${t.decision}: ${t.recommendation}`).join('\n')}` : '');
        } else if (level === 'expert' || preferredExplanationDepth === 'minimal') {
            return `${intent.action} ${intent.target}. Confidence: ${(intent.confidence * 100).toFixed(0)}%. ` +
                `${intent.ambiguities.length} ambiguities, ${intent.tradeoffs.length} tradeoffs.`;
        }

        // Standard response for intermediate
        return `I'll ${intent.action} ${intent.target}. ` +
            (intent.ambiguities.length > 0 ?
                `I have ${intent.ambiguities.length} question(s) to clarify first.` :
                'Ready to proceed.');
    }

    private explainCategory(category: IntentCategory): string {
        const explanations: Record<IntentCategory, string> = {
            'create': 'build something new from scratch, setting up the foundation and core features',
            'modify': 'change existing code while preserving its current functionality where possible',
            'debug': 'find and fix the root cause of a problem, then add tests to prevent regression',
            'optimize': 'improve performance by profiling, identifying bottlenecks, and implementing faster solutions',
            'refactor': 'restructure code for better maintainability without changing what it does',
            'document': 'create clear explanations and references for code and systems',
            'deploy': 'prepare and ship code to production environments safely',
            'analyze': 'examine and understand how code or systems work',
            'migrate': 'move from one technology to another while preserving functionality',
            'secure': 'add security measures to protect against vulnerabilities',
            'test': 'create automated tests to verify code works correctly',
            'collaborate': 'work together with team members on shared code',
            'learn': 'understand concepts and best practices'
        };
        return explanations[category];
    }

    // ==================== PROFILE MANAGEMENT ====================

    public setUserProfile(profile: Partial<SkillProfile>): void {
        Object.assign(this.userProfile, profile);
    }

    public getUserProfile(): SkillProfile {
        return { ...this.userProfile };
    }

    public getIntentHistory(): UserIntent[] {
        return [...this.intentHistory];
    }
}

export const intentAlignmentEngine = IntentAlignmentEngine.getInstance();
export default intentAlignmentEngine;
