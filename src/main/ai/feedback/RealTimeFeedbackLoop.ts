/**
 * Real-Time Feedback Loop
 * 
 * Learns from user corrections in real-time.
 * When users edit generated code, the agent learns the pattern.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface Correction {
    id: string;
    originalCode: string;
    correctedCode: string;
    context: string;
    pattern: string;
    timestamp: number;
    applied: number; // Times this correction was applied
}

interface FeedbackPattern {
    id: string;
    description: string;
    matchPattern: string;
    replacement: string;
    confidence: number;
    occurrences: number;
}

interface EditEvent {
    file: string;
    originalContent: string;
    newContent: string;
    timestamp: number;
}

// ============================================================================
// REAL-TIME FEEDBACK LOOP
// ============================================================================

export class RealTimeFeedbackLoop extends EventEmitter {
    private static instance: RealTimeFeedbackLoop;
    private corrections: Map<string, Correction> = new Map();
    private patterns: Map<string, FeedbackPattern> = new Map();
    private pendingEdits: Map<string, string> = new Map(); // file -> original content
    private storagePath: string;

    private constructor() {
        super();
        this.storagePath = path.join(process.env.HOME || '', '.shadow-ai', 'feedback');
        this.loadData();
    }

    static getInstance(): RealTimeFeedbackLoop {
        if (!RealTimeFeedbackLoop.instance) {
            RealTimeFeedbackLoop.instance = new RealTimeFeedbackLoop();
        }
        return RealTimeFeedbackLoop.instance;
    }

    private loadData(): void {
        try {
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }

            const correctionsPath = path.join(this.storagePath, 'corrections.json');
            if (fs.existsSync(correctionsPath)) {
                const data = JSON.parse(fs.readFileSync(correctionsPath, 'utf-8'));
                this.corrections = new Map(Object.entries(data));
            }

            const patternsPath = path.join(this.storagePath, 'patterns.json');
            if (fs.existsSync(patternsPath)) {
                const data = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
                this.patterns = new Map(Object.entries(data));
            }
        } catch (error) {
            console.error('Failed to load feedback data:', error);
        }
    }

    private saveData(): void {
        try {
            const correctionsPath = path.join(this.storagePath, 'corrections.json');
            fs.writeFileSync(correctionsPath, JSON.stringify(Object.fromEntries(this.corrections), null, 2));

            const patternsPath = path.join(this.storagePath, 'patterns.json');
            fs.writeFileSync(patternsPath, JSON.stringify(Object.fromEntries(this.patterns), null, 2));
        } catch (error) {
            console.error('Failed to save feedback data:', error);
        }
    }

    // ========================================================================
    // TRACKING
    // ========================================================================

    trackGeneratedCode(file: string, content: string): void {
        this.pendingEdits.set(file, content);
        this.emit('code:generated', { file, length: content.length });
    }

    async processEdit(event: EditEvent): Promise<Correction | null> {
        const originalContent = this.pendingEdits.get(event.file);

        if (!originalContent) {
            return null; // Not tracking this file
        }

        // Find the differences
        const diff = this.findDifferences(originalContent, event.newContent);

        if (diff.length === 0) {
            return null; // No meaningful differences
        }

        // Create corrections for each difference
        for (const change of diff) {
            const correction = await this.learnFromCorrection(
                change.original,
                change.corrected,
                event.file
            );

            if (correction) {
                this.emit('correction:learned', correction);
            }
        }

        this.pendingEdits.delete(event.file);
        return diff.length > 0 ? this.corrections.get(Array.from(this.corrections.keys()).pop()!) || null : null;
    }

    private findDifferences(original: string, corrected: string): Array<{ original: string; corrected: string }> {
        const differences: Array<{ original: string; corrected: string }> = [];

        const originalLines = original.split('\n');
        const correctedLines = corrected.split('\n');

        let i = 0;
        let j = 0;

        while (i < originalLines.length || j < correctedLines.length) {
            if (i >= originalLines.length) {
                // Added lines
                differences.push({ original: '', corrected: correctedLines[j] });
                j++;
            } else if (j >= correctedLines.length) {
                // Removed lines
                differences.push({ original: originalLines[i], corrected: '' });
                i++;
            } else if (originalLines[i] !== correctedLines[j]) {
                differences.push({ original: originalLines[i], corrected: correctedLines[j] });
                i++;
                j++;
            } else {
                i++;
                j++;
            }
        }

        // Filter out trivial changes (whitespace only)
        return differences.filter(d =>
            d.original.trim() !== d.corrected.trim()
        );
    }

    // ========================================================================
    // LEARNING
    // ========================================================================

    async learnFromCorrection(
        originalCode: string,
        correctedCode: string,
        context: string
    ): Promise<Correction | null> {
        if (originalCode.trim() === correctedCode.trim()) {
            return null;
        }

        // Check if we've seen this correction before
        const existingId = this.findSimilarCorrection(originalCode, correctedCode);

        if (existingId) {
            const existing = this.corrections.get(existingId)!;
            existing.applied++;
            existing.timestamp = Date.now();
            this.saveData();
            return existing;
        }

        const id = `correction-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        const correction: Correction = {
            id,
            originalCode,
            correctedCode,
            context,
            pattern: this.extractPattern(originalCode, correctedCode),
            timestamp: Date.now(),
            applied: 1,
        };

        this.corrections.set(id, correction);

        // Try to create a generalized pattern
        this.createPattern(correction);

        this.saveData();
        return correction;
    }

    private findSimilarCorrection(original: string, corrected: string): string | null {
        for (const [id, correction] of this.corrections) {
            const originalSimilarity = this.calculateSimilarity(correction.originalCode, original);
            const correctedSimilarity = this.calculateSimilarity(correction.correctedCode, corrected);

            if (originalSimilarity > 0.9 && correctedSimilarity > 0.9) {
                return id;
            }
        }
        return null;
    }

    private extractPattern(original: string, corrected: string): string {
        // Try to identify what type of correction this is

        if (corrected.includes('?.') && !original.includes('?.')) {
            return 'optional-chaining';
        }

        if (corrected.includes('try') && !original.includes('try')) {
            return 'error-handling';
        }

        if (corrected.includes('async') && !original.includes('async')) {
            return 'async-conversion';
        }

        if (original.includes('var') && corrected.includes('const')) {
            return 'var-to-const';
        }

        if (!original.includes('===') && corrected.includes('===')) {
            return 'strict-equality';
        }

        return 'general';
    }

    private createPattern(correction: Correction): void {
        // Only create patterns for corrections we've seen multiple times
        const similar = Array.from(this.corrections.values())
            .filter(c => c.pattern === correction.pattern && c.applied >= 2);

        if (similar.length >= 2) {
            const patternId = `pattern-${correction.pattern}`;

            if (!this.patterns.has(patternId)) {
                this.patterns.set(patternId, {
                    id: patternId,
                    description: `User prefers ${correction.pattern}`,
                    matchPattern: correction.originalCode,
                    replacement: correction.correctedCode,
                    confidence: 0.5,
                    occurrences: similar.length,
                });
            } else {
                const pattern = this.patterns.get(patternId)!;
                pattern.occurrences++;
                pattern.confidence = Math.min(0.95, pattern.confidence + 0.1);
            }
        }
    }

    // ========================================================================
    // APPLYING LEARNED PATTERNS
    // ========================================================================

    applyLearnedPatterns(code: string): { code: string; appliedPatterns: string[] } {
        let result = code;
        const appliedPatterns: string[] = [];

        for (const pattern of this.patterns.values()) {
            if (pattern.confidence > 0.7) {
                // Apply high-confidence patterns
                if (this.matchesPattern(result, pattern.matchPattern)) {
                    result = this.applyPattern(result, pattern);
                    appliedPatterns.push(pattern.description);
                }
            }
        }

        // Apply specific learned corrections
        for (const correction of this.corrections.values()) {
            if (correction.applied >= 3) {
                if (result.includes(correction.originalCode)) {
                    result = result.replace(correction.originalCode, correction.correctedCode);
                    appliedPatterns.push(`Applied correction: ${correction.pattern}`);
                }
            }
        }

        return { code: result, appliedPatterns };
    }

    private matchesPattern(code: string, pattern: string): boolean {
        return code.includes(pattern) ||
            this.calculateSimilarity(code, pattern) > 0.7;
    }

    private applyPattern(code: string, pattern: FeedbackPattern): string {
        return code.replace(pattern.matchPattern, pattern.replacement);
    }

    // ========================================================================
    // SUGGESTIONS
    // ========================================================================

    getSuggestions(code: string): Array<{ original: string; suggested: string; reason: string }> {
        const suggestions: Array<{ original: string; suggested: string; reason: string }> = [];

        for (const correction of this.corrections.values()) {
            if (correction.applied >= 2 && code.includes(correction.originalCode)) {
                suggestions.push({
                    original: correction.originalCode,
                    suggested: correction.correctedCode,
                    reason: `You've made this correction ${correction.applied} times before`,
                });
            }
        }

        return suggestions;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private calculateSimilarity(a: string, b: string): number {
        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.toLowerCase().split(/\s+/));

        let intersection = 0;
        for (const word of wordsA) {
            if (wordsB.has(word)) intersection++;
        }

        return intersection / Math.max(wordsA.size, wordsB.size);
    }

    getStats(): { corrections: number; patterns: number; topPatterns: string[] } {
        const topPatterns = Array.from(this.patterns.values())
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 5)
            .map(p => p.description);

        return {
            corrections: this.corrections.size,
            patterns: this.patterns.size,
            topPatterns,
        };
    }

    clearHistory(): void {
        this.corrections.clear();
        this.patterns.clear();
        this.saveData();
        this.emit('history:cleared');
    }
}

export const realTimeFeedbackLoop = RealTimeFeedbackLoop.getInstance();
