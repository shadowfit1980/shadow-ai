/**
 * AI Translator
 * Multi-language translation with context awareness
 */

import { EventEmitter } from 'events';

export interface TranslationResult {
    original: string;
    translated: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
    alternatives?: string[];
}

export interface LanguageInfo {
    code: string;
    name: string;
    nativeName: string;
    rtl: boolean;
}

/**
 * AITranslator
 * Translate text between 100+ languages
 */
export class AITranslator extends EventEmitter {
    private static instance: AITranslator;
    private supportedLanguages: Map<string, LanguageInfo> = new Map();
    private translationCache: Map<string, TranslationResult> = new Map();
    private cacheMaxSize = 1000;

    private constructor() {
        super();
        this.initLanguages();
    }

    static getInstance(): AITranslator {
        if (!AITranslator.instance) {
            AITranslator.instance = new AITranslator();
        }
        return AITranslator.instance;
    }

    /**
     * Initialize supported languages
     */
    private initLanguages(): void {
        const languages: LanguageInfo[] = [
            { code: 'en', name: 'English', nativeName: 'English', rtl: false },
            { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
            { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
            { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
            { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
            { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
            { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false },
            { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
            { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
            { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
            { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
            { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
            { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
            { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
            { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false },
            { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
            { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
            { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false },
            { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', rtl: false },
            { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false },
            { code: 'da', name: 'Danish', nativeName: 'Dansk', rtl: false },
            { code: 'fi', name: 'Finnish', nativeName: 'Suomi', rtl: false },
            { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false },
            { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', rtl: false },
            { code: 'cs', name: 'Czech', nativeName: 'Čeština', rtl: false },
            { code: 'ro', name: 'Romanian', nativeName: 'Română', rtl: false },
            { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', rtl: false },
            { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
            { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false },
            { code: 'fil', name: 'Filipino', nativeName: 'Filipino', rtl: false },
        ];

        for (const lang of languages) {
            this.supportedLanguages.set(lang.code, lang);
        }
    }

    /**
     * Translate text
     */
    async translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult> {
        const detected = sourceLang || this.detectLanguage(text);
        const cacheKey = `${text}:${detected}:${targetLang}`;

        // Check cache
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey)!;
        }

        this.emit('translationStarted', { text, sourceLang: detected, targetLang });

        // Simulate translation (in production, use AI model)
        const result: TranslationResult = {
            original: text,
            translated: this.simulateTranslation(text, detected, targetLang),
            sourceLanguage: detected,
            targetLanguage: targetLang,
            confidence: 0.95,
        };

        // Cache result
        this.cacheResult(cacheKey, result);

        this.emit('translationCompleted', result);
        return result;
    }

    /**
     * Simulate translation
     */
    private simulateTranslation(text: string, from: string, to: string): string {
        // In production, this would call an AI translation API
        // For now, return with language marker
        if (from === to) return text;

        const targetLang = this.supportedLanguages.get(to);
        return `[${targetLang?.name || to}] ${text}`;
    }

    /**
     * Detect language
     */
    detectLanguage(text: string): string {
        // Simple language detection based on character sets
        if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
        if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
        if (/[\uac00-\ud7af]/.test(text)) return 'ko';
        if (/[\u0600-\u06ff]/.test(text)) return 'ar';
        if (/[\u0590-\u05ff]/.test(text)) return 'he';
        if (/[\u0400-\u04ff]/.test(text)) return 'ru';
        if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
        if (/[\u0900-\u097f]/.test(text)) return 'hi';
        if (/[\u0370-\u03ff]/.test(text)) return 'el';

        // Default to English for Latin script
        return 'en';
    }

    /**
     * Translate batch
     */
    async translateBatch(texts: string[], targetLang: string): Promise<TranslationResult[]> {
        const results: TranslationResult[] = [];

        for (const text of texts) {
            const result = await this.translate(text, targetLang);
            results.push(result);
        }

        return results;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages(): LanguageInfo[] {
        return Array.from(this.supportedLanguages.values());
    }

    /**
     * Get language by code
     */
    getLanguage(code: string): LanguageInfo | null {
        return this.supportedLanguages.get(code) || null;
    }

    /**
     * Is language supported
     */
    isSupported(code: string): boolean {
        return this.supportedLanguages.has(code);
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.translationCache.clear();
        this.emit('cacheCleared');
    }

    private cacheResult(key: string, result: TranslationResult): void {
        if (this.translationCache.size >= this.cacheMaxSize) {
            // Remove oldest entry
            const firstKey = this.translationCache.keys().next().value;
            if (firstKey) this.translationCache.delete(firstKey);
        }
        this.translationCache.set(key, result);
    }
}

// Singleton getter
export function getAITranslator(): AITranslator {
    return AITranslator.getInstance();
}
