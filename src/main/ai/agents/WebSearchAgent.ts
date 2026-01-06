/**
 * WebSearchAgent - Real-time Web Search Capability
 * 
 * Provides online search during conversations:
 * - Brave Search API (primary)
 * - DuckDuckGo fallback
 * - Query optimization
 * - Result summarization
 * - Rate limiting
 */

import { EventEmitter } from 'events';
import * as https from 'https';
import * as http from 'http';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResult {
    title: string;
    url: string;
    description: string;
    publishedAt?: string;
    source?: string;
    thumbnail?: string;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    totalResults: number;
    searchTime: number;
    source: 'brave' | 'duckduckgo' | 'cache';
    summary?: string;
}

export interface SearchOptions {
    count?: number;
    offset?: number;
    freshness?: 'day' | 'week' | 'month' | 'year';
    safesearch?: 'strict' | 'moderate' | 'off';
    type?: 'web' | 'news' | 'images';
    summarize?: boolean;
}

interface CacheEntry {
    response: SearchResponse;
    timestamp: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    braveApiKey: process.env.BRAVE_SEARCH_API_KEY || '',
    braveEndpoint: 'https://api.search.brave.com/res/v1/web/search',
    braveNewsEndpoint: 'https://api.search.brave.com/res/v1/news/search',
    braveImagesEndpoint: 'https://api.search.brave.com/res/v1/images/search',
    cacheMaxAge: 5 * 60 * 1000,  // 5 minutes
    rateLimitPerMinute: 60,
    defaultResultCount: 10,
    maxResultCount: 20
};

// ============================================================================
// WEB SEARCH AGENT
// ============================================================================

export class WebSearchAgent extends EventEmitter {
    private cache: Map<string, CacheEntry> = new Map();
    private requestCount: number = 0;
    private lastRateLimitReset: number = Date.now();

    constructor() {
        super();
        console.log('[WebSearchAgent] Initialized');
    }

