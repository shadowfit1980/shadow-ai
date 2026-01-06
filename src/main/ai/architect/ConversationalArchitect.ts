/**
 * 🏗️ ConversationalArchitect - True Autonomy Engine
 * 
 * Replaces slash commands with conversational project genesis:
 * - Infers intent from natural language
 * - Proposes architecture with tradeoff analysis
 * - Generates project scaffolds automatically
 * - Maintains Architecture Decision Records (ADRs)
 * 
 * From Queen 3 Max: "True autonomy means the agent infers intent,
 * asks clarifying questions, proposes architectures, and executes
 * multi-step workflows — all without typing / anything."
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectRequest {
    description: string;
    context?: string;
    constraints?: string[];
    preferences?: UserPreferences;
}

export interface UserPreferences {
    preferredStack?: string[];
    avoidTechnologies?: string[];
    teamSize?: 'solo' | 'small' | 'medium' | 'large';
    experience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    prioritize?: 'speed' | 'scalability' | 'performance' | 'maintainability';
}

export interface ArchitectureProposal {
    id: string;
    projectName: string;
    summary: string;
    stack: TechStack;
    structure: ProjectStructure;
    estimatedTime: string;
    estimatedCost: MonthlyEstimate;
    scalability: ScalabilityProfile;
    tradeoffs: Tradeoff[];
    alternatives: AlternativeStack[];
    adrs: ADR[];
    clarifyingQuestions?: ClarifyingQuestion[];
}

export interface TechStack {
    frontend?: Technology;
    backend?: Technology;
    database?: Technology;
    hosting?: Technology;
    mobile?: Technology;
    gameEngine?: Technology;
    cicd?: string;
    containerization?: string;
}

export interface Technology {
    name: string;
    version?: string;
    reason: string;
    alternatives: string[];
}

export interface ProjectStructure {
    type: 'monolith' | 'microservices' | 'monorepo' | 'modular';
    directories: DirectoryNode[];
    keyFiles: KeyFile[];
}

export interface DirectoryNode {
    name: string;
    purpose: string;
    children?: DirectoryNode[];
}

export interface KeyFile {
    path: string;
    purpose: string;
    template?: string;
}

export interface MonthlyEstimate {
    low: number;
    high: number;
    currency: string;
    breakdown: CostBreakdown[];
}

export interface CostBreakdown {
    service: string;
    estimatedCost: number;
    notes: string;
}

export interface ScalabilityProfile {
    currentCapacity: string;
    scalingStrategy: string;
    bottlenecks: string[];
    upgradeSteps: UpgradeStep[];
}

export interface UpgradeStep {
    trigger: string;
    action: string;
    estimatedCost: number;
}

export interface Tradeoff {
    aspect: string;
    choice: string;
    benefit: string;
    cost: string;
}

export interface AlternativeStack {
    name: string;
    stack: TechStack;
    pros: string[];
    cons: string[];
    bestFor: string;
}

export interface ADR {
    id: string;
    title: string;
    status: 'proposed' | 'accepted' | 'deprecated';
    context: string;
    decision: string;
    consequences: string[];
    date: Date;
}

export interface ClarifyingQuestion {
    id: string;
    question: string;
    options?: string[];
    impact: string;
    default?: string;
}

export interface ProjectScaffold {
    id: string;
    proposal: ArchitectureProposal;
    files: ScaffoldFile[];
    commands: ScaffoldCommand[];
    status: 'pending' | 'generating' | 'complete' | 'failed';
    generatedAt?: Date;
}

export interface ScaffoldFile {
    path: string;
    content: string;
    template?: string;
}

export interface ScaffoldCommand {
    command: string;
    description: string;
    order: number;
    optional: boolean;
}

// Tech stack knowledge base
const STACK_KNOWLEDGE: Record<string, any> = {
    // Frontend
    'react': { type: 'frontend', performance: 8, learning: 6, ecosystem: 10, mobile: 'react-native' },
    'vue': { type: 'frontend', performance: 8, learning: 8, ecosystem: 7, mobile: null },
    'svelte': { type: 'frontend', performance: 10, learning: 7, ecosystem: 5, mobile: null },
    'nextjs': { type: 'fullstack', performance: 9, learning: 7, ecosystem: 9, mobile: null },

    // Mobile
    'flutter': { type: 'mobile', performance: 9, learning: 7, platforms: ['ios', 'android', 'web', 'desktop'] },
    'react-native': { type: 'mobile', performance: 7, learning: 6, platforms: ['ios', 'android'] },
    'swift': { type: 'mobile', performance: 10, learning: 6, platforms: ['ios', 'macos'] },
    'kotlin': { type: 'mobile', performance: 10, learning: 7, platforms: ['android'] },

    // Backend
    'nodejs': { type: 'backend', performance: 7, scalability: 8, learning: 8 },
    'go': { type: 'backend', performance: 10, scalability: 10, learning: 5 },
    'rust': { type: 'backend', performance: 10, scalability: 10, learning: 3 },
    'python': { type: 'backend', performance: 5, scalability: 6, learning: 10 },

    // Game Engines
    'unity': { type: 'game', platforms: 'all', learning: 6, performance: 8, language: 'c#' },
    'unreal': { type: 'game', platforms: 'all', learning: 4, performance: 10, language: 'c++' },
    'godot': { type: 'game', platforms: 'all', learning: 8, performance: 7, language: 'gdscript' },

    // Databases
    'postgresql': { type: 'database', scalability: 9, features: 10, learning: 7 },
    'mongodb': { type: 'database', scalability: 8, features: 7, learning: 9 },
    'firebase': { type: 'baas', scalability: 7, features: 8, learning: 10 },
    'supabase': { type: 'baas', scalability: 8, features: 9, learning: 9 },
};

// ============================================================================
// CONVERSATIONAL ARCHITECT
// ============================================================================

export class ConversationalArchitect extends EventEmitter {
    private static instance: ConversationalArchitect;
    private proposals: Map<string, ArchitectureProposal> = new Map();
    private scaffolds: Map<string, ProjectScaffold> = new Map();
    private userHistory: Map<string, ProjectRequest[]> = new Map();
    private projectADRs: Map<string, ADR[]> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): ConversationalArchitect {
        if (!ConversationalArchitect.instance) {
            ConversationalArchitect.instance = new ConversationalArchitect();
        }
        return ConversationalArchitect.instance;
    }

    /**
     * Analyze a natural language project request
     */
    public async analyzeRequest(request: ProjectRequest): Promise<ArchitectureProposal> {
        console.log('🏗️ Analyzing project request...');
        this.emit('analysis:started', { description: request.description });

        // Extract intent from natural language
        const intent = this.extractIntent(request.description);

        // Generate clarifying questions if needed
        const clarifyingQuestions = this.generateClarifyingQuestions(intent, request);

        // Select optimal stack based on requirements
        const stack = this.selectStack(intent, request.preferences);

        // Generate architecture proposal
        const proposal = this.generateProposal(intent, stack, request, clarifyingQuestions);

        this.proposals.set(proposal.id, proposal);
        this.emit('analysis:complete', proposal);

        return proposal;
    }

    /**
     * Answer clarifying questions and refine proposal
     */
    public async refineProposal(
        proposalId: string,
        answers: Record<string, string>
    ): Promise<ArchitectureProposal> {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }

        // Apply answers to refine the proposal
        const refinedProposal = this.applyAnswers(proposal, answers);
        this.proposals.set(proposalId, refinedProposal);

        return refinedProposal;
    }

    /**
     * Accept proposal and generate project scaffold
     */
    public async generateScaffold(proposalId: string, outputPath: string): Promise<ProjectScaffold> {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }

        console.log(`🔨 Generating scaffold for ${proposal.projectName}...`);
        this.emit('scaffold:started', { proposalId });

        const scaffold: ProjectScaffold = {
            id: this.generateId(),
            proposal,
            files: [],
            commands: [],
            status: 'generating'
        };

        this.scaffolds.set(scaffold.id, scaffold);

        try {
            // Generate directory structure
            scaffold.files = await this.generateFiles(proposal, outputPath);

            // Generate setup commands
            scaffold.commands = this.generateCommands(proposal);

            // Write files to disk
            await this.writeScaffold(scaffold, outputPath);

            // Generate ADR documentation
            await this.writeADRs(proposal, outputPath);

            scaffold.status = 'complete';
            scaffold.generatedAt = new Date();

            this.emit('scaffold:complete', scaffold);
            console.log(`✅ Scaffold complete: ${scaffold.files.length} files generated`);

        } catch (error: any) {
            scaffold.status = 'failed';
            this.emit('scaffold:failed', { id: scaffold.id, error: error.message });
            throw error;
        }

        return scaffold;
    }

    /**
     * Get Architecture Decision Records for a project
     */
    public getADRs(projectId: string): ADR[] {
        return this.projectADRs.get(projectId) || [];
    }

    /**
     * Add a new ADR
     */
    public addADR(projectId: string, adr: Omit<ADR, 'id' | 'date'>): ADR {
        const fullADR: ADR = {
            ...adr,
            id: this.generateId(),
            date: new Date()
        };

        const existing = this.projectADRs.get(projectId) || [];
        existing.push(fullADR);
        this.projectADRs.set(projectId, existing);

        return fullADR;
    }

    /**
     * Get all proposals
     */
    public getProposals(): ArchitectureProposal[] {
        return Array.from(this.proposals.values());
    }

    /**
     * Compare two architecture approaches
     */
    public compareArchitectures(
        stack1: TechStack,
        stack2: TechStack,
        requirements: string[]
    ): { winner: string; analysis: string } {
        let score1 = 0;
        let score2 = 0;
        const analysis: string[] = [];

        // Compare based on requirements
        for (const req of requirements) {
            const lower = req.toLowerCase();

            if (lower.includes('performance')) {
                const perf1 = this.getStackPerformance(stack1);
                const perf2 = this.getStackPerformance(stack2);
                if (perf1 > perf2) score1 += 2; else score2 += 2;
                analysis.push(`Performance: Stack1 ${perf1}/10 vs Stack2 ${perf2}/10`);
            }

            if (lower.includes('scale') || lower.includes('scalability')) {
                const scale1 = this.getStackScalability(stack1);
                const scale2 = this.getStackScalability(stack2);
                if (scale1 > scale2) score1 += 2; else score2 += 2;
                analysis.push(`Scalability: Stack1 ${scale1}/10 vs Stack2 ${scale2}/10`);
            }

            if (lower.includes('learn') || lower.includes('easy')) {
                const learn1 = this.getStackLearnability(stack1);
                const learn2 = this.getStackLearnability(stack2);
                if (learn1 > learn2) score1 += 1; else score2 += 1;
            }
        }

        return {
            winner: score1 > score2 ? 'Stack 1' : score2 > score1 ? 'Stack 2' : 'Tie',
            analysis: analysis.join('\n')
        };
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private extractIntent(description: string): ProjectIntent {
        const lower = description.toLowerCase();

        const intent: ProjectIntent = {
            type: 'web',
            features: [],
            scale: 'small',
            complexity: 'medium',
            platforms: [],
            hasMultiplayer: false,
            hasAuth: false,
            hasPayments: false,
            hasRealtime: false,
            hasAI: false
        };

        // Detect project type
        if (lower.includes('game') || lower.includes('gameplay')) {
            intent.type = 'game';
            if (lower.includes('mobile')) intent.platforms.push('mobile');
            if (lower.includes('pc') || lower.includes('desktop')) intent.platforms.push('desktop');
            if (lower.includes('web')) intent.platforms.push('web');
        } else if (lower.includes('mobile app') || lower.includes('iphone') || lower.includes('android')) {
            intent.type = 'mobile';
            if (lower.includes('ios') || lower.includes('iphone')) intent.platforms.push('ios');
            if (lower.includes('android')) intent.platforms.push('android');
        } else if (lower.includes('desktop app') || lower.includes('mac app') || lower.includes('windows app')) {
            intent.type = 'desktop';
        } else if (lower.includes('api') || lower.includes('backend') || lower.includes('server')) {
            intent.type = 'backend';
        } else {
            intent.type = 'web';
        }

        // Detect features
        if (lower.includes('multiplayer') || lower.includes('real-time') || lower.includes('realtime')) {
            intent.hasRealtime = true;
            intent.hasMultiplayer = lower.includes('multiplayer');
        }
        if (lower.includes('login') || lower.includes('auth') || lower.includes('user')) {
            intent.hasAuth = true;
        }
        if (lower.includes('payment') || lower.includes('stripe') || lower.includes('monetiz')) {
            intent.hasPayments = true;
        }
        if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning')) {
            intent.hasAI = true;
        }

        // Detect scale
        if (lower.includes('large') || lower.includes('enterprise') || lower.includes('million')) {
            intent.scale = 'large';
        } else if (lower.includes('startup') || lower.includes('mvp') || lower.includes('prototype')) {
            intent.scale = 'small';
        }

        // Extract mentioned technologies
        for (const [tech] of Object.entries(STACK_KNOWLEDGE)) {
            if (lower.includes(tech)) {
                intent.features.push(tech);
            }
        }

        return intent;
    }

    private generateClarifyingQuestions(intent: ProjectIntent, request: ProjectRequest): ClarifyingQuestion[] {
        const questions: ClarifyingQuestion[] = [];

        if (intent.type === 'mobile' && intent.platforms.length === 0) {
            questions.push({
                id: 'platforms',
                question: 'Which mobile platforms should this target?',
                options: ['iOS only', 'Android only', 'Both iOS and Android'],
                impact: 'Determines if we use native or cross-platform framework',
                default: 'Both iOS and Android'
            });
        }

        if (intent.type === 'game' && !intent.features.includes('unity') && !intent.features.includes('godot')) {
            questions.push({
                id: 'gameEngine',
                question: 'Do you have a preferred game engine?',
                options: ['Unity (C#)', 'Godot (GDScript)', 'Unreal (C++)', 'No preference'],
                impact: 'Determines development speed and platform support',
                default: 'No preference'
            });
        }

        if (intent.hasAuth && !request.preferences?.preferredStack) {
            questions.push({
                id: 'authProvider',
                question: 'How should users authenticate?',
                options: ['Email/Password', 'Social login (Google/Apple)', 'Both', 'SSO/Enterprise'],
                impact: 'Affects backend complexity and third-party integrations',
                default: 'Both'
            });
        }

        if (intent.scale === 'large') {
            questions.push({
                id: 'budget',
                question: 'What\'s your monthly infrastructure budget?',
                options: ['$0-100', '$100-500', '$500-2000', '$2000+'],
                impact: 'Determines hosting strategy and managed service usage',
                default: '$100-500'
            });
        }

        return questions;
    }

    private selectStack(intent: ProjectIntent, preferences?: UserPreferences): TechStack {
        const stack: TechStack = {};

        switch (intent.type) {
            case 'game':
                if (intent.features.includes('unity')) {
                    stack.gameEngine = { name: 'Unity', reason: 'Explicitly requested', alternatives: ['Godot', 'Unreal'] };
                } else if (intent.features.includes('godot')) {
                    stack.gameEngine = { name: 'Godot', reason: 'Explicitly requested', alternatives: ['Unity', 'Unreal'] };
                } else {
                    stack.gameEngine = {
                        name: 'Godot',
                        reason: 'Open source, fast iteration, GDScript is beginner-friendly',
                        alternatives: ['Unity', 'Unreal']
                    };
                }
                if (intent.hasMultiplayer) {
                    stack.backend = { name: 'Node.js + Socket.IO', reason: 'Real-time game server', alternatives: ['Photon', 'Mirror'] };
                }
                break;

            case 'mobile':
                if (intent.platforms.length > 1 || intent.platforms.length === 0) {
                    stack.mobile = {
                        name: 'Flutter',
                        reason: 'Cross-platform with native performance, single codebase',
                        alternatives: ['React Native', 'Native (Swift + Kotlin)']
                    };
                } else if (intent.platforms.includes('ios')) {
                    stack.mobile = { name: 'Swift + SwiftUI', reason: 'Native iOS development', alternatives: ['Flutter', 'React Native'] };
                } else {
                    stack.mobile = { name: 'Kotlin + Jetpack Compose', reason: 'Native Android development', alternatives: ['Flutter', 'React Native'] };
                }
                break;

            case 'web':
            case 'fullstack':
                stack.frontend = {
                    name: 'Next.js',
                    reason: 'Full-stack React with SSR, API routes, great DX',
                    alternatives: ['Remix', 'SvelteKit', 'Nuxt']
                };
                stack.database = {
                    name: 'Supabase',
                    reason: 'PostgreSQL with auth, realtime, and storage built-in',
                    alternatives: ['Firebase', 'PlanetScale + Auth0']
                };
                stack.hosting = { name: 'Vercel', reason: 'Optimal for Next.js', alternatives: ['Netlify', 'AWS Amplify'] };
                break;

            case 'backend':
                stack.backend = {
                    name: preferences?.prioritize === 'performance' ? 'Go' : 'Node.js',
                    reason: preferences?.prioritize === 'performance' ? 'Maximum performance and concurrency' : 'Fast development, huge ecosystem',
                    alternatives: ['Python', 'Rust', 'Go']
                };
                stack.database = { name: 'PostgreSQL', reason: 'Most versatile relational DB', alternatives: ['MySQL', 'MongoDB'] };
                break;
        }

        // Add real-time capabilities if needed
        if (intent.hasRealtime && !stack.backend) {
            stack.backend = { name: 'Socket.IO', reason: 'WebSocket support for real-time features', alternatives: ['Pusher', 'Ably'] };
        }

        // Add CI/CD
        stack.cicd = 'GitHub Actions';
        stack.containerization = 'Docker';

        return stack;
    }

    private generateProposal(
        intent: ProjectIntent,
        stack: TechStack,
        request: ProjectRequest,
        clarifyingQuestions: ClarifyingQuestion[]
    ): ArchitectureProposal {
        const projectName = this.extractProjectName(request.description);

        // Generate tradeoffs
        const tradeoffs: Tradeoff[] = [];
        if (stack.frontend?.name === 'Next.js') {
            tradeoffs.push({
                aspect: 'Framework',
                choice: 'Next.js over plain React',
                benefit: 'Built-in SSR, API routes, file-based routing',
                cost: 'Slightly more complex, Vercel-optimized'
            });
        }

        // Generate cost estimate
        const estimatedCost: MonthlyEstimate = {
            low: intent.scale === 'small' ? 0 : 50,
            high: intent.scale === 'large' ? 500 : 100,
            currency: 'USD',
            breakdown: [
                { service: 'Hosting', estimatedCost: intent.scale === 'small' ? 0 : 20, notes: 'Free tier available' },
                { service: 'Database', estimatedCost: intent.scale === 'small' ? 0 : 25, notes: 'Supabase free tier' },
                { service: 'CDN/Storage', estimatedCost: intent.scale === 'small' ? 0 : 10, notes: 'Included in hosting' }
            ]
        };

        // Generate alternatives
        const alternatives: AlternativeStack[] = [
            {
                name: 'Traditional MERN',
                stack: { frontend: { name: 'React', reason: 'Popular', alternatives: [] }, backend: { name: 'Express.js', reason: 'Simple', alternatives: [] }, database: { name: 'MongoDB', reason: 'NoSQL flexibility', alternatives: [] } },
                pros: ['Large community', 'Flexible', 'Lots of tutorials'],
                cons: ['More boilerplate', 'No SSR by default', 'Separate backend needed'],
                bestFor: 'Teams familiar with MERN stack'
            }
        ];

        // Generate ADRs
        const adrs: ADR[] = [];
        if (stack.frontend) {
            adrs.push({
                id: this.generateId(),
                title: `Use ${stack.frontend.name} for Frontend`,
                status: 'proposed',
                context: `Building a ${intent.type} application requiring modern UI`,
                decision: `We will use ${stack.frontend.name} because: ${stack.frontend.reason}`,
                consequences: [`Team must learn ${stack.frontend.name}`, 'Fast development with component model'],
                date: new Date()
            });
        }

        return {
            id: this.generateId(),
            projectName,
            summary: this.generateSummary(intent, stack),
            stack,
            structure: this.generateStructure(intent, stack),
            estimatedTime: this.estimateTime(intent),
            estimatedCost,
            scalability: this.generateScalabilityProfile(intent, stack),
            tradeoffs,
            alternatives,
            adrs,
            clarifyingQuestions
        };
    }

    private generateStructure(intent: ProjectIntent, stack: TechStack): ProjectStructure {
        const directories: DirectoryNode[] = [];
        const keyFiles: KeyFile[] = [];

        if (intent.type === 'web' || intent.type === 'fullstack') {
            directories.push(
                {
                    name: 'src', purpose: 'Source code', children: [
                        { name: 'app', purpose: 'Next.js app router pages' },
                        { name: 'components', purpose: 'Reusable UI components' },
                        { name: 'lib', purpose: 'Utilities and helpers' },
                        { name: 'hooks', purpose: 'Custom React hooks' }
                    ]
                },
                { name: 'public', purpose: 'Static assets' },
                { name: 'prisma', purpose: 'Database schema and migrations' }
            );
            keyFiles.push(
                { path: 'package.json', purpose: 'Dependencies and scripts' },
                { path: 'next.config.js', purpose: 'Next.js configuration' },
                { path: '.env.local', purpose: 'Environment variables' }
            );
        } else if (intent.type === 'mobile') {
            directories.push(
                {
                    name: 'lib', purpose: 'Main application code', children: [
                        { name: 'screens', purpose: 'App screens/pages' },
                        { name: 'widgets', purpose: 'Reusable widgets' },
                        { name: 'services', purpose: 'API and backend services' },
                        { name: 'models', purpose: 'Data models' }
                    ]
                },
                { name: 'assets', purpose: 'Images, fonts, etc.' },
                { name: 'test', purpose: 'Unit and widget tests' }
            );
        }

        return {
            type: intent.scale === 'large' ? 'monorepo' : 'monolith',
            directories,
            keyFiles
        };
    }

    private async generateFiles(proposal: ArchitectureProposal, outputPath: string): Promise<ScaffoldFile[]> {
        const files: ScaffoldFile[] = [];

        // README.md
        files.push({
            path: 'README.md',
            content: this.generateReadme(proposal)
        });

        // Package.json for Node projects
        if (proposal.stack.frontend || proposal.stack.backend) {
            files.push({
                path: 'package.json',
                content: this.generatePackageJson(proposal)
            });
        }

        // .env.example
        files.push({
            path: '.env.example',
            content: this.generateEnvExample(proposal)
        });

        // .gitignore
        files.push({
            path: '.gitignore',
            content: this.generateGitignore(proposal)
        });

        // ADR documentation
        files.push({
            path: 'docs/adr/README.md',
            content: '# Architecture Decision Records\n\nThis directory contains the Architecture Decision Records (ADRs) for this project.\n'
        });

        for (const adr of proposal.adrs) {
            files.push({
                path: `docs/adr/${adr.id}.md`,
                content: this.formatADR(adr)
            });
        }

        return files;
    }

    private generateCommands(proposal: ArchitectureProposal): ScaffoldCommand[] {
        const commands: ScaffoldCommand[] = [];

        commands.push({
            command: 'git init',
            description: 'Initialize git repository',
            order: 1,
            optional: false
        });

        if (proposal.stack.frontend?.name.includes('Next')) {
            commands.push({
                command: 'npm install',
                description: 'Install dependencies',
                order: 2,
                optional: false
            });
            commands.push({
                command: 'npm run dev',
                description: 'Start development server',
                order: 3,
                optional: false
            });
        }

        if (proposal.stack.mobile?.name === 'Flutter') {
            commands.push({
                command: 'flutter pub get',
                description: 'Install Flutter packages',
                order: 2,
                optional: false
            });
            commands.push({
                command: 'flutter run',
                description: 'Run on connected device',
                order: 3,
                optional: false
            });
        }

        return commands;
    }

    private async writeScaffold(scaffold: ProjectScaffold, outputPath: string): Promise<void> {
        for (const file of scaffold.files) {
            const fullPath = path.join(outputPath, file.path);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, file.content);
        }
    }

    private async writeADRs(proposal: ArchitectureProposal, outputPath: string): Promise<void> {
        const adrDir = path.join(outputPath, 'docs', 'adr');
        await fs.mkdir(adrDir, { recursive: true });

        for (const adr of proposal.adrs) {
            await fs.writeFile(path.join(adrDir, `${adr.id}.md`), this.formatADR(adr));
        }
    }

    private formatADR(adr: ADR): string {
        return `# ${adr.title}

**Status**: ${adr.status}  
**Date**: ${adr.date.toISOString().split('T')[0]}

## Context
${adr.context}

## Decision
${adr.decision}

## Consequences
${adr.consequences.map(c => `- ${c}`).join('\n')}
`;
    }

    private generateReadme(proposal: ArchitectureProposal): string {
        return `# ${proposal.projectName}

${proposal.summary}

## Tech Stack
${Object.entries(proposal.stack).filter(([, v]) => v).map(([k, v]) => {
            const tech = v as Technology;
            return `- **${k}**: ${tech.name} - ${tech.reason}`;
        }).join('\n')}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Architecture Decisions
See [docs/adr](./docs/adr) for Architecture Decision Records.

## Estimated Costs
- **Low**: $${proposal.estimatedCost.low}/month
- **High**: $${proposal.estimatedCost.high}/month
`;
    }

    private generatePackageJson(proposal: ArchitectureProposal): string {
        const pkg: any = {
            name: proposal.projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '0.1.0',
            private: true,
            scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start',
                lint: 'next lint'
            },
            dependencies: {},
            devDependencies: {}
        };

        if (proposal.stack.frontend?.name.includes('Next')) {
            pkg.dependencies = {
                'next': '^14.0.0',
                'react': '^18.2.0',
                'react-dom': '^18.2.0'
            };
            pkg.devDependencies = {
                'typescript': '^5.0.0',
                '@types/react': '^18.2.0',
                '@types/node': '^20.0.0'
            };
        }

        return JSON.stringify(pkg, null, 2);
    }

    private generateEnvExample(proposal: ArchitectureProposal): string {
        let env = '# Environment Variables\n\n';

        if (proposal.stack.database?.name.includes('Supabase')) {
            env += 'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n';
            env += 'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n';
        }

        if (proposal.stack.database?.name.includes('Firebase')) {
            env += 'NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key\n';
            env += 'NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id\n';
        }

        return env;
    }

    private generateGitignore(proposal: ArchitectureProposal): string {
        return `# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;
    }

    private applyAnswers(proposal: ArchitectureProposal, answers: Record<string, string>): ArchitectureProposal {
        // Refine stack based on answers
        const refined = { ...proposal };

        if (answers['platforms'] === 'iOS only') {
            refined.stack.mobile = { name: 'Swift + SwiftUI', reason: 'Native iOS as requested', alternatives: ['Flutter'] };
        }

        if (answers['gameEngine']) {
            const engine = answers['gameEngine'].split(' ')[0];
            refined.stack.gameEngine = { name: engine, reason: 'User preference', alternatives: [] };
        }

        // Remove answered questions
        refined.clarifyingQuestions = proposal.clarifyingQuestions?.filter(
            q => !answers[q.id]
        );

        return refined;
    }

    private extractProjectName(description: string): string {
        // Simple extraction - would use NLP in production
        const words = description.split(' ').slice(0, 3);
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' App';
    }

    private generateSummary(intent: ProjectIntent, stack: TechStack): string {
        const parts = [];

        if (intent.type === 'game') {
            parts.push(`A ${intent.scale}-scale game`);
        } else if (intent.type === 'mobile') {
            parts.push(`A cross-platform mobile app`);
        } else {
            parts.push(`A modern web application`);
        }

        if (intent.hasAuth) parts.push('with user authentication');
        if (intent.hasRealtime) parts.push('with real-time features');
        if (intent.hasPayments) parts.push('with payment processing');

        return parts.join(' ') + '.';
    }

    private estimateTime(intent: ProjectIntent): string {
        const base = intent.type === 'game' ? 8 : 4;
        const multiplier = intent.scale === 'large' ? 3 : intent.scale === 'small' ? 1 : 2;
        const features = (intent.hasAuth ? 1 : 0) + (intent.hasRealtime ? 2 : 0) + (intent.hasPayments ? 2 : 0);

        const hours = base * multiplier + features;

        if (hours < 1) return '< 1 hour';
        if (hours < 8) return `${hours} hours`;
        return `${Math.ceil(hours / 8)} days`;
    }

    private generateScalabilityProfile(intent: ProjectIntent, stack: TechStack): ScalabilityProfile {
        return {
            currentCapacity: intent.scale === 'small' ? '1K concurrent users' : '10K concurrent users',
            scalingStrategy: 'Horizontal auto-scaling with managed services',
            bottlenecks: ['Database connections', 'Real-time message throughput'],
            upgradeSteps: [
                { trigger: '80% capacity', action: 'Add read replicas', estimatedCost: 50 },
                { trigger: '10K users', action: 'Upgrade to dedicated instances', estimatedCost: 200 }
            ]
        };
    }

    private getStackPerformance(stack: TechStack): number {
        let score = 7;
        if (stack.backend?.name.includes('Go') || stack.backend?.name.includes('Rust')) score = 10;
        if (stack.frontend?.name.includes('Svelte')) score = Math.max(score, 9);
        return score;
    }

    private getStackScalability(stack: TechStack): number {
        let score = 7;
        if (stack.backend?.name.includes('Go')) score = 10;
        if (stack.database?.name.includes('PostgreSQL')) score = Math.max(score, 9);
        return score;
    }

    private getStackLearnability(stack: TechStack): number {
        let score = 7;
        if (stack.frontend?.name.includes('Vue')) score = 9;
        if (stack.backend?.name.includes('Python')) score = 10;
        if (stack.backend?.name.includes('Rust')) score = 4;
        return score;
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Types used internally
interface ProjectIntent {
    type: 'web' | 'mobile' | 'desktop' | 'game' | 'backend' | 'fullstack';
    features: string[];
    scale: 'small' | 'medium' | 'large';
    complexity: 'simple' | 'medium' | 'complex';
    platforms: string[];
    hasMultiplayer: boolean;
    hasAuth: boolean;
    hasPayments: boolean;
    hasRealtime: boolean;
    hasAI: boolean;
}

// Export singleton
export const conversationalArchitect = ConversationalArchitect.getInstance();
