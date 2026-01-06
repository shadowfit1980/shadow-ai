/**
 * Advanced Testing Generator
 * 
 * Generate visual regression tests, load tests, contract tests,
 * and mutation tests.
 */

import { EventEmitter } from 'events';

// ============================================================================
// ADVANCED TESTING GENERATOR
// ============================================================================

export class AdvancedTestingGenerator extends EventEmitter {
    private static instance: AdvancedTestingGenerator;

    private constructor() {
        super();
    }

    static getInstance(): AdvancedTestingGenerator {
        if (!AdvancedTestingGenerator.instance) {
            AdvancedTestingGenerator.instance = new AdvancedTestingGenerator();
        }
        return AdvancedTestingGenerator.instance;
    }

    // ========================================================================
    // VISUAL REGRESSION TESTING
    // ========================================================================

    generateVisualRegression(): string {
        return `import { test, expect } from '@playwright/test';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

// ============================================================================
// VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Visual Regression Tests', () => {
    test('homepage layout', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        
        const screenshot = await page.screenshot({ fullPage: true });
        expect(screenshot).toMatchImageSnapshot({
            customSnapshotsDir: '__screenshots__',
            customDiffDir: '__screenshots__/diff',
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    });

    test('mobile navigation', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('http://localhost:3000');
        
        const screenshot = await page.screenshot({ fullPage: true });
        expect(screenshot).toMatchImageSnapshot({
            customSnapshotIdentifier: 'mobile-nav',
        });
    });

    test('dark mode toggle', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.click('[data-testid="theme-toggle"]');
        await page.waitForTimeout(300); // Animation
        
        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot({
            customSnapshotIdentifier: 'dark-mode',
        });
    });

    test('form validation states', async ({ page }) => {
        await page.goto('http://localhost:3000/signup');
        
        // Fill invalid data
        await page.fill('input[name="email"]', 'invalid-email');
        await page.click('button[type="submit"]');
        await page.waitForSelector('.error-message');
        
        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot({
            customSnapshotIdentifier: 'validation-errors',
        });
    });
});

// ============================================================================
// PERCY.IO INTEGRATION
// ============================================================================

import percySnapshot from '@percy/playwright';

test.describe('Percy Visual Tests', () => {
    test('capture responsive layouts', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await percySnapshot(page, 'Homepage', {
            widths: [375, 768, 1280],
        });
    });

    test('capture component states', async ({ page }) => {
        await page.goto('http://localhost:3000/components');
        
        // Normal state
        await percySnapshot(page, 'Button - Normal');
        
        // Hover state
        await page.hover('button');
        await percySnapshot(page, 'Button - Hover');
        
        // Disabled state
        await page.click('[data-testid="toggle-disabled"]');
        await percySnapshot(page, 'Button - Disabled');
    });
});

// ============================================================================
// BACKSTOP.JS CONFIG
// ============================================================================

export const backstopConfig = {
    id: 'visual_regression',
    viewports: [
        { label: 'phone', width: 375, height: 667 },
        { label: 'tablet', width: 768, height: 1024 },
        { label: 'desktop', width: 1440, height: 900 },
    ],
    scenarios: [
        {
            label: 'Homepage',
            url: 'http://localhost:3000',
            delay: 500,
            misMatchThreshold: 0.1,
        },
        {
            label: 'Dashboard',
            url: 'http://localhost:3000/dashboard',
            cookiePath: 'backstop_data/cookies.json',
            delay: 1000,
        },
    ],
    paths: {
        bitmaps_reference: 'backstop_data/bitmaps_reference',
        bitmaps_test: 'backstop_data/bitmaps_test',
        html_report: 'backstop_data/html_report',
    },
    report: ['browser', 'CI'],
    engine: 'playwright',
};
`;
    }

    // ========================================================================
    // LOAD TESTING
    // ========================================================================

    generateLoadTests(): string {
        return `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// ============================================================================
// K6 LOAD TEST
// ============================================================================

export const options = {
    stages: [
        { duration: '30s', target: 20 },   // Ramp up to 20 users
        { duration: '1m', target: 50 },    // Ramp up to 50 users
        { duration: '2m', target: 50 },    // Stay at 50 users
        { duration: '30s', target: 100 },  // Spike to 100 users
        { duration: '30s', target: 0 },    // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
        checks: ['rate>0.95'],
    },
};

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    // Test homepage
    let res = http.get(\`\${BASE_URL}/\`);
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1);

    // Test API endpoint
    res = http.get(\`\${BASE_URL}/api/users\`, {
        headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
    });
    check(res, {
        'API status is 200': (r) => r.status === 200,
        'API has data': (r) => r.json().length > 0,
    }) || errorRate.add(1);

    sleep(1);

    // Test POST request
    const payload = JSON.stringify({
        name: 'Test User',
        email: \`test-\${__VU}-\${__ITER}@example.com\`,
    });

    res = http.post(\`\${BASE_URL}/api/users\`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
        'create user status is 201': (r) => r.status === 201,
    }) || errorRate.add(1);

    sleep(2);
}

// ============================================================================
// ARTILLERY CONFIG
// ============================================================================

export const artilleryConfig = {
    config: {
        target: 'http://localhost:3000',
        phases: [
            { duration: 60, arrivalRate: 10, name: 'Warm up' },
            { duration: 120, arrivalRate: 50, name: 'Sustained load' },
            { duration: 60, arrivalRate: 100, name: 'Spike' },
        ],
        plugins: {
            metrics: {
                statsd: {
                    host: 'localhost',
                    port: 8125,
                    prefix: 'artillery',
                },
            },
        },
    },
    scenarios: [
        {
            name: 'User Journey',
            flow: [
                { get: { url: '/' } },
                { think: 2 },
                { post: {
                    url: '/api/login',
                    json: {
                        email: 'test@example.com',
                        password: 'password123',
                    },
                    capture: { json: '$.token', as: 'token' },
                }},
                { get: {
                    url: '/api/dashboard',
                    headers: { Authorization: 'Bearer {{ token }}' },
                }},
            ],
        },
    ],
};
`;
    }

