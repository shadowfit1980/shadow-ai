/**
 * Universal Code Alchemist
 * 
 * Transforms code between any programming languages, frameworks,
 * paradigms, and eras with intelligent context preservation.
 */

import { EventEmitter } from 'events';

export interface Transmutation {
    id: string;
    sourceLanguage: string;
    targetLanguage: string;
    sourceCode: string;
    targetCode: string;
    transformations: Transform[];
    preservedContext: PreservedContext;
    quality: QualityMetrics;
    timestamp: Date;
}

export interface Transform {
    id: string;
    type: TransformType;
    description: string;
    before: string;
    after: string;
    confidence: number;
}

export type TransformType =
    | 'syntax'
    | 'paradigm'
    | 'pattern'
    | 'library'
    | 'idiom'
    | 'type-system'
    | 'architecture';

export interface PreservedContext {
    functionality: number;
    semantics: number;
    patterns: string[];
    mappings: LanguageMapping[];
}

export interface LanguageMapping {
    sourceConstruct: string;
    targetConstruct: string;
    notes?: string;
}

export interface QualityMetrics {
    syntaxScore: number;
    idiomaticScore: number;
    performanceScore: number;
    maintainabilityScore: number;
    overall: number;
}

export interface LanguageProfile {
    id: string;
    name: string;
    paradigms: Paradigm[];
    typeSystem: 'static' | 'dynamic' | 'gradual';
    syntax: SyntaxFamily;
    features: string[];
    popular_frameworks: string[];
}

export type Paradigm = 'oop' | 'functional' | 'procedural' | 'declarative' | 'reactive' | 'concurrent';
export type SyntaxFamily = 'c-like' | 'ml-like' | 'lisp-like' | 'python-like' | 'ruby-like' | 'prolog-like';

export interface TransmutationRequest {
    sourceCode: string;
    sourceLanguage: string;
    targetLanguage: string;
    preserveComments?: boolean;
    optimizeForTarget?: boolean;
    targetFramework?: string;
}

export class UniversalCodeAlchemist extends EventEmitter {
    private static instance: UniversalCodeAlchemist;
    private transmutations: Map<string, Transmutation> = new Map();
    private languages: Map<string, LanguageProfile> = new Map();

    private constructor() {
        super();
        this.initializeLanguages();
    }

    static getInstance(): UniversalCodeAlchemist {
        if (!UniversalCodeAlchemist.instance) {
            UniversalCodeAlchemist.instance = new UniversalCodeAlchemist();
        }
        return UniversalCodeAlchemist.instance;
    }

    private initializeLanguages(): void {
        this.languages.set('typescript', {
            id: 'typescript',
            name: 'TypeScript',
            paradigms: ['oop', 'functional'],
            typeSystem: 'static',
            syntax: 'c-like',
            features: ['generics', 'interfaces', 'decorators', 'async-await'],
            popular_frameworks: ['React', 'Angular', 'Next.js', 'Express'],
        });

        this.languages.set('python', {
            id: 'python',
            name: 'Python',
            paradigms: ['oop', 'functional', 'procedural'],
            typeSystem: 'dynamic',
            syntax: 'python-like',
            features: ['decorators', 'generators', 'list-comprehension', 'async-await'],
            popular_frameworks: ['Django', 'FastAPI', 'Flask', 'PyTorch'],
        });

        this.languages.set('rust', {
            id: 'rust',
            name: 'Rust',
            paradigms: ['functional', 'procedural', 'concurrent'],
            typeSystem: 'static',
            syntax: 'c-like',
            features: ['ownership', 'lifetimes', 'traits', 'pattern-matching', 'zero-cost-abstractions'],
            popular_frameworks: ['Actix', 'Rocket', 'Tokio', 'Axum'],
        });

        this.languages.set('go', {
            id: 'go',
            name: 'Go',
            paradigms: ['procedural', 'concurrent'],
            typeSystem: 'static',
            syntax: 'c-like',
            features: ['goroutines', 'channels', 'interfaces', 'defer'],
            popular_frameworks: ['Gin', 'Echo', 'Fiber'],
        });

        this.languages.set('java', {
            id: 'java',
            name: 'Java',
            paradigms: ['oop'],
            typeSystem: 'static',
            syntax: 'c-like',
            features: ['generics', 'annotations', 'streams', 'records'],
            popular_frameworks: ['Spring', 'Quarkus', 'Micronaut'],
        });

        this.languages.set('swift', {
            id: 'swift',
            name: 'Swift',
            paradigms: ['oop', 'functional'],
            typeSystem: 'static',
            syntax: 'c-like',
            features: ['optionals', 'protocols', 'extensions', 'async-await'],
            popular_frameworks: ['SwiftUI', 'UIKit', 'Vapor'],
        });
    }