    /**
     * Search the web
     */
    async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey(query, options);

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CONFIG.cacheMaxAge) {
            console.log(`[WebSearchAgent] Cache hit for: ${query}`);
            return { ...cached.response, source: 'cache' };
        }

        // Rate limiting
        this.checkRateLimit();

        // Optimize query
        const optimizedQuery = this.optimizeQuery(query);

        let response: SearchResponse;

        // Try Brave Search first
        if (CONFIG.braveApiKey) {
            try {
                response = await this.searchBrave(optimizedQuery, options);
            } catch (error) {
                console.warn('[WebSearchAgent] Brave Search failed, trying fallback:', error);
                response = await this.searchDuckDuckGo(optimizedQuery, options);
            }
        } else {
            response = await this.searchDuckDuckGo(optimizedQuery, options);
        }

        response.searchTime = Date.now() - startTime;

        // Generate summary if requested
        if (options.summarize && response.results.length > 0) {
            response.summary = this.generateSummary(response.results);
        }

        // Cache result
        this.cache.set(cacheKey, { response, timestamp: Date.now() });

        this.emit('search', { query, results: response.results.length });
        return response;
    }

    /**
     * Search news
     */
    async searchNews(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
        return this.search(query, { ...options, type: 'news' });
    }

    /**
     * Search images
     */
    async searchImages(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
        return this.search(query, { ...options, type: 'images' });
    }

    /**
     * Search with Brave Search API
     */
    private async searchBrave(query: string, options: SearchOptions): Promise<SearchResponse> {
        const count = Math.min(options.count || CONFIG.defaultResultCount, CONFIG.maxResultCount);

        let endpoint = CONFIG.braveEndpoint;
        if (options.type === 'news') endpoint = CONFIG.braveNewsEndpoint;
        if (options.type === 'images') endpoint = CONFIG.braveImagesEndpoint;

        const params = new URLSearchParams({
            q: query,
            count: count.toString(),
            offset: (options.offset || 0).toString(),
            safesearch: options.safesearch || 'moderate'
        });

        if (options.freshness) {
            params.set('freshness', options.freshness);
        }

        const url = `${endpoint}?${params.toString()}`;

        const data = await this.httpGet(url, {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': CONFIG.braveApiKey
        });

        const json = JSON.parse(data);
        const webResults = json.web?.results || json.results || [];

        return {
            query,
            results: webResults.map((r: any) => ({
                title: r.title,
                url: r.url,
                description: r.description || r.snippet || '',
                publishedAt: r.age || r.published_time,
                source: r.meta_url?.hostname || new URL(r.url).hostname,
                thumbnail: r.thumbnail?.src
            })),
            totalResults: json.query?.total || webResults.length,
            searchTime: 0,
            source: 'brave'
        };
    }

    /**
     * Fallback to DuckDuckGo
     */
    private async searchDuckDuckGo(query: string, options: SearchOptions): Promise<SearchResponse> {
        const count = options.count || CONFIG.defaultResultCount;

        // DuckDuckGo HTML API (scraping)
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

        const html = await this.httpGet(url, {
            'User-Agent': 'Mozilla/5.0 (compatible; ShadowAI/1.0)'
        });

        // Parse results from HTML
        const results = this.parseDuckDuckGoResults(html, count);

        return {
            query,
            results,
            totalResults: results.length,
            searchTime: 0,
            source: 'duckduckgo'
        };
    }

    /**
     * Parse DuckDuckGo HTML results
     */
    private parseDuckDuckGoResults(html: string, limit: number): SearchResult[] {
        const results: SearchResult[] = [];

        // Simple regex-based parsing for result blocks
        const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/gi;

        let match;
        while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
            const url = this.extractDuckDuckGoUrl(match[1]);
            if (url && url.startsWith('http')) {
                results.push({
                    title: this.decodeHtml(match[2]),
                    url,
                    description: this.decodeHtml(match[3]),
                    source: new URL(url).hostname
                });
            }
        }

        // Alternative simpler parsing if regex fails
        if (results.length === 0) {
            const titleMatches = html.match(/class="result__a"[^>]*>([^<]+)</g) || [];
            const urlMatches = html.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^&]+)&/g) || [];

            for (let i = 0; i < Math.min(titleMatches.length, urlMatches.length, limit); i++) {
                const title = titleMatches[i]?.replace(/class="result__a"[^>]*>/, '').replace(/</, '') || '';
                const encodedUrl = urlMatches[i]?.match(/uddg=([^&]+)/)?.[1] || '';
                const url = decodeURIComponent(encodedUrl);

                if (url && url.startsWith('http')) {
                    results.push({
                        title: this.decodeHtml(title),
                        url,
                        description: '',
                        source: new URL(url).hostname
                    });
                }
            }
        }

        return results;
    }

    /**
     * Extract actual URL from DuckDuckGo redirect
     */
    private extractDuckDuckGoUrl(href: string): string {
        if (href.includes('uddg=')) {
            const match = href.match(/uddg=([^&]+)/);
            if (match) {
                return decodeURIComponent(match[1]);
            }
        }
        return href;
    }

    /**
     * Decode HTML entities
     */
    private decodeHtml(text: string): string {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .trim();
    }

    /**
     * Optimize query for better results
     */
    private optimizeQuery(query: string): string {
        // Remove common filler words for better search
        let optimized = query
            .replace(/\b(can you|please|i want to|how do i|what is|tell me about)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Keep original if too short after optimization
        if (optimized.length < 3) {
            optimized = query;
        }

        return optimized;
    }

    /**
     * Generate summary from results
     */
    private generateSummary(results: SearchResult[]): string {
        if (results.length === 0) return '';

        const topResults = results.slice(0, 3);
        const summary = topResults
            .map((r, i) => `${i + 1}. **${r.title}** (${r.source}): ${r.description.substring(0, 150)}...`)
            .join('\n\n');

        return `## Search Summary\n\n${summary}`;
    }

    /**
     * HTTP GET request
     */
    private httpGet(url: string, headers: Record<string, string>): Promise<string> {
        return new Promise((resolve, reject) => {
            const lib = url.startsWith('https') ? https : http;

            const req = lib.get(url, { headers }, (res) => {
                let data = '';

                // Handle gzip if needed
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    /**
     * Check and enforce rate limiting
     */
    private checkRateLimit(): void {
        const now = Date.now();

        // Reset counter every minute
        if (now - this.lastRateLimitReset > 60000) {
            this.requestCount = 0;
            this.lastRateLimitReset = now;
        }

        if (this.requestCount >= CONFIG.rateLimitPerMinute) {
            throw new Error('Rate limit exceeded. Please wait a moment.');
        }

        this.requestCount++;
    }

    /**
     * Get cache key
     */
    private getCacheKey(query: string, options: SearchOptions): string {
        return `${query}:${options.type || 'web'}:${options.count || 10}:${options.freshness || ''}`;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get statistics
     */
    getStats(): {
        cacheSize: number;
        requestsThisMinute: number;
        hasApiKey: boolean;
    } {
        return {
            cacheSize: this.cache.size,
            requestsThisMinute: this.requestCount,
            hasApiKey: !!CONFIG.braveApiKey
        };
    }
}

// Singleton export
export const webSearchAgent = new WebSearchAgent();
