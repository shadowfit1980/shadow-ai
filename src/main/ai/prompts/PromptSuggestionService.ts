import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * PromptSuggestionService
 * Uses Google AI Studio (Gemini) to provide creative and comprehensive prompt suggestions
 */
export class PromptSuggestionService {
    private static instance: PromptSuggestionService;
    private genAI: GoogleGenerativeAI;
    private model: any;
    private cache: Map<string, { suggestions: string[]; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly RATE_LIMIT_MS = 1000; // 1 second between requests
    private lastRequestTime = 0;

    private constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    static getInstance(apiKey?: string): PromptSuggestionService {
        if (!PromptSuggestionService.instance) {
            if (!apiKey) {
                throw new Error('API key required for first initialization');
            }
            PromptSuggestionService.instance = new PromptSuggestionService(apiKey);
        }
        return PromptSuggestionService.instance;
    }

    /**
     * Generate creative prompt improvement suggestions
     */
    async suggestPromptImprovements(userPrompt: string): Promise<string[]> {
        // Check cache first
        const cached = this.getFromCache(userPrompt);
        if (cached) {
            console.log('📦 Using cached suggestions for:', userPrompt.substring(0, 30));
            return cached;
        }

        // Rate limiting
        await this.enforceRateLimit();

        try {
            const systemPrompt = `You are an expert at improving coding prompts to be more specific, detailed, and actionable.
Given a user's prompt, suggest 3 improved versions that are more detailed and specific.

Rules:
1. Each suggestion should be a complete, standalone prompt
2. Add specific details about styling, features, or implementation
3. Make suggestions progressively more detailed
4. Keep suggestions concise but comprehensive
5. Focus on web development, UI/UX, and code quality
6. Return ONLY a JSON array of 3 strings, nothing else

Example input: "button"
Example output: ["Create a modern button with gradient background and hover effects in HTML/CSS", "Build a responsive button component with loading state and animations using React", "Design a glassmorphism-style button with ripple effect and accessibility features in CSS"]

User prompt: "${userPrompt}"`;

            const result = await this.model.generateContent(systemPrompt);
            const response = result.response;
            const text = response.text();

            // Parse JSON response
            const suggestions = this.parseSuggestions(text);

            // Cache the results
            this.cache.set(userPrompt.toLowerCase(), {
                suggestions,
                timestamp: Date.now()
            });

            return suggestions;
        } catch (error: any) {
            console.error('❌ Google AI error:', error.message);
            // Fallback to local suggestions
            return this.getFallbackSuggestions(userPrompt);
        }
    }

    /**
     * Enhance a single prompt with AI
     */
    async enhancePrompt(userPrompt: string): Promise<string> {
        // Rate limiting
        await this.enforceRateLimit();

        try {
            const systemPrompt = `You are an expert at enhancing coding prompts.
Improve this prompt to be more specific, detailed, and actionable.
Add relevant details about styling, features, best practices, and implementation.
Return ONLY the enhanced prompt text, nothing else.

User prompt: "${userPrompt}"`;

            const result = await this.model.generateContent(systemPrompt);
            const response = result.response;
            const enhanced = response.text().trim();

            return enhanced;
        } catch (error: any) {
            console.error('❌ Google AI error:', error.message);
            // Fallback to local enhancement
            return this.localEnhancePrompt(userPrompt);
        }
    }

    /**
     * Parse AI response to extract suggestions
     */
    private parseSuggestions(text: string): string[] {
        try {
            // Try to extract JSON array from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.slice(0, 3); // Max 3 suggestions
                }
            }

            // Fallback: try line-by-line parsing
            const lines = text.split('\n').filter(line => line.trim().length > 10);
            if (lines.length > 0) {
                return lines.slice(0, 3).map(line => line.replace(/^[-*•]\s*/, '').trim());
            }

            throw new Error('Could not parse suggestions');
        } catch (error) {
            console.warn('Failed to parse AI suggestions, using text as-is');
            return [text.trim()];
        }
    }

    /**
     * Get cached suggestions if available and not expired
     */
    private getFromCache(userPrompt: string): string[] | null {
        const key = userPrompt.toLowerCase();
        const cached = this.cache.get(key);

        if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
            return cached.suggestions;
        }

        // Clean expired cache
        if (cached) {
            this.cache.delete(key);
        }

        return null;
    }

    /**
     * Enforce rate limiting
     */
    private async enforceRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
            const waitTime = this.RATE_LIMIT_MS - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Fallback suggestions using local rules
     */
    private getFallbackSuggestions(userPrompt: string): string[] {
        const lower = userPrompt.toLowerCase();
        const suggestions: string[] = [];

        // Basic enhancement
        let enhanced = userPrompt;
        if (!lower.includes('create') && !lower.includes('build') && !lower.includes('make')) {
            enhanced = `Create ${userPrompt}`;
        }

        // Add styling suggestions
        suggestions.push(`${enhanced} with modern styling and animations`);
        suggestions.push(`${enhanced} with responsive design and accessibility features`);
        suggestions.push(`${enhanced} with glassmorphism effect and hover interactions`);

        return suggestions;
    }

    /**
     * Local prompt enhancement
     */
    private localEnhancePrompt(userPrompt: string): string {
        let enhanced = userPrompt.trim();
        const lower = enhanced.toLowerCase();

        // Add action verb if missing
        if (!lower.startsWith('create') && !lower.startsWith('build') && !lower.startsWith('make')) {
            enhanced = `Create ${enhanced}`;
        }

        // Add details based on content
        if (lower.includes('button')) {
            enhanced += ' with modern styling, hover effects, and animations';
        } else if (lower.includes('form')) {
            enhanced += ' with validation, error messages, and smooth UX';
        } else if (lower.includes('card')) {
            enhanced += ' with glassmorphism design and hover animations';
        } else if (lower.includes('page') || lower.includes('website')) {
            enhanced += ' with responsive design, modern layout, and accessibility';
        } else {
            enhanced += ' with modern design and best practices';
        }

        return enhanced;
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Export singleton getter
export function getPromptSuggestionService(apiKey?: string): PromptSuggestionService {
    return PromptSuggestionService.getInstance(apiKey);
}