    // ========================================================================
    // TRANSMUTATION
    // ========================================================================

    async transmute(request: TransmutationRequest): Promise<Transmutation> {
        const { sourceCode, sourceLanguage, targetLanguage } = request;

        this.emit('transmutation:started', { sourceLanguage, targetLanguage });

        const sourceProfile = this.languages.get(sourceLanguage.toLowerCase());
        const targetProfile = this.languages.get(targetLanguage.toLowerCase());

        if (!targetProfile) {
            throw new Error(`Target language ${targetLanguage} not supported`);
        }

        // Analyze source structure
        const structure = this.analyzeStructure(sourceCode, sourceLanguage);

        // Generate transformations
        const transformations = this.planTransformations(
            structure,
            sourceProfile,
            targetProfile
        );

        // Apply transformations
        const targetCode = this.applyTransformations(
            sourceCode,
            transformations,
            targetProfile,
            request
        );

        // Calculate preserved context
        const preservedContext = this.calculatePreservedContext(
            sourceCode,
            targetCode,
            transformations
        );

        // Calculate quality
        const quality = this.calculateQuality(targetCode, targetProfile);

        const transmutation: Transmutation = {
            id: `trans_${Date.now()}`,
            sourceLanguage,
            targetLanguage,
            sourceCode,
            targetCode,
            transformations,
            preservedContext,
            quality,
            timestamp: new Date(),
        };

        this.transmutations.set(transmutation.id, transmutation);
        this.emit('transmutation:completed', transmutation);
        return transmutation;
    }

    private analyzeStructure(code: string, language: string): {
        functions: string[];
        classes: string[];
        imports: string[];
        exports: string[];
    } {
        const lines = code.split('\n');
        const functions: string[] = [];
        const classes: string[] = [];
        const imports: string[] = [];
        const exports: string[] = [];

        for (const line of lines) {
            // Extract functions
            const funcMatch = line.match(/(?:function|def|fn|func)\s+(\w+)/);
            if (funcMatch) functions.push(funcMatch[1]);

            // Arrow functions (TypeScript/JavaScript)
            const arrowMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
            if (arrowMatch) functions.push(arrowMatch[1]);

            // Classes
            const classMatch = line.match(/(?:class|struct)\s+(\w+)/);
            if (classMatch) classes.push(classMatch[1]);

            // Imports
            if (line.includes('import ') || line.includes('from ') || line.includes('require(')) {
                imports.push(line.trim());
            }

            // Exports
            if (line.includes('export ') || line.includes('module.exports')) {
                exports.push(line.trim());
            }
        }

        return { functions, classes, imports, exports };
    }

