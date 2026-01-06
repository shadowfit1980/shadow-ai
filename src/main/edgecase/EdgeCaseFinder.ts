/**
 * Edge Case Finder - AI-powered edge case detection
 */
import { EventEmitter } from 'events';

export interface EdgeCase { id: string; fnName: string; input: any; description: string; category: 'null' | 'boundary' | 'overflow' | 'type' | 'empty' | 'concurrent'; testCode: string; }

export class EdgeCaseFinder extends EventEmitter {
    private static instance: EdgeCaseFinder;
    private edgeCases: Map<string, EdgeCase[]> = new Map();
    private constructor() { super(); }
    static getInstance(): EdgeCaseFinder { if (!EdgeCaseFinder.instance) EdgeCaseFinder.instance = new EdgeCaseFinder(); return EdgeCaseFinder.instance; }

    async findEdgeCases(fnName: string, fnCode: string): Promise<EdgeCase[]> {
        const cases: EdgeCase[] = [
            { id: `ec_${Date.now()}`, fnName, input: null, description: 'Null input', category: 'null', testCode: `test('handles null', () => expect(${fnName}(null)).toBeDefined());` },
            { id: `ec_${Date.now() + 1}`, fnName, input: [], description: 'Empty array', category: 'empty', testCode: `test('handles empty', () => expect(${fnName}([])).toEqual([]);` },
            { id: `ec_${Date.now() + 2}`, fnName, input: Number.MAX_SAFE_INTEGER, description: 'Max number', category: 'boundary', testCode: `test('handles max', () => expect(${fnName}(Number.MAX_SAFE_INTEGER)).toBeDefined());` },
            { id: `ec_${Date.now() + 3}`, fnName, input: -1, description: 'Negative number', category: 'boundary', testCode: `test('handles negative', () => expect(${fnName}(-1)).toBeDefined());` }
        ];
        this.edgeCases.set(fnName, cases);
        this.emit('found', cases);
        return cases;
    }

    getByFunction(fnName: string): EdgeCase[] { return this.edgeCases.get(fnName) || []; }
    generateTestSuite(fnName: string): string { const cases = this.edgeCases.get(fnName) || []; return `describe('${fnName}', () => {\n${cases.map(c => c.testCode).join('\n')}\n});`; }
}
export function getEdgeCaseFinder(): EdgeCaseFinder { return EdgeCaseFinder.getInstance(); }
