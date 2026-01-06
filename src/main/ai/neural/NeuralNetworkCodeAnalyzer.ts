/**
 * Neural Network Code Analyzer
 * 
 * Uses neural network-inspired analysis to understand code patterns,
 * learning from each analysis to improve future recommendations.
 */

import { EventEmitter } from 'events';

export interface NeuralAnalysis {
    id: string;
    code: string;
    layers: AnalysisLayer[];
    activations: Activation[];
    predictions: Prediction[];
    confidence: number;
    learnings: Learning[];
    createdAt: Date;
}

export interface AnalysisLayer {
    name: string;
    type: 'input' | 'hidden' | 'output';
    neurons: number;
    features: string[];
}

export interface Activation {
    layer: string;
    feature: string;
    strength: number;
    reason: string;
}

export interface Prediction {
    category: string;
    value: string;
    probability: number;
}

export interface Learning {
    pattern: string;
    weight: number;
    applications: number;
}

export class NeuralNetworkCodeAnalyzer extends EventEmitter {
    private static instance: NeuralNetworkCodeAnalyzer;
    private analyses: Map<string, NeuralAnalysis> = new Map();
    private learnings: Map<string, Learning> = new Map();

    private constructor() {
        super();
        this.initializeLearnings();
    }

    static getInstance(): NeuralNetworkCodeAnalyzer {
        if (!NeuralNetworkCodeAnalyzer.instance) {
            NeuralNetworkCodeAnalyzer.instance = new NeuralNetworkCodeAnalyzer();
        }
        return NeuralNetworkCodeAnalyzer.instance;
    }

    private initializeLearnings(): void {
        const basePatterns = [
            'async-pattern', 'class-structure', 'functional-style',
            'error-handling', 'type-safety', 'modular-design'
        ];

        for (const pattern of basePatterns) {
            this.learnings.set(pattern, {
                pattern,
                weight: 0.5,
                applications: 0,
            });
        }
    }

    analyze(code: string): NeuralAnalysis {
        const layers = this.buildLayers(code);
        const activations = this.calculateActivations(code, layers);
        const predictions = this.makePredictions(activations);
        const learnings = this.extractLearnings(code);

        const analysis: NeuralAnalysis = {
            id: `neural_${Date.now()}`,
            code,
            layers,
            activations,
            predictions,
            confidence: this.calculateConfidence(activations),
            learnings,
            createdAt: new Date(),
        };

        // Update global learnings
        this.updateLearnings(learnings);

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:completed', analysis);
        return analysis;
    }

    private buildLayers(code: string): AnalysisLayer[] {
        const lines = code.split('\n').length;
        const complexity = (code.match(/if|else|for|while|switch/g) || []).length;

        return [
            {
                name: 'Input Layer',
                type: 'input',
                neurons: lines,
                features: ['raw-code', 'line-count', 'character-count'],
            },
            {
                name: 'Lexical Layer',
                type: 'hidden',
                neurons: Math.ceil(lines / 5),
                features: ['keywords', 'identifiers', 'operators', 'literals'],
            },
            {
                name: 'Syntactic Layer',
                type: 'hidden',
                neurons: Math.ceil(lines / 10),
                features: ['functions', 'classes', 'blocks', 'expressions'],
            },
            {
                name: 'Semantic Layer',
                type: 'hidden',
                neurons: Math.ceil(complexity / 2) + 5,
                features: ['patterns', 'intent', 'relationships'],
            },
            {
                name: 'Output Layer',
                type: 'output',
                neurons: 5,
                features: ['quality', 'complexity', 'maintainability', 'recommendations'],
            },
        ];
    }

