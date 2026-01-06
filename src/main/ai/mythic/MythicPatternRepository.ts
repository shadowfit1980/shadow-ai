/**
 * Mythic Pattern Repository
 * 
 * A repository of legendary code patterns from tech mythology,
 * including patterns used by tech giants and legendary developers.
 */

import { EventEmitter } from 'events';

export interface MythicPattern {
    id: string;
    name: string;
    legend: string;
    origin: string;
    power: number;
    artifacts: string[];
    implementation: string;
    useCases: string[];
    warnings: string[];
}

export interface LegendaryDeveloper {
    name: string;
    domain: string;
    contributions: string[];
    wisdom: string;
}

export interface PatternQuest {
    id: string;
    patron: LegendaryDeveloper;
    challenge: string;
    patterns: MythicPattern[];
    difficulty: 'mortal' | 'hero' | 'legendary' | 'godlike';
}

export class MythicPatternRepository extends EventEmitter {
    private static instance: MythicPatternRepository;
    private patterns: Map<string, MythicPattern> = new Map();
    private legends: Map<string, LegendaryDeveloper> = new Map();

    private constructor() {
        super();
        this.initializePatterns();
        this.initializeLegends();
    }

    static getInstance(): MythicPatternRepository {
        if (!MythicPatternRepository.instance) {
            MythicPatternRepository.instance = new MythicPatternRepository();
        }
        return MythicPatternRepository.instance;
    }

    private initializePatterns(): void {
        const mythicPatterns: Omit<MythicPattern, 'id'>[] = [
            {
                name: 'The Redux Saga',
                legend: 'A pattern born from the chaos of state management, bringing order through time-travel and predictability',
                origin: 'Facebook Engineers, 2015',
                power: 0.9,
                artifacts: ['createStore', 'reducer', 'action', 'middleware'],
                implementation: 'const store = createStore(reducer, applyMiddleware(saga));',
                useCases: ['Complex state management', 'Async flows', 'Time-travel debugging'],
                warnings: ['Boilerplate overhead', 'Learning curve'],
            },
            {
                name: 'The React Hook of Destiny',
                legend: 'A hook that changed how components think - from lifecycle methods to functional purity',
                origin: 'Dan Abramov & Sophie Alpert, 2018',
                power: 0.95,
                artifacts: ['useState', 'useEffect', 'useContext', 'useMemo'],
                implementation: 'const [state, setState] = useState(initialValue);',
                useCases: ['State in functions', 'Side effects', 'Reusable logic'],
                warnings: ['Closure traps', 'Dependency arrays'],
            },
            {
                name: 'The Containerization Spell',
                legend: 'An ancient Docker incantation that binds applications into portable vessels',
                origin: 'Solomon Hykes, 2013',
                power: 0.92,
                artifacts: ['Dockerfile', 'docker-compose', 'container', 'image'],
                implementation: 'FROM node:alpine\\nCOPY . .\\nRUN npm install\\nCMD ["npm", "start"]',
                useCases: ['Deployment', 'Dev environment', 'Microservices'],
                warnings: ['Resource overhead', 'Networking complexity'],
            },
            {
                name: 'The Promise Covenant',
                legend: 'A sacred covenant between asynchronous operations, ensuring eventual resolution',
                origin: 'ES6 Standards Committee, 2015',
                power: 0.88,
                artifacts: ['Promise', 'then', 'catch', 'finally', 'async', 'await'],
                implementation: 'new Promise((resolve, reject) => { ... })',
                useCases: ['Async operations', 'Error handling', 'Chaining'],
                warnings: ['Unhandled rejections', 'Promise hell'],
            },
            {
                name: 'The Observer Ritual',
                legend: 'An ancient ritual allowing objects to witness changes without direct coupling',
                origin: 'Gang of Four, 1994',
                power: 0.85,
                artifacts: ['Subject', 'Observer', 'subscribe', 'notify'],
                implementation: 'subject.subscribe(observer);\\nsubject.notify(event);',
                useCases: ['Event systems', 'UI updates', 'Pub/sub'],
                warnings: ['Memory leaks', 'Update cascades'],
            },
        ];

        for (const pattern of mythicPatterns) {
            const id = `mythic_${pattern.name.toLowerCase().replace(/\s+/g, '_')}`;
            this.patterns.set(id, { id, ...pattern });
        }
    }

    private initializeLegends(): void {
        const legendaryDevs: LegendaryDeveloper[] = [
            {
                name: 'Linus Torvalds',
                domain: 'Operating Systems',
                contributions: ['Linux', 'Git'],
                wisdom: 'Talk is cheap. Show me the code.',
            },
            {
                name: 'Donald Knuth',
                domain: 'Algorithms',
                contributions: ['TeX', 'Art of Computer Programming'],
                wisdom: 'Premature optimization is the root of all evil.',
            },
            {
                name: 'Grace Hopper',
                domain: 'Compilers',
                contributions: ['COBOL', 'First compiler'],
                wisdom: 'The most dangerous phrase is: We\'ve always done it this way.',
            },
            {
                name: 'Dennis Ritchie',
                domain: 'Languages',
                contributions: ['C', 'Unix'],
                wisdom: 'Unix is simple. It just takes a genius to understand its simplicity.',
            },
        ];

        for (const dev of legendaryDevs) {
            this.legends.set(dev.name.toLowerCase(), dev);
        }
    }

    getPattern(name: string): MythicPattern | undefined {
        const normalizedName = `mythic_${name.toLowerCase().replace(/\s+/g, '_')}`;
        return this.patterns.get(normalizedName) ||
            Array.from(this.patterns.values()).find(p =>
                p.name.toLowerCase().includes(name.toLowerCase())
            );
    }

    getAllPatterns(): MythicPattern[] {
        return Array.from(this.patterns.values());
    }

    getLegend(name: string): LegendaryDeveloper | undefined {
        return this.legends.get(name.toLowerCase()) ||
            Array.from(this.legends.values()).find(l =>
                l.name.toLowerCase().includes(name.toLowerCase())
            );
    }

    getAllLegends(): LegendaryDeveloper[] {
        return Array.from(this.legends.values());
    }

    createQuest(challenge: string): PatternQuest {
        const legends = Array.from(this.legends.values());
        const patron = legends[Math.floor(Math.random() * legends.length)];

        const relevantPatterns = this.findRelevantPatterns(challenge);
        const difficulty = relevantPatterns.length > 2 ? 'godlike' :
            relevantPatterns.length > 1 ? 'legendary' :
                relevantPatterns.length > 0 ? 'hero' : 'mortal';

        const quest: PatternQuest = {
            id: `quest_${Date.now()}`,
            patron,
            challenge,
            patterns: relevantPatterns,
            difficulty,
        };

        this.emit('quest:created', quest);
        return quest;
    }

    private findRelevantPatterns(challenge: string): MythicPattern[] {
        const lower = challenge.toLowerCase();
        return Array.from(this.patterns.values()).filter(p =>
            p.useCases.some(uc => lower.includes(uc.toLowerCase())) ||
            p.name.toLowerCase().includes(lower)
        );
    }

    getStats(): { totalPatterns: number; totalLegends: number; avgPower: number } {
        const patterns = Array.from(this.patterns.values());
        return {
            totalPatterns: patterns.length,
            totalLegends: this.legends.size,
            avgPower: patterns.length > 0
                ? patterns.reduce((s, p) => s + p.power, 0) / patterns.length
                : 0,
        };
    }
}

export const mythicPatternRepository = MythicPatternRepository.getInstance();
