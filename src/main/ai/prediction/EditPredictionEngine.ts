/**
 * Edit Prediction Engine
 * Predicts the next likely edit location and content based on user patterns
 * Enables Cursor-like Tab-Tab-Tab rapid navigation through edits
 */

import { EventEmitter } from 'events';
import { Position, Range, EditorContext, Edit } from '../completion/types';

export interface EditPrediction {
    id: string;
    fileUri: string;
    position: Position;
    range?: Range;
    predictedContent?: string;
    confidence: number; // 0-100
    reason: string;
    patternType: PredictionPatternType;
    timestamp: number;
}

export enum PredictionPatternType {
    REPETITION = 'repetition',        // Same type of edit repeated
    STRUCTURAL = 'structural',        // Following code structure (matching brackets, etc.)
    SYMMETRY = 'symmetry',           // Symmetric edits (e.g., add import → add usage)
    REFACTORING = 'refactoring',      // Part of a multi-step refactoring
    COMPLETION = 'completion',        // Completing an incomplete statement
    NAVIGATION = 'navigation',        // Based on cursor movement patterns
    AI_SUGGESTED = 'ai_suggested',    // AI model suggestion
}

export interface EditEvent {
    id: string;
    fileUri: string;
    range: Range;
    oldText: string;
    newText: string;
    timestamp: number;
    cursorBefore: Position;
    cursorAfter: Position;
}

export interface EditPattern {
    type: PredictionPatternType;
    edits: EditEvent[];
    confidence: number;
    context: string;
}

export interface PredictionConfig {
    enabled: boolean;
    maxPredictions: number;
    minConfidence: number;
    historySize: number;
    patternWindowMs: number;  // Time window for pattern detection
    enableAIPredictions: boolean;
}

/**
 * EditPredictionEngine
 * Tracks edit patterns and predicts next edit locations
 */
export class EditPredictionEngine extends EventEmitter {
    private static instance: EditPredictionEngine;

    private editHistory: EditEvent[] = [];
    private activePredictions: EditPrediction[] = [];
    private currentPredictionIndex = 0;
    private patterns: Map<string, EditPattern> = new Map();
    private predictionCounter = 0;

    private config: PredictionConfig = {
        enabled: true,
        maxPredictions: 5,
        minConfidence: 30,
        historySize: 100,
        patternWindowMs: 30000, // 30 seconds
        enableAIPredictions: true,
    };

    // Metrics
    private metrics = {
        editsTracked: 0,
        predictionsGenerated: 0,
        predictionsAccepted: 0,
        predictionsRejected: 0,
        patternMatches: 0,
        averageConfidence: 0,
    };

    private constructor() {
        super();
    }

    static getInstance(): EditPredictionEngine {
        if (!EditPredictionEngine.instance) {
            EditPredictionEngine.instance = new EditPredictionEngine();
        }
        return EditPredictionEngine.instance;
    }

    /**
     * Track a new edit event
     */
    trackEdit(edit: EditEvent): void {
        if (!this.config.enabled) return;

        this.metrics.editsTracked++;

        // Add to history
        this.editHistory.push(edit);

        // Prune old history
        while (this.editHistory.length > this.config.historySize) {
            this.editHistory.shift();
        }

        // Analyze patterns and generate predictions
        this.analyzePatterns();
        this.generatePredictions(edit);

        this.emit('editTracked', edit);
    }

    /**
     * Get predictions for the current context
     */
    async predictNextEdit(context: EditorContext): Promise<EditPrediction[]> {
        if (!this.config.enabled) return [];

        const predictions: EditPrediction[] = [];

        // Get pattern-based predictions
        const patternPredictions = this.getPatternPredictions(context);
        predictions.push(...patternPredictions);

        // Get structural predictions
        const structuralPredictions = this.getStructuralPredictions(context);
        predictions.push(...structuralPredictions);

        // Get AI-based predictions if enabled
        if (this.config.enableAIPredictions) {
            const aiPredictions = await this.getAIPredictions(context);
            predictions.push(...aiPredictions);
        }

        // Sort by confidence and filter by minimum threshold
        const filtered = predictions
            .filter(p => p.confidence >= this.config.minConfidence)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, this.config.maxPredictions);

        // Update active predictions
        this.activePredictions = filtered;
        this.currentPredictionIndex = 0;

        this.metrics.predictionsGenerated += filtered.length;
        this.updateAverageConfidence(filtered);

