/**
 * Voice Dictionary
 * Learn and remember unique words/pronunciations
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DictionaryEntry {
    word: string;
    pronunciation?: string;
    aliases: string[];
    frequency: number;
    category?: string;
    addedAt: number;
    lastUsed: number;
}

export interface LearnedPhrase {
    spoken: string;
    corrected: string;
    confidence: number;
    occurrences: number;
}

/**
 * VoiceDictionary
 * Personal dictionary that learns unique words
 */
export class VoiceDictionary extends EventEmitter {
    private static instance: VoiceDictionary;
    private entries: Map<string, DictionaryEntry> = new Map();
    private phrases: Map<string, LearnedPhrase> = new Map();
    private dataPath: string;

    private constructor() {
        super();
        this.dataPath = path.join(process.cwd(), 'voice-dictionary.json');
    }

    static getInstance(): VoiceDictionary {
        if (!VoiceDictionary.instance) {
            VoiceDictionary.instance = new VoiceDictionary();
        }
        return VoiceDictionary.instance;
    }

    /**
     * Load dictionary from disk
     */
    async load(): Promise<void> {
        try {
            const data = await fs.readFile(this.dataPath, 'utf-8');
            const json = JSON.parse(data);

            this.entries = new Map(json.entries || []);
            this.phrases = new Map(json.phrases || []);

            this.emit('loaded', { entries: this.entries.size, phrases: this.phrases.size });
        } catch {
            // File doesn't exist or is invalid
        }
    }

    /**
     * Save dictionary to disk
     */
    async save(): Promise<void> {
        const data = {
            entries: Array.from(this.entries.entries()),
            phrases: Array.from(this.phrases.entries()),
            savedAt: Date.now(),
        };

        await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        this.emit('saved');
    }

    /**
     * Add a word to dictionary
     */
    addWord(word: string, options: {
        pronunciation?: string;
        aliases?: string[];
        category?: string;
    } = {}): DictionaryEntry {
        const existing = this.entries.get(word.toLowerCase());

        const entry: DictionaryEntry = {
            word,
            pronunciation: options.pronunciation,
            aliases: options.aliases || existing?.aliases || [],
            frequency: (existing?.frequency || 0) + 1,
            category: options.category || existing?.category,
            addedAt: existing?.addedAt || Date.now(),
            lastUsed: Date.now(),
        };

        this.entries.set(word.toLowerCase(), entry);
        this.emit('wordAdded', entry);

        return entry;
    }

    /**
     * Learn a correction
     */
    learnCorrection(spoken: string, corrected: string): LearnedPhrase {
        const key = spoken.toLowerCase();
        const existing = this.phrases.get(key);

        const phrase: LearnedPhrase = {
            spoken,
            corrected,
            confidence: existing ? Math.min(existing.confidence + 0.1, 1) : 0.5,
            occurrences: (existing?.occurrences || 0) + 1,
        };

        this.phrases.set(key, phrase);
        this.emit('correctionLearned', phrase);

        // Also add corrected word to dictionary
        this.addWord(corrected);

        return phrase;
    }

    /**
     * Get correction for spoken text
     */
    getCorrection(spoken: string): string | null {
        const phrase = this.phrases.get(spoken.toLowerCase());
        if (phrase && phrase.confidence >= 0.7) {
            return phrase.corrected;
        }
        return null;
    }

    /**
     * Apply corrections to text
     */
    applyCorrections(text: string): string {
        let corrected = text;

        for (const [key, phrase] of this.phrases) {
            if (phrase.confidence >= 0.7) {
                const regex = new RegExp(`\\b${this.escapeRegex(phrase.spoken)}\\b`, 'gi');
                corrected = corrected.replace(regex, phrase.corrected);
            }
        }

        return corrected;
    }

    /**
     * Check if word is known
     */
    isKnown(word: string): boolean {
        const lower = word.toLowerCase();

        if (this.entries.has(lower)) return true;

        // Check aliases
        for (const entry of this.entries.values()) {
            if (entry.aliases.some(a => a.toLowerCase() === lower)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get word entry
     */
    getWord(word: string): DictionaryEntry | null {
        return this.entries.get(word.toLowerCase()) || null;
    }

    /**
     * Search dictionary
     */
    search(query: string, limit = 20): DictionaryEntry[] {
        const results: DictionaryEntry[] = [];
        const queryLower = query.toLowerCase();

        for (const entry of this.entries.values()) {
            if (entry.word.toLowerCase().includes(queryLower)) {
                results.push(entry);
            } else if (entry.aliases.some(a => a.toLowerCase().includes(queryLower))) {
                results.push(entry);
            }

            if (results.length >= limit) break;
        }

        return results.sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Get most used words
     */
    getTopWords(limit = 50): DictionaryEntry[] {
        return Array.from(this.entries.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, limit);
    }

    /**
     * Get words by category
     */
    getByCategory(category: string): DictionaryEntry[] {
        return Array.from(this.entries.values())
            .filter(e => e.category === category);
    }

    /**
     * Remove word
     */
    removeWord(word: string): boolean {
        const deleted = this.entries.delete(word.toLowerCase());
        if (deleted) {
            this.emit('wordRemoved', { word });
        }
        return deleted;
    }

    /**
     * Import words from list
     */
    importWords(words: string[], category?: string): number {
        let imported = 0;

        for (const word of words) {
            if (word.trim()) {
                this.addWord(word.trim(), { category });
                imported++;
            }
        }

        this.emit('imported', { count: imported });
        return imported;
    }

    /**
     * Export dictionary
     */
    export(): { entries: DictionaryEntry[]; phrases: LearnedPhrase[] } {
        return {
            entries: Array.from(this.entries.values()),
            phrases: Array.from(this.phrases.values()),
        };
    }

    /**
     * Clear dictionary
     */
    clear(): void {
        this.entries.clear();
        this.phrases.clear();
        this.emit('cleared');
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalWords: number;
        totalPhrases: number;
        categories: string[];
        topFrequency: number;
    } {
        const categories = new Set<string>();
        let topFrequency = 0;

        for (const entry of this.entries.values()) {
            if (entry.category) categories.add(entry.category);
            topFrequency = Math.max(topFrequency, entry.frequency);
        }

        return {
            totalWords: this.entries.size,
            totalPhrases: this.phrases.size,
            categories: Array.from(categories),
            topFrequency,
        };
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Singleton getter
export function getVoiceDictionary(): VoiceDictionary {
    return VoiceDictionary.getInstance();
}
