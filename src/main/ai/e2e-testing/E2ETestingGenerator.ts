// E2E Testing Generator - Generate end-to-end tests
import Anthropic from '@anthropic-ai/sdk';

interface E2ETestConfig {
    baseUrl: string;
    pages: Array<{ name: string; path: string; elements?: string[] }>;
}

class E2ETestingGenerator {
    private anthropic: Anthropic | null = null;

    generatePlaywrightConfig(): string {
        return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'mobile', use: { ...devices['iPhone 13'] } },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
    },
});
`;
    }

    generatePlaywrightTests(config: E2ETestConfig): string {
        return `import { test, expect } from '@playwright/test';

test.describe('E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

${config.pages.map(p => `
    test.describe('${p.name}', () => {
        test('should load ${p.path}', async ({ page }) => {
            await page.goto('${p.path}');
            await expect(page).toHaveURL(/${p.path.replace(/\//g, '\\/')}/);
        });

        test('should have correct title', async ({ page }) => {
            await page.goto('${p.path}');
            await expect(page).toHaveTitle(/.+/);
        });
${p.elements?.map(el => `
        test('should have ${el} element', async ({ page }) => {
            await page.goto('${p.path}');
            await expect(page.locator('${el}')).toBeVisible();
        });
`).join('') || ''}
    });
`).join('')}
});
`;
    }

    generateCypressConfig(): string {
        return `import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: true,
        screenshotOnRunFailure: true,
        retries: { runMode: 2, openMode: 0 },
    },
    component: {
        devServer: { framework: 'react', bundler: 'vite' },
    },
});
`;
    }

    generateCypressTests(config: E2ETestConfig): string {
        return `describe('E2E Tests', () => {
${config.pages.map(p => `
    describe('${p.name}', () => {
        beforeEach(() => {
            cy.visit('${p.path}');
        });

        it('should load correctly', () => {
            cy.url().should('include', '${p.path}');
        });

        it('should have correct title', () => {
            cy.title().should('not.be.empty');
        });
${p.elements?.map(el => `
        it('should display ${el}', () => {
            cy.get('${el}').should('be.visible');
        });
`).join('') || ''}
    });
`).join('')}
});
`;
    }

    generateCypressCommands(): string {
        return `// Custom Cypress Commands
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.session([email, password], () => {
        cy.visit('/login');
        cy.get('[data-cy=email]').type(email);
        cy.get('[data-cy=password]').type(password);
        cy.get('[data-cy=submit]').click();
        cy.url().should('include', '/dashboard');
    });
});

Cypress.Commands.add('logout', () => {
    cy.get('[data-cy=logout]').click();
    cy.url().should('include', '/login');
});

declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password: string): Chainable<void>;
            logout(): Chainable<void>;
        }
    }
}

export {};
`;
    }
}

export const e2eTestingGenerator = new E2ETestingGenerator();
