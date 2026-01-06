/**
 * Mock Generator - AI mock generation
 */
import { EventEmitter } from 'events';

export interface GeneratedMock { id: string; targetFunction: string; mockCode: string; returnValue: any; }

export class MockGenerator extends EventEmitter {
    private static instance: MockGenerator;
    private mocks: Map<string, GeneratedMock> = new Map();
    private constructor() { super(); }
    static getInstance(): MockGenerator { if (!MockGenerator.instance) MockGenerator.instance = new MockGenerator(); return MockGenerator.instance; }

    async generate(fnName: string, fnSignature: string, returnType: string): Promise<GeneratedMock> {
        const mockCode = `const ${fnName}Mock = jest.fn().mockReturnValue(${this.getDefaultValue(returnType)});`;
        const mock: GeneratedMock = { id: `mock_${Date.now()}`, targetFunction: fnName, mockCode, returnValue: this.getDefaultValue(returnType) };
        this.mocks.set(mock.id, mock);
        this.emit('generated', mock);
        return mock;
    }

    private getDefaultValue(type: string): any {
        switch (type.toLowerCase()) { case 'string': return '""'; case 'number': return '0'; case 'boolean': return 'false'; case 'array': return '[]'; case 'object': return '{}'; default: return 'null'; }
    }

    async generateSpy(fnName: string): Promise<string> { return `const ${fnName}Spy = jest.spyOn(module, '${fnName}');`; }
    getAll(): GeneratedMock[] { return Array.from(this.mocks.values()); }
}
export function getMockGenerator(): MockGenerator { return MockGenerator.getInstance(); }
