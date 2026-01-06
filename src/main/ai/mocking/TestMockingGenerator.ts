/**
 * Test Mocking Generator
 * 
 * Generate mocks, stubs, and test utilities.
 */

import { EventEmitter } from 'events';

interface MockConfig {
    name: string;
    methods: { name: string; returnType: string; async?: boolean }[];
}

export class TestMockingGenerator extends EventEmitter {
    private static instance: TestMockingGenerator;

    private constructor() { super(); }

    static getInstance(): TestMockingGenerator {
        if (!TestMockingGenerator.instance) {
            TestMockingGenerator.instance = new TestMockingGenerator();
        }
        return TestMockingGenerator.instance;
    }

    generateJestMock(config: MockConfig): string {
        const methods = config.methods.map(m => {
            const fn = m.async ? 'jest.fn().mockResolvedValue' : 'jest.fn().mockReturnValue';
            return `  ${m.name}: ${fn}(${this.getDefaultValue(m.returnType)}),`;
        }).join('\n');
        return `export const mock${config.name} = {\n${methods}\n};\n\njest.mock('./${config.name}', () => ({\n  ${config.name}: jest.fn(() => mock${config.name}),\n}));`;
    }

    generateMSWHandler(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', response: any): string {
        return `import { rest } from 'msw';

export const ${method}${this.pascalCase(endpoint.replace(/\//g, ''))}Handler = rest.${method}(
  '${endpoint}',
  (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(${JSON.stringify(response, null, 2)}));
  }
);`;
    }

    generateTestFactory(typeName: string, fields: Record<string, string>): string {
        const defaults = Object.entries(fields).map(([k, v]) => `  ${k}: ${this.getDefaultValue(v)},`).join('\n');
        return `interface ${typeName} {\n${Object.entries(fields).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n\nexport const create${typeName} = (overrides: Partial<${typeName}> = {}): ${typeName} => ({\n${defaults}\n  ...overrides,\n});`;
    }

    generateSpyHelpers(): string {
        return `export const createSpy = <T extends (...args: any[]) => any>(fn?: T) => {
  const calls: Parameters<T>[] = [];
  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
    return fn?.(...args);
  }) as T & { calls: Parameters<T>[]; reset: () => void };
  spy.calls = calls;
  spy.reset = () => { calls.length = 0; };
  return spy;
};

export const waitFor = async (fn: () => boolean, timeout = 5000) => {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > timeout) throw new Error('Timeout');
    await new Promise(r => setTimeout(r, 50));
  }
};

export const mockFetch = (responses: Record<string, any>) => {
  global.fetch = jest.fn((url: string) => 
    Promise.resolve({ json: () => Promise.resolve(responses[url] || {}), ok: true } as Response)
  );
};`;
    }

    private getDefaultValue(type: string): string {
        const map: Record<string, string> = {
            string: "'test'", number: '0', boolean: 'false', 'string[]': '[]', 'number[]': '[]', Date: 'new Date()', any: '{}'
        };
        return map[type] || 'null';
    }

    private pascalCase(str: string): string {
        return str.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    }
}

export const testMockingGenerator = TestMockingGenerator.getInstance();