    // ========================================================================
    // CONTRACT TESTING
    // ========================================================================

    generateContractTests(): string {
        return `import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/dsl/matchers';
import axios from 'axios';

// ============================================================================
// PACT CONSUMER TEST
// ============================================================================

describe('User API Contract', () => {
    const provider = new Pact({
        consumer: 'WebApp',
        provider: 'UserAPI',
        port: 1234,
        log: './logs/pact.log',
        dir: './pacts',
        logLevel: 'info',
    });

    beforeAll(() => provider.setup());
    afterEach(() => provider.verify());
    afterAll(() => provider.finalize());

    describe('GET /api/users/:id', () => {
        beforeAll(async () => {
            await provider.addInteraction({
                state: 'user with id 1 exists',
                uponReceiving: 'a request for user with id 1',
                withRequest: {
                    method: 'GET',
                    path: '/api/users/1',
                    headers: {
                        Accept: 'application/json',
                    },
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: like({
                        id: 1,
                        name: 'John Doe',
                        email: 'john@example.com',
                        createdAt: '2024-01-01T00:00:00Z',
                    }),
                },
            });
        });

        it('returns user data', async () => {
            const response = await axios.get('http://localhost:1234/api/users/1', {
                headers: { Accept: 'application/json' },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
            expect(response.data).toHaveProperty('email');
        });
    });

    describe('GET /api/users', () => {
        beforeAll(async () => {
            await provider.addInteraction({
                state: 'users exist',
                uponReceiving: 'a request for all users',
                withRequest: {
                    method: 'GET',
                    path: '/api/users',
                    query: { page: '1', limit: '10' },
                },
                willRespondWith: {
                    status: 200,
                    body: {
                        data: eachLike({
                            id: 1,
                            name: 'John Doe',
                            email: 'john@example.com',
                        }),
                        meta: {
                            page: 1,
                            totalPages: 5,
                            total: 50,
                        },
                    },
                },
            });
        });

        it('returns paginated users', async () => {
            const response = await axios.get('http://localhost:1234/api/users', {
                params: { page: 1, limit: 10 },
            });

            expect(response.status).toBe(200);
            expect(response.data.data).toBeInstanceOf(Array);
            expect(response.data.meta).toHaveProperty('totalPages');
        });
    });
});

// ============================================================================
// OPENAPI CONTRACT VALIDATION
// ============================================================================

import { OpenAPIValidator } from 'express-openapi-validator';

export function setupContractValidation(app: any) {
    app.use(
        OpenAPIValidator.middleware({
            apiSpec: './openapi.yaml',
            validateRequests: true,
            validateResponses: true,
            validateSecurity: {
                handlers: {
                    BearerAuth: async (req, scopes) => {
                        // Verify token
                        return true;
                    },
                },
            },
        })
    );

    // Error handler
    app.use((err: any, req: any, res: any, next: any) => {
        res.status(err.status || 500).json({
            message: err.message,
            errors: err.errors,
        });
    });
}
`;
    }

    // ========================================================================
    // MUTATION TESTING
    // ========================================================================

    generateMutationTests(): string {
        return `// ============================================================================
// STRYKER MUTATION TESTING CONFIG
// ============================================================================

module.exports = {
    packageManager: 'npm',
    reporters: ['html', 'clear-text', 'progress', 'dashboard'],
    testRunner: 'jest',
    coverageAnalysis: 'perTest',
    mutate: [
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts',
    ],
    thresholds: {
        high: 80,
        low: 60,
        break: 50,
    },
    mutator: {
        plugins: ['@stryker-mutator/typescript-checker'],
        excludedMutations: [
            'StringLiteral',
            'BlockStatement',
        ],
    },
    checkers: ['typescript'],
    tsconfigFile: 'tsconfig.json',
    dashboard: {
        project: 'github.com/your-org/your-repo',
        version: 'main',
        module: 'your-module',
    },
};

// ============================================================================
// MUTATION TESTING EXAMPLE
// ============================================================================

// Original function
export function calculateDiscount(price: number, percentage: number): number {
    if (price < 0 || percentage < 0 || percentage > 100) {
        throw new Error('Invalid input');
    }
    return price - (price * percentage / 100);
}

// Mutations that should be caught:
// 1. price < 0  →  price <= 0
// 2. percentage > 100  →  percentage >= 100
// 3. price * percentage  →  price + percentage
// 4. / 100  →  * 100

// Strong test suite to kill mutations
describe('calculateDiscount', () => {
    it('calculates discount correctly', () => {
        expect(calculateDiscount(100, 10)).toBe(90);
        expect(calculateDiscount(50, 20)).toBe(40);
    });

    it('handles edge cases', () => {
        expect(calculateDiscount(100, 0)).toBe(100);
        expect(calculateDiscount(100, 100)).toBe(0);
    });

    it('validates negative price', () => {
        expect(() => calculateDiscount(-1, 10)).toThrow('Invalid input');
    });

    it('validates negative percentage', () => {
        expect(() => calculateDiscount(100, -1)).toThrow('Invalid input');
    });

    it('validates percentage over 100', () => {
        expect(() => calculateDiscount(100, 101)).toThrow('Invalid input');
    });

    it('handles boundary at 100%', () => {
        expect(() => calculateDiscount(100, 100)).not.toThrow();
    });
});
`;
    }
}

export const advancedTestingGenerator = AdvancedTestingGenerator.getInstance();
