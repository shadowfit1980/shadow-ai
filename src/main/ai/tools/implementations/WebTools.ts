/**
 * Web Tools
 * 
 * Tools for web interactions including URL fetching,
 * API testing, and screenshot capture.
 */

import { BaseTool, defineParameter } from '../BaseTool';
import { ToolExecutionContext, ToolExecutionResult } from '../types';
import axios from 'axios';

// ============================================================================
// URL CONTENT FETCHER
// ============================================================================

export class FetchUrlTool extends BaseTool {
    constructor() {
        super({
            name: 'fetch_url',
            description: 'Fetch content from a URL and optionally convert HTML to markdown',
            category: 'web',
            parameters: [
                defineParameter('url', 'string', 'The URL to fetch'),
                defineParameter('method', 'string', 'HTTP method', false, {
                    default: 'GET',
                    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                }),
                defineParameter('headers', 'object', 'Request headers', false),
                defineParameter('body', 'object', 'Request body for POST/PUT', false),
                defineParameter('timeout', 'number', 'Request timeout in ms', false, {
                    default: 30000,
                }),
                defineParameter('convertToMarkdown', 'boolean', 'Convert HTML to markdown', false, {
                    default: true,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Response with status, headers, and body',
            },
            examples: [
                {
                    input: { url: 'https://api.github.com/repos/user/repo' },
                    output: { status: 200, body: '{ "name": "repo" }' },
                    description: 'Fetch a GitHub API endpoint',
                },
            ],
            tags: ['web', 'http', 'fetch', 'api'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const url = params.url as string;
            const method = (params.method as string) || 'GET';
            const headers = params.headers as Record<string, string> || {};
            const body = params.body;
            const timeout = (params.timeout as number) || 30000;
            const convertToMarkdown = params.convertToMarkdown !== false;

            const response = await axios({
                method,
                url,
                headers,
                data: body,
                timeout,
                validateStatus: () => true, // Don't throw on any status
            });

            let content = response.data;

            // Convert HTML to markdown if needed
            if (convertToMarkdown && typeof content === 'string' && content.includes('<')) {
                content = this.htmlToMarkdown(content);
            }

            return this.createSuccessResult(
                {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    body: content,
                    url,
                    method,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private htmlToMarkdown(html: string): string {
        // Simple HTML to markdown conversion
        let md = html
            // Remove scripts and styles
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            // Headers
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
            // Paragraphs and breaks
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            // Lists
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<\/?[ou]l[^>]*>/gi, '\n')
            // Links
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            // Bold and italic
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            // Code
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n')
            // Remove remaining tags
            .replace(/<[^>]+>/g, '')
            // Clean up whitespace
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return md;
    }
}

// ============================================================================
// API TESTER
// ============================================================================

export class ApiTestTool extends BaseTool {
    constructor() {
        super({
            name: 'test_api',
            description: 'Test an API endpoint with request/response validation',
            category: 'web',
            parameters: [
                defineParameter('url', 'string', 'API endpoint URL'),
                defineParameter('method', 'string', 'HTTP method', false, {
                    default: 'GET',
                }),
                defineParameter('headers', 'object', 'Request headers', false),
                defineParameter('body', 'object', 'Request body', false),
                defineParameter('expectedStatus', 'number', 'Expected status code', false),
                defineParameter('expectedFields', 'array', 'Expected fields in response', false),
                defineParameter('assertions', 'array', 'JSON path assertions', false),
            ],
            returns: {
                type: 'object',
                description: 'Test results with pass/fail status',
            },
            tags: ['web', 'api', 'testing'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const url = params.url as string;
            const method = (params.method as string) || 'GET';
            const headers = params.headers as Record<string, string> || {};
            const body = params.body;
            const expectedStatus = params.expectedStatus as number | undefined;
            const expectedFields = params.expectedFields as string[] || [];
            const assertions = params.assertions as Array<{ path: string; value: any }> || [];

            const response = await axios({
                method,
                url,
                headers,
                data: body,
                timeout: 30000,
                validateStatus: () => true,
            });

            const results: Array<{ test: string; passed: boolean; message: string }> = [];

            // Check status code
            if (expectedStatus !== undefined) {
                results.push({
                    test: 'Status Code',
                    passed: response.status === expectedStatus,
                    message: response.status === expectedStatus
                        ? `✓ Status ${response.status}`
                        : `✗ Expected ${expectedStatus}, got ${response.status}`,
                });
            }

            // Check expected fields
            for (const field of expectedFields) {
                const hasField = this.hasPath(response.data, field);
                results.push({
                    test: `Field: ${field}`,
                    passed: hasField,
                    message: hasField
                        ? `✓ Field "${field}" exists`
                        : `✗ Field "${field}" missing`,
                });
            }

            // Check assertions
            for (const assertion of assertions) {
                const actualValue = this.getPath(response.data, assertion.path);
                const passed = actualValue === assertion.value;
                results.push({
                    test: `Assert: ${assertion.path}`,
                    passed,
                    message: passed
                        ? `✓ ${assertion.path} = ${JSON.stringify(assertion.value)}`
                        : `✗ Expected ${JSON.stringify(assertion.value)}, got ${JSON.stringify(actualValue)}`,
                });
            }

            const allPassed = results.every(r => r.passed);

            return this.createSuccessResult(
                {
                    passed: allPassed,
                    results,
                    response: {
                        status: response.status,
                        body: response.data,
                    },
                    duration: Date.now() - startTime,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private hasPath(obj: any, path: string): boolean {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return false;
            current = current[part];
        }
        return current !== undefined;
    }

    private getPath(obj: any, path: string): any {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }
        return current;
    }
}

// ============================================================================
// WEB SEARCH
// ============================================================================

export class WebSearchTool extends BaseTool {
    constructor() {
        super({
            name: 'web_search',
            description: 'Search the web using a search query (simulated for safety)',
            category: 'web',
            parameters: [
                defineParameter('query', 'string', 'Search query'),
                defineParameter('maxResults', 'number', 'Maximum results to return', false, {
                    default: 5,
                }),
            ],
            returns: {
                type: 'array',
                description: 'Array of search results',
            },
            tags: ['web', 'search'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const query = params.query as string;
            const maxResults = (params.maxResults as number) || 5;

            // For now, return a placeholder - in production this would use a search API
            // like Google Custom Search, Bing API, or DuckDuckGo
            const results = [
                {
                    title: `Search results for: ${query}`,
                    snippet: 'Web search functionality requires API configuration.',
                    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                },
            ];

            return this.createSuccessResult(
                {
                    query,
                    results: results.slice(0, maxResults),
                    note: 'Configure a search API (Google, Bing, or DuckDuckGo) for real results',
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}

// ============================================================================
// JSON VALIDATOR
// ============================================================================

export class ValidateJsonTool extends BaseTool {
    constructor() {
        super({
            name: 'validate_json',
            description: 'Validate JSON data against a schema or check for valid JSON',
            category: 'web',
            parameters: [
                defineParameter('json', 'string', 'JSON string to validate'),
                defineParameter('schema', 'object', 'JSON Schema to validate against', false),
            ],
            returns: {
                type: 'object',
                description: 'Validation result with parsed data or errors',
            },
            tags: ['web', 'json', 'validation'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const jsonString = params.json as string;
            const schema = params.schema as Record<string, any> | undefined;

            let parsed: any;
            try {
                parsed = JSON.parse(jsonString);
            } catch (e: any) {
                return this.createSuccessResult(
                    {
                        valid: false,
                        error: `Invalid JSON: ${e.message}`,
                        position: e.message.match(/position (\d+)/)?.[1],
                    },
                    Date.now() - startTime
                );
            }

            // If schema provided, validate against it
            if (schema) {
                const errors = this.validateSchema(parsed, schema, '');
                return this.createSuccessResult(
                    {
                        valid: errors.length === 0,
                        errors: errors.length > 0 ? errors : undefined,
                        data: parsed,
                    },
                    Date.now() - startTime
                );
            }

            return this.createSuccessResult(
                {
                    valid: true,
                    data: parsed,
                    type: Array.isArray(parsed) ? 'array' : typeof parsed,
                    size: JSON.stringify(parsed).length,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private validateSchema(data: any, schema: any, path: string): string[] {
        const errors: string[] = [];

        if (schema.type) {
            const actualType = Array.isArray(data) ? 'array' : typeof data;
            if (actualType !== schema.type) {
                errors.push(`${path || 'root'}: expected ${schema.type}, got ${actualType}`);
            }
        }

        if (schema.required && Array.isArray(schema.required)) {
            for (const field of schema.required) {
                if (data[field] === undefined) {
                    errors.push(`${path || 'root'}: missing required field "${field}"`);
                }
            }
        }

        if (schema.properties && typeof data === 'object' && !Array.isArray(data)) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (data[key] !== undefined) {
                    errors.push(...this.validateSchema(data[key], propSchema, `${path}.${key}`));
                }
            }
        }

        return errors;
    }
}

// Export all tools
export const webTools = [
    new FetchUrlTool(),
    new ApiTestTool(),
    new WebSearchTool(),
    new ValidateJsonTool(),
];
