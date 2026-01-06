/**
 * E2E Test Agent
 * Specialized agent for end-to-end testing
 * Supports Playwright, Cypress, and Puppeteer
 */

import { EventEmitter } from 'events';

export interface E2ETestOptions {
    framework: 'playwright' | 'cypress' | 'puppeteer';
    browser?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
    baseUrl: string;
    viewport?: { width: number; height: number };
    timeout?: number;
}

export interface E2ETestScenario {
    id: string;
    name: string;
    description: string;
    steps: E2ETestStep[];
    assertions: E2EAssertion[];
}

export interface E2ETestStep {
    action: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'scroll' | 'hover' | 'select';
    target?: string; // CSS selector or URL
    value?: string;
    options?: Record<string, any>;
}

export interface E2EAssertion {
    type: 'visible' | 'text' | 'url' | 'attribute' | 'count' | 'enabled' | 'checked';
    selector?: string;
    expected: any;
}

export interface E2ETestResult {
    scenarioId: string;
    passed: boolean;
    duration: number;
    steps: Array<{ step: E2ETestStep; success: boolean; error?: string }>;
    screenshots: string[];
    video?: string;
}

/**
 * E2ETestAgent
 * Generates and runs end-to-end tests
 */
export class E2ETestAgent extends EventEmitter {
    private static instance: E2ETestAgent;
    private scenarios: Map<string, E2ETestScenario> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): E2ETestAgent {
        if (!E2ETestAgent.instance) {
            E2ETestAgent.instance = new E2ETestAgent();
        }
        return E2ETestAgent.instance;
    }

    /**
     * Generate E2E test from user flow description
     */
    async generateFromDescription(description: string, options: E2ETestOptions): Promise<E2ETestScenario> {
        this.emit('generating', { description });

        // Parse description into steps
        const steps = this.parseDescriptionToSteps(description);
        const assertions = this.inferAssertions(steps);

        const scenario: E2ETestScenario = {
            id: `e2e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: this.extractScenarioName(description),
            description,
            steps,
            assertions,
        };

        this.scenarios.set(scenario.id, scenario);
        this.emit('generated', scenario);
        return scenario;
    }

    /**
     * Generate test for common flows
     */
    async generateLoginTest(options: E2ETestOptions & {
        loginUrl: string;
        usernameSelector: string;
        passwordSelector: string;
        submitSelector: string;
        successUrl?: string;
    }): Promise<E2ETestScenario> {
        const scenario: E2ETestScenario = {
            id: `e2e_login_${Date.now()}`,
            name: 'User Login Flow',
            description: 'Test successful user login',
            steps: [
                { action: 'navigate', target: options.loginUrl },
                { action: 'type', target: options.usernameSelector, value: 'testuser@example.com' },
                { action: 'type', target: options.passwordSelector, value: 'testpassword123' },
                { action: 'click', target: options.submitSelector },
                { action: 'wait', value: '2000' },
            ],
            assertions: [
                { type: 'url', expected: options.successUrl || '/dashboard' },
                { type: 'visible', selector: '.user-profile', expected: true },
            ],
        };

        this.scenarios.set(scenario.id, scenario);
        return scenario;
    }

    /**
     * Generate test for signup flow
     */
    async generateSignupTest(options: E2ETestOptions & {
        signupUrl: string;
        fields: Array<{ selector: string; value: string }>;
        submitSelector: string;
    }): Promise<E2ETestScenario> {
        const steps: E2ETestStep[] = [
            { action: 'navigate', target: options.signupUrl },
        ];

        for (const field of options.fields) {
            steps.push({ action: 'type', target: field.selector, value: field.value });
        }

        steps.push(
            { action: 'click', target: options.submitSelector },
            { action: 'wait', value: '2000' }
        );

        const scenario: E2ETestScenario = {
            id: `e2e_signup_${Date.now()}`,
            name: 'User Signup Flow',
            description: 'Test successful user registration',
            steps,
            assertions: [
                { type: 'visible', selector: '.success-message', expected: true },
            ],
        };

        this.scenarios.set(scenario.id, scenario);
        return scenario;
    }

    /**
     * Generate checkout flow test
     */
    async generateCheckoutTest(options: E2ETestOptions & {
        productUrl: string;
        addToCartSelector: string;
        checkoutSelector: string;
        paymentFields?: Array<{ selector: string; value: string }>;
    }): Promise<E2ETestScenario> {
        const steps: E2ETestStep[] = [
            { action: 'navigate', target: options.productUrl },
            { action: 'click', target: options.addToCartSelector },
            { action: 'wait', value: '1000' },
            { action: 'click', target: options.checkoutSelector },
            { action: 'wait', value: '2000' },
        ];

        if (options.paymentFields) {
            for (const field of options.paymentFields) {
                steps.push({ action: 'type', target: field.selector, value: field.value });
            }
        }

        const scenario: E2ETestScenario = {
            id: `e2e_checkout_${Date.now()}`,
            name: 'Checkout Flow',
            description: 'Test complete purchase flow',
            steps,
            assertions: [
                { type: 'visible', selector: '.order-confirmation', expected: true },
            ],
        };

        this.scenarios.set(scenario.id, scenario);
        return scenario;
    }

    /**
     * Generate Playwright test code
     */
    generatePlaywrightCode(scenario: E2ETestScenario, options: E2ETestOptions): string {
        const steps = scenario.steps.map(step => this.stepToPlaywright(step)).join('\n  ');
        const assertions = scenario.assertions.map(a => this.assertionToPlaywright(a)).join('\n  ');

        return `
import { test, expect } from '@playwright/test';

test.describe('${scenario.name}', () => {
  test('${scenario.description}', async ({ page }) => {
    // Steps
  ${steps}

    // Assertions
  ${assertions}
  });
});
`;
    }

    /**
     * Generate Cypress test code
     */
    generateCypressCode(scenario: E2ETestScenario, options: E2ETestOptions): string {
        const steps = scenario.steps.map(step => this.stepToCypress(step)).join('\n    ');
        const assertions = scenario.assertions.map(a => this.assertionToCypress(a)).join('\n    ');

        return `
describe('${scenario.name}', () => {
  it('${scenario.description}', () => {
    // Steps
    ${steps}

    // Assertions
    ${assertions}
  });
});
`;
    }

    /**
     * Get scenario by ID
     */
    getScenario(id: string): E2ETestScenario | null {
        return this.scenarios.get(id) || null;
    }

    /**
     * Get all scenarios
     */
    getAllScenarios(): E2ETestScenario[] {
        return Array.from(this.scenarios.values());
    }

    /**
     * Record user actions to generate test
     */
    startRecording(options: E2ETestOptions): string {
        const recordingId = `rec_${Date.now()}`;
        // In production, would start browser recording
        this.emit('recordingStarted', { recordingId });
        return recordingId;
    }

    // Private methods

    private parseDescriptionToSteps(description: string): E2ETestStep[] {
        const steps: E2ETestStep[] = [];
        const lines = description.toLowerCase().split('\n');

        for (const line of lines) {
            if (line.includes('go to') || line.includes('navigate') || line.includes('visit')) {
                const urlMatch = line.match(/(?:go to|navigate to|visit)\s+(.+)/i);
                if (urlMatch) {
                    steps.push({ action: 'navigate', target: urlMatch[1].trim() });
                }
            } else if (line.includes('click')) {
                const selectorMatch = line.match(/click\s+(?:on\s+)?(.+)/i);
                if (selectorMatch) {
                    steps.push({ action: 'click', target: this.textToSelector(selectorMatch[1]) });
                }
            } else if (line.includes('type') || line.includes('enter') || line.includes('fill')) {
                const typeMatch = line.match(/(?:type|enter|fill)\s+"?(.+?)"?\s+(?:in|into)\s+(.+)/i);
                if (typeMatch) {
                    steps.push({ action: 'type', target: this.textToSelector(typeMatch[2]), value: typeMatch[1] });
                }
            } else if (line.includes('wait')) {
                const waitMatch = line.match(/wait\s+(\d+)/i);
                steps.push({ action: 'wait', value: waitMatch ? waitMatch[1] : '1000' });
            } else if (line.includes('scroll')) {
                steps.push({ action: 'scroll', target: 'body' });
            }
        }

        return steps;
    }

    private inferAssertions(steps: E2ETestStep[]): E2EAssertion[] {
        const assertions: E2EAssertion[] = [];

        // Infer from navigation
        const navStep = steps.find(s => s.action === 'navigate');
        if (navStep) {
            assertions.push({ type: 'visible', selector: 'body', expected: true });
        }

        // Infer from form submissions
        const submitStep = steps.find(s => s.action === 'click' && s.target?.includes('submit'));
        if (submitStep) {
            assertions.push({ type: 'visible', selector: '.success', expected: true });
        }

        return assertions;
    }

    private textToSelector(text: string): string {
        const cleaned = text.trim().replace(/['"]/g, '');

        // Common patterns
        if (cleaned.includes('button')) return `button:has-text("${cleaned.replace('button', '').trim()}")`;
        if (cleaned.includes('link')) return `a:has-text("${cleaned.replace('link', '').trim()}")`;
        if (cleaned.includes('input')) return 'input';
        if (cleaned.includes('submit')) return '[type="submit"]';

        return `[data-testid="${cleaned}"]`;
    }

    private extractScenarioName(description: string): string {
        const firstLine = description.split('\n')[0];
        return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }

    private stepToPlaywright(step: E2ETestStep): string {
        switch (step.action) {
            case 'navigate':
                return `await page.goto('${step.target}');`;
            case 'click':
                return `await page.click('${step.target}');`;
            case 'type':
                return `await page.fill('${step.target}', '${step.value}');`;
            case 'wait':
                return `await page.waitForTimeout(${step.value});`;
            case 'screenshot':
                return `await page.screenshot({ path: '${step.value || 'screenshot.png'}' });`;
            case 'hover':
                return `await page.hover('${step.target}');`;
            default:
                return `// ${step.action}`;
        }
    }

    private stepToCypress(step: E2ETestStep): string {
        switch (step.action) {
            case 'navigate':
                return `cy.visit('${step.target}');`;
            case 'click':
                return `cy.get('${step.target}').click();`;
            case 'type':
                return `cy.get('${step.target}').type('${step.value}');`;
            case 'wait':
                return `cy.wait(${step.value});`;
            case 'screenshot':
                return `cy.screenshot('${step.value || 'screenshot'}');`;
            case 'hover':
                return `cy.get('${step.target}').trigger('mouseover');`;
            default:
                return `// ${step.action}`;
        }
    }

    private assertionToPlaywright(assertion: E2EAssertion): string {
        switch (assertion.type) {
            case 'visible':
                return `await expect(page.locator('${assertion.selector}')).toBeVisible();`;
            case 'text':
                return `await expect(page.locator('${assertion.selector}')).toHaveText('${assertion.expected}');`;
            case 'url':
                return `await expect(page).toHaveURL(/${assertion.expected}/);`;
            default:
                return `// assertion: ${assertion.type}`;
        }
    }

    private assertionToCypress(assertion: E2EAssertion): string {
        switch (assertion.type) {
            case 'visible':
                return `cy.get('${assertion.selector}').should('be.visible');`;
            case 'text':
                return `cy.get('${assertion.selector}').should('have.text', '${assertion.expected}');`;
            case 'url':
                return `cy.url().should('include', '${assertion.expected}');`;
            default:
                return `// assertion: ${assertion.type}`;
        }
    }
}

// Singleton getter
export function getE2ETestAgent(): E2ETestAgent {
    return E2ETestAgent.getInstance();
}
