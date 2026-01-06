/**
 * Prophetic Exception Seer
 * 
 * Foresees exceptions before they happen, predicting runtime errors
 * through static analysis and pattern recognition.
 */

import { EventEmitter } from 'events';

export interface Prophecy {
    id: string;
    code: string;
    visions: ExceptionVision[];
    timeline: ProphecyTimeline;
    clarity: number;
    preventionSpells: PreventionSpell[];
    createdAt: Date;
}

export interface ExceptionVision {
    id: string;
    type: string;
    probability: number;
    location: { line: number; column: number };
    context: string;
    severity: 'catastrophic' | 'severe' | 'moderate' | 'minor';
}

export interface ProphecyTimeline {
    immediate: ExceptionVision[];
    shortTerm: ExceptionVision[];
    longTerm: ExceptionVision[];
}

export interface PreventionSpell {
    targetVision: string;
    incantation: string;
    code: string;
    effectiveness: number;
}

export class PropheticExceptionSeer extends EventEmitter {
    private static instance: PropheticExceptionSeer;
    private prophecies: Map<string, Prophecy> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): PropheticExceptionSeer {
        if (!PropheticExceptionSeer.instance) {
            PropheticExceptionSeer.instance = new PropheticExceptionSeer();
        }
        return PropheticExceptionSeer.instance;
    }

    divine(code: string): Prophecy {
        const visions = this.seeExceptions(code);
        const timeline = this.categorizeTimeline(visions);
        const preventionSpells = this.createPreventionSpells(visions);
        const clarity = this.calculateClarity(code, visions);

        const prophecy: Prophecy = {
            id: `prophecy_${Date.now()}`,
            code,
            visions,
            timeline,
            clarity,
            preventionSpells,
            createdAt: new Date(),
        };

        this.prophecies.set(prophecy.id, prophecy);
        this.emit('prophecy:revealed', prophecy);
        return prophecy;
    }

    private seeExceptions(code: string): ExceptionVision[] {
        const visions: ExceptionVision[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Null reference vision
            if (line.match(/\w+\./) && !line.includes('?.') && !line.includes('if')) {
                visions.push({
                    id: `vision_null_${i}`,
                    type: 'NullReferenceException',
                    probability: 0.6,
                    location: { line: i + 1, column: line.indexOf('.') },
                    context: 'Potential null dereference',
                    severity: 'severe',
                });
            }

            // Type error vision
            if (line.includes('as any') || (line.includes('JSON.parse') && !line.includes('try'))) {
                visions.push({
                    id: `vision_type_${i}`,
                    type: 'TypeError',
                    probability: 0.7,
                    location: { line: i + 1, column: 0 },
                    context: 'Unsafe type assertion or parse',
                    severity: 'severe',
                });
            }

            // Network error vision
            if ((line.includes('fetch') || line.includes('axios')) && !line.includes('catch')) {
                visions.push({
                    id: `vision_network_${i}`,
                    type: 'NetworkError',
                    probability: 0.8,
                    location: { line: i + 1, column: 0 },
                    context: 'Unhandled network request',
                    severity: 'catastrophic',
                });
            }

            // Index out of bounds vision
            if (line.match(/\[\d+\]/) && !line.includes('length')) {
                visions.push({
                    id: `vision_index_${i}`,
                    type: 'IndexOutOfBoundsException',
                    probability: 0.5,
                    location: { line: i + 1, column: line.indexOf('[') },
                    context: 'Hardcoded array index access',
                    severity: 'moderate',
                });
            }

            // Division by zero vision
            if (line.match(/\/\s*\w+/) && !line.includes('// ')) {
                const divisorMatch = line.match(/\/\s*(\w+)/);
                if (divisorMatch && !line.includes('!== 0')) {
                    visions.push({
                        id: `vision_divzero_${i}`,
                        type: 'DivisionByZeroException',
                        probability: 0.4,
                        location: { line: i + 1, column: line.indexOf('/') },
                        context: 'Potential division by zero',
                        severity: 'moderate',
                    });
                }
            }
        }

        return visions;
    }

    private categorizeTimeline(visions: ExceptionVision[]): ProphecyTimeline {
        return {
            immediate: visions.filter(v => v.probability > 0.7),
            shortTerm: visions.filter(v => v.probability > 0.4 && v.probability <= 0.7),
            longTerm: visions.filter(v => v.probability <= 0.4),
        };
    }

    private createPreventionSpells(visions: ExceptionVision[]): PreventionSpell[] {
        return visions.slice(0, 5).map(vision => ({
            targetVision: vision.id,
            incantation: this.generateIncantation(vision.type),
            code: this.generatePreventionCode(vision),
            effectiveness: 1 - vision.probability * 0.2,
        }));
    }

    private generateIncantation(exceptionType: string): string {
        const incantations: Record<string, string> = {
            'NullReferenceException': 'Nullus Protego!',
            'TypeError': 'Typus Verificato!',
            'NetworkError': 'Networkus Resilience!',
            'IndexOutOfBoundsException': 'Boundus Checko!',
            'DivisionByZeroException': 'Zerus Prevento!',
        };
        return incantations[exceptionType] || 'Exceptio Shield!';
    }

    private generatePreventionCode(vision: ExceptionVision): string {
        switch (vision.type) {
            case 'NullReferenceException':
                return 'object?.property // Use optional chaining';
            case 'TypeError':
                return 'try { JSON.parse(data) } catch { handleError() }';
            case 'NetworkError':
                return 'try { await fetch(url) } catch (e) { handleNetworkError(e) }';
            case 'IndexOutOfBoundsException':
                return 'if (index < array.length) { array[index] }';
            case 'DivisionByZeroException':
                return 'if (divisor !== 0) { result = value / divisor }';
            default:
                return 'try { ... } catch (e) { handleError(e) }';
        }
    }

    private calculateClarity(code: string, visions: ExceptionVision[]): number {
        // More visions found = clearer prophecy
        const visionClarity = Math.min(1, visions.length * 0.15);
        // Better with type annotations
        const typeClarity = code.includes(':') ? 0.2 : 0;
        // Better with existing error handling
        const handlingClarity = code.includes('try') ? 0.2 : 0;

        return Math.min(1, visionClarity + typeClarity + handlingClarity + 0.3);
    }

    getProphecy(id: string): Prophecy | undefined {
        return this.prophecies.get(id);
    }

    getStats(): { total: number; avgClarity: number; mostCommonException: string } {
        const prophecies = Array.from(this.prophecies.values());
        const exceptionCounts: Record<string, number> = {};

        for (const p of prophecies) {
            for (const v of p.visions) {
                exceptionCounts[v.type] = (exceptionCounts[v.type] || 0) + 1;
            }
        }

        const mostCommon = Object.entries(exceptionCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

        return {
            total: prophecies.length,
            avgClarity: prophecies.length > 0
                ? prophecies.reduce((s, p) => s + p.clarity, 0) / prophecies.length
                : 0,
            mostCommonException: mostCommon,
        };
    }
}

export const propheticExceptionSeer = PropheticExceptionSeer.getInstance();
