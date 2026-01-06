/**
 * Dimensional Code Shifter
 * 
 * Shifts code between dimensional realities, allowing
 * simultaneous existence in multiple paradigms.
 */

import { EventEmitter } from 'events';

export interface DimensionalShift {
    id: string;
    code: string;
    dimensions: Dimension[];
    currentDimension: number;
    stability: number;
}

export interface Dimension {
    id: number;
    name: string;
    variant: string;
    characteristics: string[];
}

export class DimensionalCodeShifter extends EventEmitter {
    private static instance: DimensionalCodeShifter;
    private shifts: Map<string, DimensionalShift> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): DimensionalCodeShifter {
        if (!DimensionalCodeShifter.instance) {
            DimensionalCodeShifter.instance = new DimensionalCodeShifter();
        }
        return DimensionalCodeShifter.instance;
    }

    shift(code: string): DimensionalShift {
        const dimensions = this.createDimensions(code);

        const shifted: DimensionalShift = {
            id: `shift_${Date.now()}`,
            code,
            dimensions,
            currentDimension: 0,
            stability: 0.8,
        };

        this.shifts.set(shifted.id, shifted);
        this.emit('shift:created', shifted);
        return shifted;
    }

    private createDimensions(code: string): Dimension[] {
        return [
            { id: 0, name: 'Prime', variant: code, characteristics: ['Original form'] },
            { id: 1, name: 'Functional', variant: this.toFunctional(code), characteristics: ['Pure functions'] },
            { id: 2, name: 'Reactive', variant: this.toReactive(code), characteristics: ['Observables'] },
            { id: 3, name: 'Minimal', variant: this.toMinimal(code), characteristics: ['Compact'] },
        ];
    }

    private toFunctional(code: string): string {
        return `// Functional Dimension\n${code.replace(/class/g, '// class →')}\n// Use pure functions`;
    }

    private toReactive(code: string): string {
        return `// Reactive Dimension\nimport { Observable } from 'rxjs';\n${code}`;
    }

    private toMinimal(code: string): string {
        return code.replace(/\/\/[^\n]*/g, '').replace(/\n\s*\n/g, '\n');
    }

    navigate(shiftId: string, dimensionId: number): Dimension | undefined {
        const shift = this.shifts.get(shiftId);
        if (!shift) return undefined;
        shift.currentDimension = dimensionId;
        return shift.dimensions.find(d => d.id === dimensionId);
    }

    getStats(): { total: number; avgDimensions: number } {
        const shifts = Array.from(this.shifts.values());
        return {
            total: shifts.length,
            avgDimensions: shifts.length > 0
                ? shifts.reduce((s, sh) => s + sh.dimensions.length, 0) / shifts.length
                : 0,
        };
    }
}

export const dimensionalCodeShifter = DimensionalCodeShifter.getInstance();
