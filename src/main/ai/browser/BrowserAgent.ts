/**
 * BrowserAgent - Devin-Level Browser Automation
 * 
 * Provides Playwright-based browser control for:
 * - Web research and documentation fetching
 * - Web app testing and interaction
 * - Screenshot and DOM analysis
 * - Form filling and navigation
 */

import { EventEmitter } from 'events';

// Playwright types (dynamically imported)
type Browser = any;
type BrowserContext = any;
type Page = any;

export interface BrowserAction {
    type: 'navigate' | 'click' | 'type' | 'screenshot' | 'extract' | 'scroll' | 'wait' | 'evaluate';
    selector?: string;
    url?: string;
    text?: string;
    timeout?: number;
    script?: string;
}

export interface BrowserResult {
    success: boolean;
    action: string;
    data?: any;
    screenshot?: string; // base64
    error?: string;
    timestamp: Date;
}

export interface PageContent {
    title: string;
    url: string;
    text: string;
    html: string;
    links: Array<{ text: string; href: string }>;
    images: Array<{ alt: string; src: string }>;
    forms: Array<{ action: string; inputs: string[] }>;
}

export interface ResearchResult {
    query: string;
    sources: Array<{
        url: string;
        title: string;
        content: string;
        relevance: number;
    }>;
    summary?: string;
    timestamp: Date;
}

/**
 * BrowserAgent provides Devin-level browser automation
 */
export class BrowserAgent extends EventEmitter {
    private static instance: BrowserAgent;
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private isInitialized: boolean = false;
    private actionHistory: BrowserResult[] = [];
    private playwright: any = null;

    private constructor() {
        super();
    }

    static getInstance(): BrowserAgent {
        if (!BrowserAgent.instance) {
            BrowserAgent.instance = new BrowserAgent();
        }
        return BrowserAgent.instance;
    }

    /**
     * Initialize the browser (lazy loading Playwright)
     */
    async initialize(options: { headless?: boolean } = {}): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Dynamically import playwright to avoid bundling issues
            this.playwright = await import('playwright');

            this.browser = await this.playwright.chromium.launch({
                headless: options.headless ?? true,
            });

            this.context = await this.browser.newContext({
                userAgent: 'ShadowAI/3.0 Browser Agent',
                viewport: { width: 1920, height: 1080 },
            });

            this.page = await this.context.newPage();
            this.isInitialized = true;