    private calculateActivations(code: string, layers: AnalysisLayer[]): Activation[] {
        const activations: Activation[] = [];

        // Lexical activations
        if (code.includes('async') || code.includes('await')) {
            activations.push({
                layer: 'Lexical Layer',
                feature: 'keywords',
                strength: 0.8,
                reason: 'Async/await pattern detected',
            });
        }

        // Syntactic activations
        if (code.includes('class')) {
            activations.push({
                layer: 'Syntactic Layer',
                feature: 'classes',
                strength: 0.9,
                reason: 'Class-based structure',
            });
        }
        if (code.includes('function') || code.includes('=>')) {
            activations.push({
                layer: 'Syntactic Layer',
                feature: 'functions',
                strength: 0.85,
                reason: 'Function declarations found',
            });
        }

        // Semantic activations
        if (code.includes('interface') || code.includes('type ')) {
            activations.push({
                layer: 'Semantic Layer',
                feature: 'patterns',
                strength: 0.9,
                reason: 'Type-safe patterns',
            });
        }
        if (code.includes('try') && code.includes('catch')) {
            activations.push({
                layer: 'Semantic Layer',
                feature: 'patterns',
                strength: 0.75,
                reason: 'Error handling pattern',
            });
        }

        return activations;
    }

    private makePredictions(activations: Activation[]): Prediction[] {
        const predictions: Prediction[] = [];

        const avgStrength = activations.length > 0
            ? activations.reduce((s, a) => s + a.strength, 0) / activations.length
            : 0.5;

        predictions.push({
            category: 'Code Quality',
            value: avgStrength > 0.7 ? 'High' : avgStrength > 0.4 ? 'Medium' : 'Low',
            probability: avgStrength,
        });

        const hasTypeSafety = activations.some(a => a.reason.includes('Type'));
        predictions.push({
            category: 'Type Safety',
            value: hasTypeSafety ? 'Strong' : 'Weak',
            probability: hasTypeSafety ? 0.85 : 0.3,
        });

        const hasErrorHandling = activations.some(a => a.reason.includes('Error'));
        predictions.push({
            category: 'Robustness',
            value: hasErrorHandling ? 'Robust' : 'Fragile',
            probability: hasErrorHandling ? 0.8 : 0.4,
        });

        return predictions;
    }

    private extractLearnings(code: string): Learning[] {
        const learnings: Learning[] = [];

        if (code.includes('async')) {
            const existing = this.learnings.get('async-pattern');
            learnings.push({
                pattern: 'async-pattern',
                weight: (existing?.weight || 0.5) + 0.1,
                applications: (existing?.applications || 0) + 1,
            });
        }

        if (code.includes('class')) {
            const existing = this.learnings.get('class-structure');
            learnings.push({
                pattern: 'class-structure',
                weight: (existing?.weight || 0.5) + 0.1,
                applications: (existing?.applications || 0) + 1,
            });
        }

        if (code.includes('try') && code.includes('catch')) {
            const existing = this.learnings.get('error-handling');
            learnings.push({
                pattern: 'error-handling',
                weight: (existing?.weight || 0.5) + 0.15,
                applications: (existing?.applications || 0) + 1,
            });
        }

        return learnings;
    }

    private updateLearnings(newLearnings: Learning[]): void {
        for (const learning of newLearnings) {
            this.learnings.set(learning.pattern, {
                pattern: learning.pattern,
                weight: Math.min(1, learning.weight),
                applications: learning.applications,
            });
        }
    }

    private calculateConfidence(activations: Activation[]): number {
        if (activations.length === 0) return 0.3;
        return activations.reduce((s, a) => s + a.strength, 0) / activations.length;
    }

    getAnalysis(id: string): NeuralAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllLearnings(): Learning[] {
        return Array.from(this.learnings.values());
    }

    getStats(): { total: number; avgConfidence: number; topPatterns: Learning[] } {
        const analyses = Array.from(this.analyses.values());
        const learnings = Array.from(this.learnings.values())
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5);

        return {
            total: analyses.length,
            avgConfidence: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.confidence, 0) / analyses.length
                : 0,
            topPatterns: learnings,
        };
    }
}

export const neuralNetworkCodeAnalyzer = NeuralNetworkCodeAnalyzer.getInstance();