        this.emit('predictionsUpdated', filtered);

        return filtered;
    }

    /**
     * Navigate to next prediction (Tab-Tab-Tab mode)
     */
    navigateToNext(): EditPrediction | null {
        if (this.activePredictions.length === 0) return null;

        const prediction = this.activePredictions[this.currentPredictionIndex];
        this.currentPredictionIndex = (this.currentPredictionIndex + 1) % this.activePredictions.length;

        this.emit('navigatePrediction', prediction);

        return prediction;
    }

    /**
     * Navigate to previous prediction
     */
    navigateToPrevious(): EditPrediction | null {
        if (this.activePredictions.length === 0) return null;

        this.currentPredictionIndex = this.currentPredictionIndex === 0
            ? this.activePredictions.length - 1
            : this.currentPredictionIndex - 1;

        const prediction = this.activePredictions[this.currentPredictionIndex];
        this.emit('navigatePrediction', prediction);

        return prediction;
    }

    /**
     * Accept current prediction
     */
    acceptPrediction(): EditPrediction | null {
        if (this.activePredictions.length === 0) return null;

        const prediction = this.activePredictions[this.currentPredictionIndex];
        this.metrics.predictionsAccepted++;

        // Remove accepted prediction
        this.activePredictions.splice(this.currentPredictionIndex, 1);
        if (this.currentPredictionIndex >= this.activePredictions.length) {
            this.currentPredictionIndex = 0;
        }

        this.emit('predictionAccepted', prediction);

        return prediction;
    }

    /**
     * Reject current prediction
     */
    rejectPrediction(): void {
        if (this.activePredictions.length === 0) return;

        const prediction = this.activePredictions[this.currentPredictionIndex];
        this.metrics.predictionsRejected++;

        // Remove rejected prediction
        this.activePredictions.splice(this.currentPredictionIndex, 1);
        if (this.currentPredictionIndex >= this.activePredictions.length) {
            this.currentPredictionIndex = 0;
        }

        this.emit('predictionRejected', prediction);
    }

    /**
     * Clear all active predictions
     */
    clearPredictions(): void {
        this.activePredictions = [];
        this.currentPredictionIndex = 0;
        this.emit('predictionsCleared');
    }

    /**
     * Get edit history
     */
    getEditHistory(): EditEvent[] {
        return [...this.editHistory];
    }

    /**
     * Get active predictions
     */
    getActivePredictions(): EditPrediction[] {
        return [...this.activePredictions];
    }

    /**
     * Get current prediction
     */
    getCurrentPrediction(): EditPrediction | null {
        if (this.activePredictions.length === 0) return null;
        return this.activePredictions[this.currentPredictionIndex];
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<PredictionConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get configuration
     */
    getConfig(): PredictionConfig {
        return { ...this.config };
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            historySize: this.editHistory.length,
            activePredictions: this.activePredictions.length,
            patternCount: this.patterns.size,
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics(): void {
        this.metrics = {
            editsTracked: 0,
            predictionsGenerated: 0,
            predictionsAccepted: 0,
            predictionsRejected: 0,
            patternMatches: 0,
            averageConfidence: 0,
        };
    }

    // Private methods

    private analyzePatterns(): void {
        const now = Date.now();
        const windowStart = now - this.config.patternWindowMs;

        // Get recent edits within the pattern window
        const recentEdits = this.editHistory.filter(e => e.timestamp >= windowStart);

        if (recentEdits.length < 2) return;

        // Detect repetition patterns
        this.detectRepetitionPatterns(recentEdits);

        // Detect structural patterns
        this.detectStructuralPatterns(recentEdits);
    }

    private detectRepetitionPatterns(edits: EditEvent[]): void {
        // Group edits by similarity
        for (let i = 1; i < edits.length; i++) {
            const prev = edits[i - 1];
            const curr = edits[i];

            // Check if edits are similar (same type of change)
            if (this.areEditsSimilar(prev, curr)) {
                const patternKey = `rep_${this.getEditSignature(prev)}`;

                if (!this.patterns.has(patternKey)) {
                    this.patterns.set(patternKey, {
                        type: PredictionPatternType.REPETITION,
                        edits: [prev],
                        confidence: 50,
                        context: this.getEditSignature(prev),
                    });
                }

                const pattern = this.patterns.get(patternKey)!;
                pattern.edits.push(curr);
                pattern.confidence = Math.min(95, pattern.confidence + 10);
                this.metrics.patternMatches++;
            }
        }
    }

    private detectStructuralPatterns(edits: EditEvent[]): void {
        // TODO: Implement structural pattern detection
        // This would analyze code structure (brackets, blocks, etc.)
    }

    private generatePredictions(lastEdit: EditEvent): void {
        // Generate predictions based on detected patterns
        for (const [, pattern] of this.patterns) {
            if (pattern.confidence < this.config.minConfidence) continue;

            const prediction = this.generatePredictionFromPattern(pattern, lastEdit);
            if (prediction) {
                this.activePredictions.push(prediction);
            }
        }

        // Limit predictions
        while (this.activePredictions.length > this.config.maxPredictions) {
            this.activePredictions.pop();
        }
    }

    private generatePredictionFromPattern(pattern: EditPattern, lastEdit: EditEvent): EditPrediction | null {
        if (pattern.edits.length < 2) return null;

        // Predict next edit based on pattern
        const avgLineDelta = pattern.edits.reduce((sum, edit, i) => {
            if (i === 0) return 0;
            return sum + (edit.cursorAfter.line - pattern.edits[i - 1].cursorAfter.line);
        }, 0) / (pattern.edits.length - 1);

        const predictedLine = Math.round(lastEdit.cursorAfter.line + avgLineDelta);

        return {
            id: `pred_${++this.predictionCounter}`,
            fileUri: lastEdit.fileUri,
            position: {
                line: Math.max(0, predictedLine),
                character: lastEdit.cursorAfter.character,
            },
            confidence: pattern.confidence,
            reason: `Based on ${pattern.type} pattern (${pattern.edits.length} similar edits)`,
            patternType: pattern.type,
            timestamp: Date.now(),
        };
    }

    private getPatternPredictions(context: EditorContext): EditPrediction[] {
        // Get predictions based on current context and patterns
        return this.activePredictions.filter(p => p.fileUri === context.filePath);
    }

    private getStructuralPredictions(context: EditorContext): EditPrediction[] {
        const predictions: EditPrediction[] = [];

        // Analyze current line for incomplete structures
        const lines = context.content.split('\n');
        const currentLine = lines[context.cursorPosition.line] || '';

        // Check for unclosed brackets/braces
        const openBrackets = (currentLine.match(/[\(\[\{]/g) || []).length;
        const closeBrackets = (currentLine.match(/[\)\]\}]/g) || []).length;

        if (openBrackets > closeBrackets) {
            predictions.push({
                id: `struct_${++this.predictionCounter}`,
                fileUri: context.filePath,
                position: {
                    line: context.cursorPosition.line,
                    character: currentLine.length,
                },
                predictedContent: ')'.repeat(openBrackets - closeBrackets),
                confidence: 70,
                reason: 'Close unclosed brackets',
                patternType: PredictionPatternType.STRUCTURAL,
                timestamp: Date.now(),
            });
        }

        return predictions;
    }

    private async getAIPredictions(context: EditorContext): Promise<EditPrediction[]> {
        // TODO: Integrate with AI model for advanced predictions
        // This would use the LLM to predict likely next edits
        return [];
    }

    private areEditsSimilar(a: EditEvent, b: EditEvent): boolean {
        // Check if two edits are similar enough to form a pattern
        if (a.fileUri !== b.fileUri) return false;
        if (Math.abs(a.newText.length - b.newText.length) > 10) return false;

        // Check if the edit types are similar
        const aType = this.getEditType(a);
        const bType = this.getEditType(b);

        return aType === bType;
    }

    private getEditType(edit: EditEvent): string {
        if (edit.newText.length > edit.oldText.length) return 'insert';
        if (edit.newText.length < edit.oldText.length) return 'delete';
        return 'replace';
    }

    private getEditSignature(edit: EditEvent): string {
        const type = this.getEditType(edit);
        const length = edit.newText.length;
        return `${type}_${Math.floor(length / 10) * 10}`;
    }

    private updateAverageConfidence(predictions: EditPrediction[]): void {
        if (predictions.length === 0) return;

        const total = this.metrics.predictionsGenerated;
        const currentAvg = this.metrics.averageConfidence;
        const newAvg = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

        this.metrics.averageConfidence = (currentAvg * Math.max(0, total - predictions.length) + newAvg * predictions.length) / total;
    }
}

// Singleton getter
export function getEditPredictionEngine(): EditPredictionEngine {
    return EditPredictionEngine.getInstance();
}