            console.log('🌐 [BrowserAgent] Initialized with Playwright');
            this.emit('initialized');

        } catch (error: any) {
            console.error('❌ [BrowserAgent] Initialization failed:', error.message);
            console.log('💡 [BrowserAgent] Install Playwright: npm install playwright && npx playwright install chromium');
            throw new Error(`Browser initialization failed: ${error.message}`);
        }
    }

    /**
     * Ensure browser is ready
     */
    private async ensureReady(): Promise<void> {
        if (!this.isInitialized || !this.page) {
            await this.initialize();
        }
    }

    /**
     * Navigate to a URL
     */
    async navigate(url: string, options: { waitFor?: 'load' | 'domcontentloaded' | 'networkidle' } = {}): Promise<BrowserResult> {
        await this.ensureReady();

        try {
            await this.page!.goto(url, {
                waitUntil: options.waitFor || 'domcontentloaded',
                timeout: 30000,
            });

            const result: BrowserResult = {
                success: true,
                action: `navigate:${url}`,
                data: { url: this.page!.url(), title: await this.page!.title() },
                timestamp: new Date(),
            };

            this.actionHistory.push(result);
            this.emit('action', result);
            return result;

        } catch (error: any) {
            const result: BrowserResult = {
                success: false,
                action: `navigate:${url}`,
                error: error.message,
                timestamp: new Date(),
            };
            this.actionHistory.push(result);
            return result;
        }
    }

    /**
     * Click on an element
     */
    async click(selector: string, options: { timeout?: number } = {}): Promise<BrowserResult> {
        await this.ensureReady();

        try {
            await this.page!.click(selector, { timeout: options.timeout || 5000 });

            const result: BrowserResult = {
                success: true,
                action: `click:${selector}`,
                timestamp: new Date(),
            };

            this.actionHistory.push(result);
            this.emit('action', result);
            return result;

        } catch (error: any) {
            const result: BrowserResult = {
                success: false,
                action: `click:${selector}`,
                error: error.message,
                timestamp: new Date(),
            };
            this.actionHistory.push(result);
            return result;
        }
    }

    /**
     * Type into an input field
     */
    async type(selector: string, text: string, options: { delay?: number } = {}): Promise<BrowserResult> {
        await this.ensureReady();

        try {
            await this.page!.fill(selector, text);

            const result: BrowserResult = {
                success: true,
                action: `type:${selector}`,
                data: { text: text.substring(0, 50) + (text.length > 50 ? '...' : '') },
                timestamp: new Date(),
            };

            this.actionHistory.push(result);
            this.emit('action', result);
            return result;

        } catch (error: any) {
            const result: BrowserResult = {
                success: false,
                action: `type:${selector}`,
                error: error.message,
                timestamp: new Date(),
            };
            this.actionHistory.push(result);
            return result;
        }
    }

    /**
     * Take a screenshot
     */
    async screenshot(options: { fullPage?: boolean; selector?: string } = {}): Promise<BrowserResult> {
        await this.ensureReady();

        try {
            let screenshotBuffer: Buffer;

            if (options.selector) {
                const element = await this.page!.$(options.selector);
                screenshotBuffer = await element.screenshot();
            } else {
                screenshotBuffer = await this.page!.screenshot({
                    fullPage: options.fullPage ?? false,
                });
            }

            const result: BrowserResult = {
                success: true,
                action: 'screenshot',
                screenshot: screenshotBuffer.toString('base64'),
                data: { size: screenshotBuffer.length },
                timestamp: new Date(),
            };

            this.actionHistory.push(result);
            this.emit('action', result);
            return result;

        } catch (error: any) {
            const result: BrowserResult = {
                success: false,
                action: 'screenshot',
                error: error.message,
                timestamp: new Date(),
            };
            this.actionHistory.push(result);
            return result;
        }
    }

    /**
     * Extract content from the current page
     */
    async extractContent(options: { selector?: string } = {}): Promise<PageContent> {
        await this.ensureReady();

        try {
            const content = await this.page!.evaluate((selector: string | undefined) => {
                const root = (selector ? document.querySelector(selector) : document.body) as HTMLElement;
                if (!root) return null;

                // Extract text content
                const text = root.innerText || root.textContent || '';

                // Extract links
                const links = Array.from(root.querySelectorAll('a[href]'))
                    .slice(0, 50)
                    .map((a: any) => ({
                        text: a.innerText?.trim().substring(0, 100) || '',
                        href: a.href,
                    }));

                // Extract images
                const images = Array.from(root.querySelectorAll('img'))
                    .slice(0, 20)
                    .map((img: any) => ({
                        alt: img.alt || '',
                        src: img.src,
                    }));

                // Extract forms
                const forms = Array.from(root.querySelectorAll('form'))
                    .slice(0, 10)
                    .map((form: any) => ({
                        action: form.action || '',
                        inputs: Array.from(form.querySelectorAll('input, textarea, select'))
                            .map((input: any) => input.name || input.type || 'input'),
                    }));

                return {
                    html: root.innerHTML.substring(0, 50000), // Limit HTML size
                    text: text.substring(0, 30000),
                    links,
                    images,
                    forms,
                };
            }, options.selector);

            if (!content) {
                throw new Error('Could not extract content');
            }

            return {
                title: await this.page!.title(),
                url: this.page!.url(),
                ...content,
            };

        } catch (error: any) {
            throw new Error(`Content extraction failed: ${error.message}`);
        }
    }

    /**
     * Wait for an element or condition
     */
    async wait(options: { selector?: string; timeout?: number; text?: string }): Promise<BrowserResult> {
        await this.ensureReady();

        try {
            if (options.selector) {
                await this.page!.waitForSelector(options.selector, {
                    timeout: options.timeout || 10000,
                });
            } else if (options.text) {
                await this.page!.waitForFunction(
                    (text: string) => document.body.innerText.includes(text),
                    options.text,
                    { timeout: options.timeout || 10000 }
                );
            } else {
                await this.page!.waitForTimeout(options.timeout || 1000);
            }

            const result: BrowserResult = {
                success: true,
                action: `wait:${options.selector || options.text || options.timeout}`,
                timestamp: new Date(),
            };

            this.actionHistory.push(result);
            return result;

        } catch (error: any) {
            const result: BrowserResult = {
                success: false,
                action: `wait:${options.selector || options.text || options.timeout}`,
                error: error.message,
                timestamp: new Date(),
            };
            this.actionHistory.push(result);
            return result;
        }
    }

    /**
     * Execute JavaScript in the page context
     */
    async evaluate<T>(script: string): Promise<T> {
        await this.ensureReady();
        return await this.page!.evaluate(new Function(`return ${script}`)());
    }

    /**
     * Scroll the page
     */
    async scroll(options: { direction?: 'down' | 'up'; amount?: number; toElement?: string } = {}): Promise<BrowserResult> {
        await this.ensureReady();

        try {
            if (options.toElement) {
                await this.page!.$eval(options.toElement, (el: any) => el.scrollIntoView());
            } else {
                const direction = options.direction === 'up' ? -1 : 1;
                const amount = options.amount || 500;
                await this.page!.evaluate((dist: number) => window.scrollBy(0, dist), direction * amount);
            }

            const result: BrowserResult = {
                success: true,
                action: `scroll:${options.direction || 'down'}`,
                timestamp: new Date(),
            };

            this.actionHistory.push(result);
            return result;

        } catch (error: any) {
            const result: BrowserResult = {
                success: false,
                action: `scroll`,
                error: error.message,
                timestamp: new Date(),
            };
            this.actionHistory.push(result);
            return result;
        }
    }

    /**
     * Research a topic by visiting multiple pages
     */
    async research(query: string, options: { maxPages?: number } = {}): Promise<ResearchResult> {
        await this.ensureReady();
        const maxPages = options.maxPages || 3;
        const sources: ResearchResult['sources'] = [];

        console.log(`🔍 [BrowserAgent] Researching: ${query}`);

        // Search Google
        await this.navigate(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

        // Extract search results
        const searchContent = await this.extractContent();

        // Visit top results
        const relevantLinks = searchContent.links
            .filter(link => !link.href.includes('google.com'))
            .slice(0, maxPages);

        for (const link of relevantLinks) {
            try {
                await this.navigate(link.href);
                const content = await this.extractContent();

                sources.push({
                    url: link.href,
                    title: content.title,
                    content: content.text.substring(0, 5000),
                    relevance: this.calculateRelevance(content.text, query),
                });

                this.emit('researchProgress', { completed: sources.length, total: relevantLinks.length });
            } catch (error) {
                console.warn(`Failed to fetch ${link.href}:`, error);
            }
        }

        // Sort by relevance
        sources.sort((a, b) => b.relevance - a.relevance);

        const result: ResearchResult = {
            query,
            sources,
            timestamp: new Date(),
        };

        this.emit('researchComplete', result);
        return result;
    }

    /**
     * Calculate relevance score based on keyword matches
     */
    private calculateRelevance(text: string, query: string): number {
        const keywords = query.toLowerCase().split(/\s+/);
        const textLower = text.toLowerCase();

        let matches = 0;
        for (const keyword of keywords) {
            const count = (textLower.match(new RegExp(keyword, 'g')) || []).length;
            matches += Math.min(count, 10); // Cap at 10 per keyword
        }

        return matches / keywords.length;
    }

    /**
     * Fill out a form
     */
    async fillForm(formSelector: string, data: Record<string, string>): Promise<BrowserResult> {
        await this.ensureReady();

        try {
            for (const [name, value] of Object.entries(data)) {
                const selector = `${formSelector} [name="${name}"], ${formSelector} #${name}`;
                await this.type(selector, value);
            }

            const result: BrowserResult = {
                success: true,
                action: `fillForm:${formSelector}`,
                data: { fieldsCount: Object.keys(data).length },
                timestamp: new Date(),
            };

            this.actionHistory.push(result);
            return result;

        } catch (error: any) {
            const result: BrowserResult = {
                success: false,
                action: `fillForm:${formSelector}`,
                error: error.message,
                timestamp: new Date(),
            };
            this.actionHistory.push(result);
            return result;
        }
    }

    /**
     * Get the current page URL and title
     */
    async getCurrentPage(): Promise<{ url: string; title: string } | null> {
        if (!this.page) return null;

        return {
            url: this.page.url(),
            title: await this.page.title(),
        };
    }

    /**
     * Execute a sequence of actions
     */
    async executeActions(actions: BrowserAction[]): Promise<BrowserResult[]> {
        const results: BrowserResult[] = [];

        for (const action of actions) {
            let result: BrowserResult;

            switch (action.type) {
                case 'navigate':
                    result = await this.navigate(action.url!);
                    break;
                case 'click':
                    result = await this.click(action.selector!);
                    break;
                case 'type':
                    result = await this.type(action.selector!, action.text!);
                    break;
                case 'screenshot':
                    result = await this.screenshot({ selector: action.selector });
                    break;
                case 'scroll':
                    result = await this.scroll({ toElement: action.selector });
                    break;
                case 'wait':
                    result = await this.wait({ selector: action.selector, timeout: action.timeout });
                    break;
                case 'evaluate':
                    try {
                        const data = await this.evaluate(action.script!);
                        result = { success: true, action: 'evaluate', data, timestamp: new Date() };
                    } catch (error: any) {
                        result = { success: false, action: 'evaluate', error: error.message, timestamp: new Date() };
                    }
                    break;
                default:
                    result = { success: false, action: 'unknown', error: `Unknown action: ${action.type}`, timestamp: new Date() };
            }

            results.push(result);

            if (!result.success) {
                console.warn(`Action failed: ${result.action} - ${result.error}`);
            }
        }

        return results;
    }

    /**
     * Get action history
     */
    getActionHistory(): BrowserResult[] {
        return [...this.actionHistory];
    }

    /**
     * Clear action history
     */
    clearHistory(): void {
        this.actionHistory = [];
    }

    /**
     * Check if browser is initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Close the browser
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            this.isInitialized = false;
            console.log('🌐 [BrowserAgent] Browser closed');
            this.emit('closed');
        }
    }
}

export default BrowserAgent;
