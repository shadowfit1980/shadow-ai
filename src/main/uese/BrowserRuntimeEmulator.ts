/**
 * UESE Browser Runtime Emulator
 * 
 * Full browser simulation including DOM, JavaScript engine,
 * rendering pipeline, and Web APIs.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type BrowserEngine = 'chromium' | 'webkit' | 'gecko';
export type RenderMode = 'full' | 'layout-only' | 'none';

export interface BrowserProfile {
    name: string;
    engine: BrowserEngine;
    version: string;
    userAgent: string;
    viewport: { width: number; height: number };
    devicePixelRatio: number;
    features: string[];
}

export interface DOMNode {
    id: string;
    tagName: string;
    attributes: Map<string, string>;
    children: DOMNode[];
    parentId: string | null;
    textContent: string;
    style: Record<string, string>;
    computedStyle: Record<string, string>;
    boundingBox: { x: number; y: number; width: number; height: number };
}

export interface DOMDocument {
    id: string;
    url: string;
    html: string;
    rootNode: DOMNode | null;
    scripts: ScriptElement[];
    stylesheets: StylesheetElement[];
    cookies: Map<string, string>;
    localStorage: Map<string, string>;
    sessionStorage: Map<string, string>;
}

export interface ScriptElement {
    id: string;
    src?: string;
    content: string;
    type: 'module' | 'classic';
    async: boolean;
    defer: boolean;
}

export interface StylesheetElement {
    id: string;
    href?: string;
    content: string;
    media: string;
}

export interface RenderFrame {
    timestamp: number;
    elements: number;
    paintTime: number;
    layoutTime: number;
    compositeTime: number;
}

export interface WebAPIRequest {
    api: string;
    method: string;
    args: any[];
    timestamp: number;
}

export interface BrowserEvent {
    type: string;
    target: string;
    data: any;
    timestamp: number;
}

// ============================================================================
// BROWSER PROFILES
// ============================================================================

const BROWSER_PROFILES: Record<string, BrowserProfile> = {
    'chrome-120': {
        name: 'Chrome',
        engine: 'chromium',
        version: '120.0.0',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        devicePixelRatio: 2,
        features: ['webgpu', 'webrtc', 'serviceworker', 'wasm', 'modules']
    },
    'safari-17': {
        name: 'Safari',
        engine: 'webkit',
        version: '17.0',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        viewport: { width: 1920, height: 1080 },
        devicePixelRatio: 2,
        features: ['webrtc', 'serviceworker', 'wasm', 'modules']
    },
    'firefox-120': {
        name: 'Firefox',
        engine: 'gecko',
        version: '120.0',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
        viewport: { width: 1920, height: 1080 },
        devicePixelRatio: 1,
        features: ['webrtc', 'serviceworker', 'wasm', 'modules']
    },
    'mobile-chrome': {
        name: 'Chrome Mobile',
        engine: 'chromium',
        version: '120.0.0',
        userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        viewport: { width: 390, height: 844 },
        devicePixelRatio: 3,
        features: ['webrtc', 'serviceworker', 'wasm', 'touch']
    },
    'mobile-safari': {
        name: 'Safari Mobile',
        engine: 'webkit',
        version: '17.0',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        devicePixelRatio: 3,
        features: ['serviceworker', 'wasm', 'touch']
    }
};

// ============================================================================
// BROWSER RUNTIME EMULATOR
// ============================================================================

export class BrowserRuntimeEmulator extends EventEmitter {
    private static instance: BrowserRuntimeEmulator;
    private currentProfile: BrowserProfile;
    private documents: Map<string, DOMDocument> = new Map();
    private activeDocumentId: string | null = null;
    private eventLoop: BrowserEvent[] = [];
    private webAPICalls: WebAPIRequest[] = [];
    private renderFrames: RenderFrame[] = [];
    private isRunning: boolean = false;

    private constructor() {
        super();
        this.currentProfile = BROWSER_PROFILES['chrome-120'];
        console.log('🌐 Browser Runtime Emulator initialized');
    }

    static getInstance(): BrowserRuntimeEmulator {
        if (!BrowserRuntimeEmulator.instance) {
            BrowserRuntimeEmulator.instance = new BrowserRuntimeEmulator();
        }
        return BrowserRuntimeEmulator.instance;
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    setProfile(profileName: string): boolean {
        if (BROWSER_PROFILES[profileName]) {
            this.currentProfile = BROWSER_PROFILES[profileName];
            this.emit('profile-changed', this.currentProfile);
            return true;
        }
        return false;
    }

    getProfile(): BrowserProfile {
        return { ...this.currentProfile };
    }

    getAvailableProfiles(): string[] {
        return Object.keys(BROWSER_PROFILES);
    }

    setViewport(width: number, height: number): void {
        this.currentProfile.viewport = { width, height };
        this.emit('viewport-changed', this.currentProfile.viewport);
    }

    // ========================================================================
    // DOCUMENT MANAGEMENT
    // ========================================================================

    createDocument(url: string, html: string): DOMDocument {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const document: DOMDocument = {
            id,
            url,
            html,
            rootNode: this.parseHTML(html),
            scripts: this.extractScripts(html),
            stylesheets: this.extractStylesheets(html),
            cookies: new Map(),
            localStorage: new Map(),
            sessionStorage: new Map()
        };

        this.documents.set(id, document);
        this.activeDocumentId = id;
        this.emit('document-created', document);

        return document;
    }

    loadURL(url: string): Promise<DOMDocument> {
        // Simulate network request
        return new Promise((resolve) => {
            setTimeout(() => {
                const html = `<!DOCTYPE html><html><head><title>Loaded: ${url}</title></head><body></body></html>`;
                resolve(this.createDocument(url, html));
            }, 100);
        });
    }

    getActiveDocument(): DOMDocument | null {
        if (this.activeDocumentId) {
            return this.documents.get(this.activeDocumentId) || null;
        }
        return null;
    }

    // ========================================================================
    // DOM PARSING & MANIPULATION
    // ========================================================================

    private parseHTML(html: string): DOMNode {
        // Simplified HTML parser
        const root: DOMNode = {
            id: 'root',
            tagName: 'html',
            attributes: new Map(),
            children: [],
            parentId: null,
            textContent: '',
            style: {},
            computedStyle: {},
            boundingBox: { x: 0, y: 0, width: this.currentProfile.viewport.width, height: this.currentProfile.viewport.height }
        };

        // Extract body content (simplified)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            const bodyNode: DOMNode = {
                id: 'body',
                tagName: 'body',
                attributes: new Map(),
                children: [],
                parentId: 'root',
                textContent: bodyMatch[1].replace(/<[^>]*>/g, '').trim(),
                style: {},
                computedStyle: {},
                boundingBox: { x: 0, y: 0, width: this.currentProfile.viewport.width, height: this.currentProfile.viewport.height }
            };
            root.children.push(bodyNode);
        }

        return root;
    }

    private extractScripts(html: string): ScriptElement[] {
        const scripts: ScriptElement[] = [];
        const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
        let match;

        while ((match = scriptRegex.exec(html)) !== null) {
            const attrs = match[1];
            const content = match[2];
            const srcMatch = attrs.match(/src=["']([^"']+)["']/);

            scripts.push({
                id: `script_${scripts.length}`,
                src: srcMatch ? srcMatch[1] : undefined,
                content,
                type: attrs.includes('type="module"') ? 'module' : 'classic',
                async: attrs.includes('async'),
                defer: attrs.includes('defer')
            });
        }

        return scripts;
    }

    private extractStylesheets(html: string): StylesheetElement[] {
        const stylesheets: StylesheetElement[] = [];

        // Extract <link> stylesheets
        const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            const hrefMatch = match[0].match(/href=["']([^"']+)["']/);
            if (hrefMatch) {
                stylesheets.push({
                    id: `link_${stylesheets.length}`,
                    href: hrefMatch[1],
                    content: '',
                    media: 'all'
                });
            }
        }

        // Extract <style> elements
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        while ((match = styleRegex.exec(html)) !== null) {
            stylesheets.push({
                id: `style_${stylesheets.length}`,
                content: match[1],
                media: 'all'
            });
        }

        return stylesheets;
    }

    querySelector(selector: string): DOMNode | null {
        const doc = this.getActiveDocument();
        if (!doc || !doc.rootNode) return null;
        return this.findNode(doc.rootNode, selector);
    }

    private findNode(node: DOMNode, selector: string): DOMNode | null {
        // Simplified selector matching
        if (selector.startsWith('#') && node.attributes.get('id') === selector.slice(1)) {
            return node;
        }
        if (selector.startsWith('.') && node.attributes.get('class')?.includes(selector.slice(1))) {
            return node;
        }
        if (node.tagName.toLowerCase() === selector.toLowerCase()) {
            return node;
        }

        for (const child of node.children) {
            const found = this.findNode(child, selector);
            if (found) return found;
        }

        return null;
    }

    // ========================================================================
    // JAVASCRIPT EXECUTION
    // ========================================================================

    executeScript(code: string, context: Record<string, any> = {}): any {
        const doc = this.getActiveDocument();

        // Create browser globals
        const browserGlobals = {
            document: this.createDocumentProxy(doc),
            window: this.createWindowProxy(),
            navigator: {
                userAgent: this.currentProfile.userAgent,
                language: 'en-US',
                languages: ['en-US', 'en'],
                platform: 'MacIntel',
                cookieEnabled: true,
                onLine: true
            },
            location: {
                href: doc?.url || 'about:blank',
                protocol: 'https:',
                host: 'localhost',
                pathname: '/',
                search: '',
                hash: ''
            },
            localStorage: this.createStorageProxy(doc?.localStorage || new Map()),
            sessionStorage: this.createStorageProxy(doc?.sessionStorage || new Map()),
            console: {
                log: (...args: any[]) => this.emit('console', { level: 'log', args }),
                error: (...args: any[]) => this.emit('console', { level: 'error', args }),
                warn: (...args: any[]) => this.emit('console', { level: 'warn', args }),
                info: (...args: any[]) => this.emit('console', { level: 'info', args })
            },
            fetch: (url: string, options?: any) => this.simulateFetch(url, options),
            setTimeout: (fn: Function, delay: number) => this.scheduleTimeout(fn, delay),
            setInterval: (fn: Function, interval: number) => this.scheduleInterval(fn, interval),
            requestAnimationFrame: (fn: Function) => this.scheduleAnimationFrame(fn),
            ...context
        };

        try {
            const wrapper = new Function(...Object.keys(browserGlobals), code);
            return wrapper(...Object.values(browserGlobals));
        } catch (error) {
            this.emit('script-error', { error, code });
            throw error;
        }
    }

    private createDocumentProxy(doc: DOMDocument | null): any {
        return {
            getElementById: (id: string) => this.querySelector(`#${id}`),
            querySelector: (selector: string) => this.querySelector(selector),
            querySelectorAll: (selector: string) => [this.querySelector(selector)].filter(Boolean),
            createElement: (tag: string) => ({
                tagName: tag.toUpperCase(),
                attributes: new Map(),
                children: [],
                style: {},
                textContent: ''
            }),
            body: doc?.rootNode?.children[0],
            title: doc?.url || '',
            cookie: '',
            readyState: 'complete'
        };
    }

    private createWindowProxy(): any {
        return {
            innerWidth: this.currentProfile.viewport.width,
            innerHeight: this.currentProfile.viewport.height,
            devicePixelRatio: this.currentProfile.devicePixelRatio,
            scrollX: 0,
            scrollY: 0,
            addEventListener: (type: string, handler: Function) => {
                this.on(`window:${type}`, handler as any);
            },
            removeEventListener: (type: string, handler: Function) => {
                this.off(`window:${type}`, handler as any);
            }
        };
    }

    private createStorageProxy(storage: Map<string, string>): any {
        return {
            getItem: (key: string) => storage.get(key) || null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
            clear: () => storage.clear(),
            get length() { return storage.size; }
        };
    }

    // ========================================================================
    // WEB APIs SIMULATION
    // ========================================================================

    private async simulateFetch(url: string, options?: any): Promise<any> {
        this.webAPICalls.push({
            api: 'fetch',
            method: options?.method || 'GET',
            args: [url, options],
            timestamp: Date.now()
        });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));

        return {
            ok: true,
            status: 200,
            json: async () => ({}),
            text: async () => '',
            headers: new Map()
        };
    }

    private scheduleTimeout(fn: Function, delay: number): number {
        const id = Date.now();
        setTimeout(() => {
            this.eventLoop.push({
                type: 'timeout',
                target: String(id),
                data: fn,
                timestamp: Date.now()
            });
            fn();
        }, delay);
        return id;
    }

    private scheduleInterval(fn: Function, interval: number): number {
        return setInterval(fn, interval) as unknown as number;
    }

    private scheduleAnimationFrame(fn: Function): number {
        return this.scheduleTimeout(fn, 16); // ~60fps
    }

    // ========================================================================
    // RENDERING PIPELINE
    // ========================================================================

    render(): RenderFrame {
        const startTime = performance.now();
        const doc = this.getActiveDocument();

        const layoutStart = performance.now();
        // Simulate layout calculation
        const elements = doc?.rootNode ? this.countNodes(doc.rootNode) : 0;
        const layoutTime = performance.now() - layoutStart;

        const paintStart = performance.now();
        // Simulate paint
        const paintTime = performance.now() - paintStart;

        const compositeStart = performance.now();
        // Simulate compositing
        const compositeTime = performance.now() - compositeStart;

        const frame: RenderFrame = {
            timestamp: Date.now(),
            elements,
            layoutTime,
            paintTime,
            compositeTime
        };

        this.renderFrames.push(frame);
        this.emit('frame-rendered', frame);

        return frame;
    }

    private countNodes(node: DOMNode): number {
        let count = 1;
        for (const child of node.children) {
            count += this.countNodes(child);
        }
        return count;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    getWebAPICalls(): WebAPIRequest[] {
        return [...this.webAPICalls];
    }

    getRenderFrames(): RenderFrame[] {
        return [...this.renderFrames];
    }

    clearHistory(): void {
        this.webAPICalls = [];
        this.renderFrames = [];
        this.eventLoop = [];
    }
}

export const browserRuntime = BrowserRuntimeEmulator.getInstance();