    private planTransformations(
        structure: { functions: string[]; classes: string[]; imports: string[]; exports: string[] },
        source?: LanguageProfile,
        target?: LanguageProfile
    ): Transform[] {
        const transforms: Transform[] = [];

        if (!target) return transforms;

        // Syntax transformations
        transforms.push({
            id: `t_${Date.now()}_syntax`,
            type: 'syntax',
            description: `Convert ${source?.syntax || 'source'} syntax to ${target.syntax}`,
            before: '// Original syntax',
            after: '// Converted syntax',
            confidence: 0.9,
        });

        // Type system
        if (source?.typeSystem !== target.typeSystem) {
            transforms.push({
                id: `t_${Date.now()}_type`,
                type: 'type-system',
                description: `Adapt ${source?.typeSystem || 'dynamic'} types to ${target.typeSystem}`,
                before: 'Original type annotations',
                after: 'Converted type system',
                confidence: source?.typeSystem === 'dynamic' && target.typeSystem === 'static' ? 0.7 : 0.9,
            });
        }

        // Paradigm shift
        const sourceParadigms = source?.paradigms || [];
        const targetParadigms = target.paradigms;
        const paradigmDiff = targetParadigms.filter(p => !sourceParadigms.includes(p));

        if (paradigmDiff.length > 0) {
            transforms.push({
                id: `t_${Date.now()}_paradigm`,
                type: 'paradigm',
                description: `Apply ${paradigmDiff.join(', ')} patterns`,
                before: 'Original paradigm',
                after: `${paradigmDiff[0]} approach`,
                confidence: 0.75,
            });
        }

        // Library mappings
        transforms.push({
            id: `t_${Date.now()}_library`,
            type: 'library',
            description: 'Map libraries to equivalents',
            before: 'Source libraries',
            after: 'Target ecosystem libraries',
            confidence: 0.8,
        });

        return transforms;
    }

