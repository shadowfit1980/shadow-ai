// API Testing Generator - Generate API testing suites for Postman, Jest, and more
import Anthropic from '@anthropic-ai/sdk';

interface ApiTestConfig {
    baseUrl: string;
    endpoints: Array<{
        method: string;
        path: string;
        requestBody?: Record<string, unknown>;
        expectedStatus: number;
    }>;
    authType?: 'bearer' | 'basic' | 'apiKey';
}

class APITestingGenerator {
    private anthropic: Anthropic | null = null;

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic();
        }
        return this.anthropic;
    }

    generatePostmanCollection(config: ApiTestConfig): string {
        const collection = {
            info: {
                name: 'API Test Collection',
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
            },
            item: config.endpoints.map(ep => ({
                name: `${ep.method.toUpperCase()} ${ep.path}`,
                request: {
                    method: ep.method.toUpperCase(),
                    url: `{{baseUrl}}${ep.path}`,
                    header: config.authType === 'bearer' ? [
                        { key: 'Authorization', value: 'Bearer {{token}}' }
                    ] : [],
                    body: ep.requestBody ? {
                        mode: 'raw',
                        raw: JSON.stringify(ep.requestBody, null, 2),
                        options: { raw: { language: 'json' } }
                    } : undefined
                },
                event: [{
                    listen: 'test',
                    script: {
                        exec: [
                            `pm.test("Status code is ${ep.expectedStatus}", function () {`,
                            `    pm.response.to.have.status(${ep.expectedStatus});`,
                            '});',
                            'pm.test("Response time is less than 500ms", function () {',
                            '    pm.expect(pm.response.responseTime).to.be.below(500);',
                            '});'
                        ]
                    }
                }]
            })),
            variable: [
                { key: 'baseUrl', value: config.baseUrl },
                { key: 'token', value: '' }
            ]
        };
        return JSON.stringify(collection, null, 2);
    }

    generateJestAPITests(config: ApiTestConfig): string {
        const imports = `import request from 'supertest';

const BASE_URL = '${config.baseUrl}';
${config.authType === 'bearer' ? "const AUTH_TOKEN = process.env.API_TOKEN || '';" : ''}
`;

        const tests = config.endpoints.map(ep => `
describe('${ep.method.toUpperCase()} ${ep.path}', () => {
    it('should return ${ep.expectedStatus}', async () => {
        const response = await request(BASE_URL)
            .${ep.method.toLowerCase()}('${ep.path}')
            ${config.authType === 'bearer' ? ".set('Authorization', \`Bearer \${AUTH_TOKEN}\`)" : ''}
            ${ep.requestBody ? `.send(${JSON.stringify(ep.requestBody)})` : ''};

        expect(response.status).toBe(${ep.expectedStatus});
    });

    it('should respond within acceptable time', async () => {
        const start = Date.now();
        await request(BASE_URL)
            .${ep.method.toLowerCase()}('${ep.path}')
            ${config.authType === 'bearer' ? ".set('Authorization', \`Bearer \${AUTH_TOKEN}\`)" : ''};
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(1000);
    });
});`).join('\n');

        return imports + tests;
    }

    generatePlaywrightAPITests(config: ApiTestConfig): string {
        return `import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = '${config.baseUrl}';

test.describe('API Tests', () => {
    let apiContext: APIRequestContext;

    test.beforeAll(async ({ playwright }) => {
        apiContext = await playwright.request.newContext({
            baseURL: BASE_URL,
            extraHTTPHeaders: {
                ${config.authType === 'bearer' ? "'Authorization': \`Bearer \${process.env.API_TOKEN}\`," : ''}
                'Accept': 'application/json',
            },
        });
    });

    test.afterAll(async () => {
        await apiContext.dispose();
    });

${config.endpoints.map(ep => `
    test('${ep.method.toUpperCase()} ${ep.path} returns ${ep.expectedStatus}', async () => {
        const response = await apiContext.${ep.method.toLowerCase()}('${ep.path}'${ep.requestBody ? `, { data: ${JSON.stringify(ep.requestBody)} }` : ''});
        expect(response.status()).toBe(${ep.expectedStatus});
    });`).join('\n')}
});
`;
    }

    generateOpenAPISpec(config: ApiTestConfig): string {
        const paths: Record<string, Record<string, unknown>> = {};

        config.endpoints.forEach(ep => {
            if (!paths[ep.path]) {
                paths[ep.path] = {};
            }
            paths[ep.path][ep.method.toLowerCase()] = {
                summary: `${ep.method.toUpperCase()} ${ep.path}`,
                responses: {
                    [ep.expectedStatus]: {
                        description: 'Successful response'
                    }
                },
                ...(ep.requestBody && {
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    example: ep.requestBody
                                }
                            }
                        }
                    }
                })
            };
        });

        return JSON.stringify({
            openapi: '3.0.0',
            info: {
                title: 'API Specification',
                version: '1.0.0'
            },
            servers: [{ url: config.baseUrl }],
            paths,
            ...(config.authType && {
                components: {
                    securitySchemes: {
                        bearerAuth: { type: 'http', scheme: 'bearer' }
                    }
                },
                security: [{ bearerAuth: [] }]
            })
        }, null, 2);
    }
}

export const apiTestingGenerator = new APITestingGenerator();
