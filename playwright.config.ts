import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60000,
    retries: 1,
    reporter: [['html', { open: 'never' }]],
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry'
    },
    projects: [
        {
            name: 'electron',
            testMatch: /.*\.e2e\.test\.ts/
        }
    ]
});
