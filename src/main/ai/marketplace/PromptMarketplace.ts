/**
 * Prompt Marketplace
 * 
 * Community platform for sharing, buying, and selling prompt templates.
 * AI-refined versions emerge from community usage patterns.
 */

import { EventEmitter } from 'events';

export interface MarketplacePrompt {
    id: string;
    title: string;
    description: string;
    category: PromptCategory;
    prompt: string;
    variables: string[];
    author: AuthorInfo;
    pricing: PricingInfo;
    stats: PromptStats;
    versions: PromptVersion[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export type PromptCategory =
    | 'code_generation'
    | 'debugging'
    | 'documentation'
    | 'testing'
    | 'refactoring'
    | 'design'
    | 'learning'
    | 'automation'
    | 'creative'
    | 'analysis';

export interface AuthorInfo {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    totalSales: number;
    rating: number;
}

export interface PricingInfo {
    type: 'free' | 'paid' | 'donation';
    price?: number;
    currency?: string;
    tier?: 'basic' | 'pro' | 'enterprise';
}

export interface PromptStats {
    views: number;
    downloads: number;
    uses: number;
    ratings: number;
    averageRating: number;
    favorites: number;
}

export interface PromptVersion {
    version: string;
    prompt: string;
    changelog: string;
    createdAt: Date;
    isAIRefined: boolean;
}

export interface PromptReview {
    id: string;
    promptId: string;
    userId: string;
    rating: number; // 1-5
    review: string;
    helpful: number;
    createdAt: Date;
}

export interface PurchaseRecord {
    id: string;
    promptId: string;
    buyerId: string;
    sellerId: string;
    price: number;
    currency: string;
    timestamp: Date;
}

export interface AIRefinement {
    originalPrompt: string;
    refinedPrompt: string;
    improvements: string[];
    confidenceScore: number;
    basedOnUsage: number; // How many uses analyzed
}

export class PromptMarketplace extends EventEmitter {
    private static instance: PromptMarketplace;
    private prompts: Map<string, MarketplacePrompt> = new Map();
    private reviews: Map<string, PromptReview[]> = new Map();
    private purchases: PurchaseRecord[] = [];
    private usagePatterns: Map<string, { successful: number; total: number }> = new Map();

    private constructor() {
        super();
        this.initializeFeaturedPrompts();
    }

    static getInstance(): PromptMarketplace {
        if (!PromptMarketplace.instance) {
            PromptMarketplace.instance = new PromptMarketplace();
        }
        return PromptMarketplace.instance;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    private initializeFeaturedPrompts(): void {
        const featured: Omit<MarketplacePrompt, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
                title: 'Ultimate Code Review',
                description: 'Comprehensive code review with security, performance, and best practices analysis',
                category: 'code_generation',
                prompt: 'Review this code like a senior developer:\n\n{{code}}\n\nAnalyze:\n1. Security vulnerabilities\n2. Performance issues\n3. Code quality\n4. Best practices\n5. Suggestions for improvement',
                variables: ['code'],
                author: { id: 'system', name: 'Shadow AI', verified: true, totalSales: 0, rating: 4.9 },
                pricing: { type: 'free' },
                stats: { views: 1000, downloads: 500, uses: 2500, ratings: 120, averageRating: 4.8, favorites: 200 },
                versions: [{ version: '1.0.0', prompt: '', changelog: 'Initial release', createdAt: new Date(), isAIRefined: false }],
                tags: ['code-review', 'security', 'best-practices'],
            },
            {
                title: 'Test Generator Pro',
                description: 'Generate comprehensive unit tests with edge cases and mocking',
                category: 'testing',
                prompt: 'Generate comprehensive tests for:\n\n{{code}}\n\nInclude:\n- Unit tests for all functions\n- Edge case coverage\n- Mocking for dependencies\n- Error handling tests\n\nUse {{framework}} framework.',
                variables: ['code', 'framework'],
                author: { id: 'system', name: 'Shadow AI', verified: true, totalSales: 0, rating: 4.9 },
                pricing: { type: 'free' },
                stats: { views: 800, downloads: 400, uses: 1800, ratings: 90, averageRating: 4.7, favorites: 150 },
                versions: [{ version: '1.0.0', prompt: '', changelog: 'Initial release', createdAt: new Date(), isAIRefined: false }],
                tags: ['testing', 'unit-tests', 'tdd'],
            },
            {
                title: 'API Documentation Generator',
                description: 'Generate OpenAPI/Swagger documentation from code',
                category: 'documentation',
                prompt: 'Generate OpenAPI 3.0 documentation for these API endpoints:\n\n{{code}}\n\nInclude:\n- Request/response schemas\n- Parameter descriptions\n- Example values\n- Error responses',
                variables: ['code'],
                author: { id: 'system', name: 'Shadow AI', verified: true, totalSales: 0, rating: 4.9 },
                pricing: { type: 'free' },
                stats: { views: 600, downloads: 300, uses: 1200, ratings: 70, averageRating: 4.6, favorites: 100 },
                versions: [{ version: '1.0.0', prompt: '', changelog: 'Initial release', createdAt: new Date(), isAIRefined: false }],
                tags: ['documentation', 'api', 'openapi', 'swagger'],
            },
        ];

        for (const prompt of featured) {
            const id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.prompts.set(id, {
                ...prompt,
                id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    // ========================================================================
    // PROMPT MANAGEMENT
    // ========================================================================

    /**
     * Publish a new prompt to the marketplace
     */
    publishPrompt(prompt: Omit<MarketplacePrompt, 'id' | 'stats' | 'versions' | 'createdAt' | 'updatedAt'>): MarketplacePrompt {
        const id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newPrompt: MarketplacePrompt = {
            ...prompt,
            id,
            stats: {
                views: 0,
                downloads: 0,
                uses: 0,
                ratings: 0,
                averageRating: 0,
                favorites: 0,
            },
            versions: [{
                version: '1.0.0',
                prompt: prompt.prompt,
                changelog: 'Initial release',
                createdAt: new Date(),
                isAIRefined: false,
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.prompts.set(id, newPrompt);
        this.emit('prompt:published', newPrompt);
        return newPrompt;
    }

    /**
     * Update an existing prompt
     */
    updatePrompt(promptId: string, updates: Partial<MarketplacePrompt>, changelog?: string): MarketplacePrompt | undefined {
        const prompt = this.prompts.get(promptId);
        if (!prompt) return undefined;

        const updated: MarketplacePrompt = {
            ...prompt,
            ...updates,
            updatedAt: new Date(),
        };

        // Add new version if prompt content changed
        if (updates.prompt && updates.prompt !== prompt.prompt) {
            const lastVersion = prompt.versions[prompt.versions.length - 1];
            const [major, minor, patch] = lastVersion.version.split('.').map(Number);
            const newVersion = `${major}.${minor + 1}.0`;

            updated.versions.push({
                version: newVersion,
                prompt: updates.prompt,
                changelog: changelog || 'Updated prompt',
                createdAt: new Date(),
                isAIRefined: false,
            });
        }

        this.prompts.set(promptId, updated);
        return updated;
    }

    // ========================================================================
    // DISCOVERY
    // ========================================================================

    /**
     * Search prompts
     */
    search(query: string, filters?: { category?: PromptCategory; tags?: string[]; pricingType?: PricingInfo['type'] }): MarketplacePrompt[] {
        const queryLower = query.toLowerCase();

        return Array.from(this.prompts.values()).filter(prompt => {
            // Text match
            const textMatch =
                prompt.title.toLowerCase().includes(queryLower) ||
                prompt.description.toLowerCase().includes(queryLower) ||
                prompt.tags.some(t => t.toLowerCase().includes(queryLower));

            if (!textMatch) return false;

            // Category filter
            if (filters?.category && prompt.category !== filters.category) return false;

            // Tags filter
            if (filters?.tags && !filters.tags.some(t => prompt.tags.includes(t))) return false;

            // Pricing filter
            if (filters?.pricingType && prompt.pricing.type !== filters.pricingType) return false;

            return true;
        });
    }

    /**
     * Get trending prompts
     */
    getTrending(limit: number = 10): MarketplacePrompt[] {
        return Array.from(this.prompts.values())
            .sort((a, b) => {
                // Score based on recent activity
                const scoreA = a.stats.uses * 2 + a.stats.downloads + a.stats.favorites * 3;
                const scoreB = b.stats.uses * 2 + b.stats.downloads + b.stats.favorites * 3;
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }

    /**
     * Get top rated prompts
     */
    getTopRated(limit: number = 10): MarketplacePrompt[] {
        return Array.from(this.prompts.values())
            .filter(p => p.stats.ratings >= 5) // Minimum ratings threshold
            .sort((a, b) => b.stats.averageRating - a.stats.averageRating)
            .slice(0, limit);
    }

    /**
     * Get prompts by category
     */
    getByCategory(category: PromptCategory): MarketplacePrompt[] {
        return Array.from(this.prompts.values())
            .filter(p => p.category === category)
            .sort((a, b) => b.stats.downloads - a.stats.downloads);
    }

    // ========================================================================
    // AI REFINEMENT
    // ========================================================================

    /**
     * Track usage pattern for AI refinement
     */
    trackUsage(promptId: string, success: boolean): void {
        const pattern = this.usagePatterns.get(promptId) || { successful: 0, total: 0 };
        pattern.total++;
        if (success) pattern.successful++;
        this.usagePatterns.set(promptId, pattern);

        // Update prompt stats
        const prompt = this.prompts.get(promptId);
        if (prompt) {
            prompt.stats.uses++;
        }

        // Trigger AI refinement if enough data
        if (pattern.total >= 100 && pattern.successful / pattern.total < 0.7) {
            this.suggestRefinement(promptId);
        }
    }

    /**
     * AI-powered prompt refinement based on usage patterns
     */
    private suggestRefinement(promptId: string): AIRefinement | undefined {
        const prompt = this.prompts.get(promptId);
        if (!prompt) return undefined;

        const pattern = this.usagePatterns.get(promptId);
        if (!pattern) return undefined;

        // Analyze and suggest improvements
        const improvements: string[] = [];
        let refinedPrompt = prompt.prompt;

        // Add clarity if success rate is low
        if (pattern.successful / pattern.total < 0.6) {
            improvements.push('Added clearer instructions');
            refinedPrompt = refinedPrompt.replace(
                /^/,
                'IMPORTANT: Follow these instructions exactly.\n\n'
            );
        }

        // Add examples if not present
        if (!prompt.prompt.includes('Example:') && !prompt.prompt.includes('example:')) {
            improvements.push('Added example section');
            refinedPrompt += '\n\nExample output format:\n{{example}}';
        }

        const refinement: AIRefinement = {
            originalPrompt: prompt.prompt,
            refinedPrompt,
            improvements,
            confidenceScore: 0.7,
            basedOnUsage: pattern.total,
        };

        this.emit('refinement:suggested', { promptId, refinement });
        return refinement;
    }

    /**
     * Apply AI refinement to a prompt
     */
    applyRefinement(promptId: string, refinedPrompt: string, changelog: string): MarketplacePrompt | undefined {
        const prompt = this.prompts.get(promptId);
        if (!prompt) return undefined;

        const lastVersion = prompt.versions[prompt.versions.length - 1];
        const [major, minor, patch] = lastVersion.version.split('.').map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;

        prompt.versions.push({
            version: newVersion,
            prompt: refinedPrompt,
            changelog,
            createdAt: new Date(),
            isAIRefined: true,
        });

        prompt.prompt = refinedPrompt;
        prompt.updatedAt = new Date();

        this.emit('refinement:applied', promptId);
        return prompt;
    }

    // ========================================================================
    // REVIEWS & RATINGS
    // ========================================================================

    addReview(promptId: string, userId: string, rating: number, review: string): PromptReview {
        const reviewEntry: PromptReview = {
            id: `review_${Date.now()}`,
            promptId,
            userId,
            rating: Math.min(5, Math.max(1, rating)),
            review,
            helpful: 0,
            createdAt: new Date(),
        };

        const promptReviews = this.reviews.get(promptId) || [];
        promptReviews.push(reviewEntry);
        this.reviews.set(promptId, promptReviews);

        // Update prompt stats
        const prompt = this.prompts.get(promptId);
        if (prompt) {
            const allRatings = promptReviews.map(r => r.rating);
            prompt.stats.ratings = allRatings.length;
            prompt.stats.averageRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }

        return reviewEntry;
    }

    getReviews(promptId: string): PromptReview[] {
        return this.reviews.get(promptId) || [];
    }

    // ========================================================================
    // TRANSACTIONS
    // ========================================================================

    purchase(promptId: string, buyerId: string): PurchaseRecord | undefined {
        const prompt = this.prompts.get(promptId);
        if (!prompt || prompt.pricing.type === 'free') return undefined;

        const record: PurchaseRecord = {
            id: `purchase_${Date.now()}`,
            promptId,
            buyerId,
            sellerId: prompt.author.id,
            price: prompt.pricing.price || 0,
            currency: prompt.pricing.currency || 'USD',
            timestamp: new Date(),
        };

        this.purchases.push(record);
        prompt.stats.downloads++;

        this.emit('prompt:purchased', record);
        return record;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getPrompt(promptId: string): MarketplacePrompt | undefined {
        const prompt = this.prompts.get(promptId);
        if (prompt) {
            prompt.stats.views++;
        }
        return prompt;
    }

    getAllPrompts(): MarketplacePrompt[] {
        return Array.from(this.prompts.values());
    }

    getCategories(): { category: PromptCategory; count: number }[] {
        const counts = new Map<PromptCategory, number>();
        for (const prompt of this.prompts.values()) {
            counts.set(prompt.category, (counts.get(prompt.category) || 0) + 1);
        }
        return Array.from(counts.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
    }
}

export const promptMarketplace = PromptMarketplace.getInstance();