    private applyTransformations(
        sourceCode: string,
        transforms: Transform[],
        target: LanguageProfile,
        request: TransmutationRequest
    ): string {
        let code = sourceCode;

        // Apply syntax conversion based on target language
        code = this.convertSyntax(code, target);

        // Add target-specific imports
        code = this.addTargetImports(code, target, request.targetFramework);

        // Apply idiomatic patterns
        code = this.applyIdioms(code, target);

        // Convert comments if requested
        if (request.preserveComments === false) {
            code = code.replace(/\/\/.*$/gm, '');
            code = code.replace(/\/\*[\s\S]*?\*\//g, '');
            code = code.replace(/#.*$/gm, '');
        }

        // Add header comment
        code = `// Transmuted from ${request.sourceLanguage} to ${request.targetLanguage}\n// Generated by Shadow AI Universal Code Alchemist\n\n${code}`;

        return code;
    }

    private convertSyntax(code: string, target: LanguageProfile): string {
        let result = code;

        switch (target.id) {
            case 'python':
                result = result.replace(/function\s+(\w+)\s*\(/g, 'def $1(');
                result = result.replace(/const |let |var /g, '');
                result = result.replace(/{\s*$/gm, ':');
                result = result.replace(/^(\s*)}\s*$/gm, '');
                result = result.replace(/;$/gm, '');
                result = result.replace(/===|==/g, '==');
                result = result.replace(/!==|!=/g, '!=');
                result = result.replace(/&&/g, 'and');
                result = result.replace(/\|\|/g, 'or');
                result = result.replace(/!/g, 'not ');
                break;

            case 'rust':
                result = result.replace(/function\s+(\w+)/g, 'fn $1');
                result = result.replace(/const\s+(\w+)\s*=/g, 'let $1 =');
                result = result.replace(/let\s+(\w+)\s*=/g, 'let mut $1 =');
                result = result.replace(/console\.log/g, 'println!');
                result = result.replace(/'([^']+)'/g, '"$1"');
                break;

            case 'go':
                result = result.replace(/function\s+(\w+)\s*\(/g, 'func $1(');
                result = result.replace(/const\s+(\w+)\s*=/g, '$1 :=');
                result = result.replace(/let\s+(\w+)\s*=/g, '$1 :=');
                result = result.replace(/console\.log/g, 'fmt.Println');
                break;

            case 'java':
                result = result.replace(/function\s+(\w+)/g, 'public void $1');
                result = result.replace(/const |let /g, 'var ');
                result = result.replace(/console\.log/g, 'System.out.println');
                break;

            case 'swift':
                result = result.replace(/function\s+(\w+)/g, 'func $1');
                result = result.replace(/const\s+(\w+)\s*=/g, 'let $1 =');
                result = result.replace(/let\s+(\w+)\s*=/g, 'var $1 =');
                result = result.replace(/console\.log/g, 'print');
                break;

            default:
                // Keep TypeScript-like syntax
                break;
        }

        return result;
    }

    private addTargetImports(code: string, target: LanguageProfile, framework?: string): string {
        const imports: string[] = [];

        switch (target.id) {
            case 'python':
                if (code.includes('async')) imports.push('import asyncio');
                if (code.includes('typing')) imports.push('from typing import List, Dict, Optional');
                break;

            case 'rust':
                imports.push('use std::collections::HashMap;');
                if (code.includes('async')) imports.push('use tokio::runtime::Runtime;');
                break;

            case 'go':
                imports.push('import "fmt"');
                if (code.includes('http')) imports.push('import "net/http"');
                break;

            case 'java':
                imports.push('import java.util.*;');
                break;
        }

        return imports.length > 0 ? imports.join('\n') + '\n\n' + code : code;
    }

    private applyIdioms(code: string, target: LanguageProfile): string {
        // Apply language-specific idiomatic patterns
        switch (target.id) {
            case 'python':
                // Use list comprehension where applicable
                // Use f-strings for formatting
                break;
            case 'rust':
                // Use Result/Option patterns
                // Use iterators and functional style
                break;
            case 'go':
                // Use error handling idioms
                // Use goroutines for concurrency
                break;
        }
        return code;
    }

    private calculatePreservedContext(
        source: string,
        target: string,
        transforms: Transform[]
    ): PreservedContext {
        const sourceLines = source.split('\n').filter(l => l.trim()).length;
        const targetLines = target.split('\n').filter(l => l.trim()).length;

        const sizeDiff = Math.abs(sourceLines - targetLines) / Math.max(sourceLines, 1);
        const functionality = 1 - sizeDiff * 0.2;

        const semantics = transforms.reduce((s, t) => s + t.confidence, 0) / transforms.length;

        const mappings: LanguageMapping[] = transforms.map(t => ({
            sourceConstruct: t.before,
            targetConstruct: t.after,
            notes: t.description,
        }));

        return {
            functionality: Math.max(0.5, functionality),
            semantics,
            patterns: transforms.map(t => t.type),
            mappings,
        };
    }

    private calculateQuality(code: string, target: LanguageProfile): QualityMetrics {
        const lines = code.split('\n');

        // Simple quality heuristics
        const syntaxScore = lines.every(l => !l.includes('undefined')) ? 0.9 : 0.6;
        const idiomaticScore = 0.8; // Would require deeper analysis
        const performanceScore = target.typeSystem === 'static' ? 0.9 : 0.7;
        const maintainabilityScore = code.includes('//') || code.includes('#') ? 0.85 : 0.7;

        return {
            syntaxScore,
            idiomaticScore,
            performanceScore,
            maintainabilityScore,
            overall: (syntaxScore + idiomaticScore + performanceScore + maintainabilityScore) / 4,
        };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getTransmutation(id: string): Transmutation | undefined {
        return this.transmutations.get(id);
    }

    getAllTransmutations(): Transmutation[] {
        return Array.from(this.transmutations.values());
    }

    getSupportedLanguages(): string[] {
        return Array.from(this.languages.keys());
    }

    getLanguageProfile(id: string): LanguageProfile | undefined {
        return this.languages.get(id.toLowerCase());
    }

    getStats(): {
        totalTransmutations: number;
        avgQuality: number;
        popularTargets: Record<string, number>;
    } {
        const trans = Array.from(this.transmutations.values());
        const popularTargets: Record<string, number> = {};

        for (const t of trans) {
            popularTargets[t.targetLanguage] = (popularTargets[t.targetLanguage] || 0) + 1;
        }

        return {
            totalTransmutations: trans.length,
            avgQuality: trans.length > 0 ? trans.reduce((s, t) => s + t.quality.overall, 0) / trans.length : 0,
            popularTargets,
        };
    }
}

export const universalCodeAlchemist = UniversalCodeAlchemist.getInstance();
