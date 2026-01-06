/**
 * Ethereal Code Perfumer
 * 
 * Adds subtle "scents" to code - invisible markers that
 * improve the aesthetic experience of reading code.
 */

import { EventEmitter } from 'events';

export interface CodePerfume {
    id: string;
    name: string;
    notes: PerfumeNote[];
    intensity: number;
    longevity: 'fleeting' | 'moderate' | 'lasting';
}

export interface PerfumeNote {
    type: 'top' | 'middle' | 'base';
    characteristic: string;
}

export interface PerfumedCode {
    id: string;
    originalCode: string;
    perfumedCode: string;
    appliedPerfume: CodePerfume;
    ambiance: number;
}

export class EtherealCodePerfumer extends EventEmitter {
    private static instance: EtherealCodePerfumer;
    private perfumes: Map<string, CodePerfume> = new Map();
    private applications: Map<string, PerfumedCode> = new Map();

    private constructor() {
        super();
        this.initializePerfumes();
    }

    static getInstance(): EtherealCodePerfumer {
        if (!EtherealCodePerfumer.instance) {
            EtherealCodePerfumer.instance = new EtherealCodePerfumer();
        }
        return EtherealCodePerfumer.instance;
    }

    private initializePerfumes(): void {
        const basePerfumes: Omit<CodePerfume, 'id'>[] = [
            {
                name: 'Clean Architecture',
                notes: [
                    { type: 'top', characteristic: 'Clear structure' },
                    { type: 'middle', characteristic: 'Separation of concerns' },
                    { type: 'base', characteristic: 'Testability' },
                ],
                intensity: 0.8,
                longevity: 'lasting',
            },
            {
                name: 'Functional Elegance',
                notes: [
                    { type: 'top', characteristic: 'Pure functions' },
                    { type: 'middle', characteristic: 'Immutability' },
                    { type: 'base', characteristic: 'Composability' },
                ],
                intensity: 0.9,
                longevity: 'lasting',
            },
            {
                name: 'Minimalist Zen',
                notes: [
                    { type: 'top', characteristic: 'Simplicity' },
                    { type: 'middle', characteristic: 'Clarity' },
                    { type: 'base', characteristic: 'Purpose' },
                ],
                intensity: 0.7,
                longevity: 'moderate',
            },
        ];

        basePerfumes.forEach((p, i) => {
            const perfume: CodePerfume = { ...p, id: `perfume_${i}` };
            this.perfumes.set(perfume.id, perfume);
        });
    }

    apply(code: string, perfumeId: string): PerfumedCode | undefined {
        const perfume = this.perfumes.get(perfumeId);
        if (!perfume) return undefined;

        const perfumedCode = this.infuse(code, perfume);

        const result: PerfumedCode = {
            id: `perfumed_${Date.now()}`,
            originalCode: code,
            perfumedCode,
            appliedPerfume: perfume,
            ambiance: perfume.intensity,
        };

        this.applications.set(result.id, result);
        this.emit('code:perfumed', result);
        return result;
    }

    private infuse(code: string, perfume: CodePerfume): string {
        let header = `/**\n * ✨ Perfumed with: ${perfume.name}\n`;
        for (const note of perfume.notes) {
            header += ` * ${note.type.toUpperCase()}: ${note.characteristic}\n`;
        }
        header += ' */\n\n';
        return header + code;
    }

    getAllPerfumes(): CodePerfume[] {
        return Array.from(this.perfumes.values());
    }

    getStats(): { totalPerfumes: number; totalApplications: number; avgAmbiance: number } {
        const apps = Array.from(this.applications.values());
        return {
            totalPerfumes: this.perfumes.size,
            totalApplications: apps.length,
            avgAmbiance: apps.length > 0 ? apps.reduce((s, a) => s + a.ambiance, 0) / apps.length : 0,
        };
    }
}

export const etherealCodePerfumer = EtherealCodePerfumer.getInstance();
