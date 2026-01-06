/**
 * Edit Pattern Analyzer
 * Advanced pattern detection for edit prediction
 * Analyzes cursor movements, code structure, and edit sequences
 */

import { EventEmitter } from 'events';
import { Position, Range, EditorContext } from '../completion/types';
import { EditEvent, EditPattern, PredictionPatternType } from './EditPredictionEngine';

export interface CursorMovement {
    from: Position;
    to: Position;
    timestamp: number;
    fileUri: string;
}

export interface StructuralContext {
    blockType: 'function' | 'class' | 'if' | 'loop' | 'object' | 'array' | 'unknown';
    depth: number;
    startLine: number;
    endLine: number;
    siblings: number[];  // Lines of sibling structures
}

export interface SymmetryPair {
    source: { line: number; content: string };
    target: { line: number; content: string };
    type: 'import-usage' | 'declaration-reference' | 'definition-call';
    confidence: number;
}

export interface PatternAnalysisResult {
    patterns: EditPattern[];
    symmetries: SymmetryPair[];
    structuralContext: StructuralContext | null;
    suggestedNextPositions: Position[];
}

/**
 * EditPatternAnalyzer
 * Performs deep analysis of edit patterns for accurate predictions
 */
export class EditPatternAnalyzer extends EventEmitter {
    private static instance: EditPatternAnalyzer;

    private cursorHistory: CursorMovement[] = [];
    private maxCursorHistory = 200;
    private patternThreshold = 0.6; // Minimum similarity for pattern match

    private constructor() {
        super();
    }

    static getInstance(): EditPatternAnalyzer {
        if (!EditPatternAnalyzer.instance) {
            EditPatternAnalyzer.instance = new EditPatternAnalyzer();
        }
        return EditPatternAnalyzer.instance;
    }

    /**
     * Track cursor movement
     */
    trackCursorMovement(movement: CursorMovement): void {
        this.cursorHistory.push(movement);

        // Prune old history
        while (this.cursorHistory.length > this.maxCursorHistory) {
            this.cursorHistory.shift();
        }

        this.emit('cursorTracked', movement);
    }

    /**
     * Analyze patterns in edit history
     */
    analyzeEditPatterns(edits: EditEvent[], context: EditorContext): PatternAnalysisResult {
        const result: PatternAnalysisResult = {
            patterns: [],
            symmetries: [],
            structuralContext: null,
            suggestedNextPositions: [],
        };

        if (edits.length < 2) return result;

        // Detect repetition patterns
        const repetitionPatterns = this.detectRepetitionPatterns(edits);
        result.patterns.push(...repetitionPatterns);

        // Detect navigation patterns
        const navigationPatterns = this.detectNavigationPatterns(edits);
        result.patterns.push(...navigationPatterns);

        // Analyze code structure
        result.structuralContext = this.analyzeStructure(context);

        // Find symmetry pairs
        result.symmetries = this.findSymmetries(context);

        // Generate suggested positions
        result.suggestedNextPositions = this.generateSuggestedPositions(
            edits,
            result.patterns,
            result.structuralContext
        );

        return result;
    }

    /**
     * Detect repetition patterns in edits
     */
    private detectRepetitionPatterns(edits: EditEvent[]): EditPattern[] {
        const patterns: EditPattern[] = [];
        const editGroups = new Map<string, EditEvent[]>();

        // Group similar edits
        for (const edit of edits) {
            const signature = this.getEditSignature(edit);
            if (!editGroups.has(signature)) {
                editGroups.set(signature, []);
            }
            editGroups.get(signature)!.push(edit);
        }

        // Create patterns from groups
        for (const [signature, groupEdits] of editGroups) {
            if (groupEdits.length >= 2) {
                const confidence = Math.min(95, 50 + groupEdits.length * 10);
                patterns.push({
                    type: PredictionPatternType.REPETITION,
                    edits: groupEdits,
                    confidence,
                    context: signature,
                });
            }
        }

        return patterns;
    }

    /**
     * Detect navigation patterns from cursor movements
     */
    private detectNavigationPatterns(edits: EditEvent[]): EditPattern[] {
        const patterns: EditPattern[] = [];

        if (edits.length < 3) return patterns;

        // Look for consistent line jumps
        const lineDeltas: number[] = [];
        for (let i = 1; i < edits.length; i++) {
            lineDeltas.push(edits[i].cursorAfter.line - edits[i - 1].cursorAfter.line);
        }

        // Check for consistent delta
        const avgDelta = lineDeltas.reduce((a, b) => a + b, 0) / lineDeltas.length;
        const variance = lineDeltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / lineDeltas.length;

        if (variance < 4) { // Low variance = consistent pattern
            patterns.push({
                type: PredictionPatternType.NAVIGATION,
                edits,
                confidence: Math.min(85, 70 - variance * 5),
                context: `Line delta: ${Math.round(avgDelta)}`,
            });
        }

        return patterns;
    }

    /**
     * Analyze structure at current position
     */
    private analyzeStructure(context: EditorContext): StructuralContext | null {
        const lines = context.content.split('\n');
        const currentLine = context.cursorPosition.line;

        // Find enclosing block
        let depth = 0;
        let blockStart = -1;
        let blockType: StructuralContext['blockType'] = 'unknown';

        for (let i = currentLine; i >= 0; i--) {
            const line = lines[i] || '';
            const opens = (line.match(/[\{\(\[]/g) || []).length;
            const closes = (line.match(/[\}\)\]]/g) || []).length;
            depth += closes - opens;

            if (depth < 0) {
                blockStart = i;
                blockType = this.detectBlockType(line);
                break;
            }
        }

        if (blockStart === -1) return null;

        // Find block end
        depth = 0;
        let blockEnd = lines.length - 1;
        for (let i = blockStart; i < lines.length; i++) {
            const line = lines[i] || '';
            const opens = (line.match(/[\{\(\[]/g) || []).length;
            const closes = (line.match(/[\}\)\]]/g) || []).length;
            depth += opens - closes;

            if (depth <= 0 && i > blockStart) {
                blockEnd = i;
                break;
            }
        }

        // Find sibling blocks
        const siblings: number[] = [];
        // This would involve more complex parsing...

        return {
            blockType,
            depth: Math.abs(depth),
            startLine: blockStart,
            endLine: blockEnd,
            siblings,
        };
    }

    /**
     * Detect block type from line content
     */
    private detectBlockType(line: string): StructuralContext['blockType'] {
        const trimmed = line.trim();

        if (/^(async\s+)?function\s|^\w+\s*\(.*\)\s*(\:\s*\w+)?\s*\{|^(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/.test(trimmed)) {
            return 'function';
        }
        if (/^class\s/.test(trimmed)) {
            return 'class';
        }
        if (/^if\s*\(|^else\s*(if\s*\()?/.test(trimmed)) {
            return 'if';
        }
        if (/^(for|while|do)\s*[\(\{]/.test(trimmed)) {
            return 'loop';
        }
        if (/\{$/.test(trimmed)) {
            return 'object';
        }
        if (/\[$/.test(trimmed)) {
            return 'array';
        }

        return 'unknown';
    }

    /**
     * Find symmetry pairs (import-usage, declaration-reference)
     */
    private findSymmetries(context: EditorContext): SymmetryPair[] {
        const symmetries: SymmetryPair[] = [];
        const lines = context.content.split('\n');

        // Find imports
        const importLines: { line: number; name: string }[] = [];
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/import\s+(?:{([^}]+)}|(\w+))\s+from/);
            if (match) {
                const names = (match[1] || match[2])?.split(',').map(s => s.trim()) || [];
                for (const name of names) {
                    importLines.push({ line: i, name });
                }
            }
        }

        // Find usages for each import
        for (const imp of importLines) {
            for (let i = 0; i < lines.length; i++) {
                if (i === imp.line) continue;
                if (lines[i].includes(imp.name) && !lines[i].includes('import')) {
                    symmetries.push({
                        source: { line: imp.line, content: lines[imp.line] },
                        target: { line: i, content: lines[i] },
                        type: 'import-usage',
                        confidence: 80,
                    });
                }
            }
        }

        return symmetries;
    }

    /**
     * Generate suggested next positions
     */
    private generateSuggestedPositions(
        edits: EditEvent[],
        patterns: EditPattern[],
        structure: StructuralContext | null
    ): Position[] {
        const positions: Position[] = [];

        if (edits.length === 0) return positions;

        const lastEdit = edits[edits.length - 1];

        // From patterns
        for (const pattern of patterns) {
            if (pattern.type === PredictionPatternType.NAVIGATION) {
                const avgDelta = pattern.edits.reduce((sum, e, i) => {
                    if (i === 0) return 0;
                    return sum + (e.cursorAfter.line - pattern.edits[i - 1].cursorAfter.line);
                }, 0) / Math.max(1, pattern.edits.length - 1);

                positions.push({
                    line: Math.max(0, Math.round(lastEdit.cursorAfter.line + avgDelta)),
                    character: lastEdit.cursorAfter.character,
                });
            }
        }

        // From structure (siblings)
        if (structure && structure.siblings.length > 0) {
            for (const siblingLine of structure.siblings) {
                positions.push({
                    line: siblingLine,
                    character: 0,
                });
            }
        }

        return positions;
    }

    /**
     * Get edit signature for grouping
     */
    private getEditSignature(edit: EditEvent): string {
        const type = edit.newText.length > edit.oldText.length ? 'ins' :
            edit.newText.length < edit.oldText.length ? 'del' : 'rep';
        const size = Math.floor(Math.abs(edit.newText.length - edit.oldText.length) / 5) * 5;

        // Include first char type
        const firstChar = edit.newText[0] || edit.oldText[0] || '';
        const charType = /[a-zA-Z]/.test(firstChar) ? 'alpha' :
            /[0-9]/.test(firstChar) ? 'num' :
                /[\s]/.test(firstChar) ? 'space' : 'sym';

        return `${type}_${size}_${charType}`;
    }

    /**
     * Clear cursor history
     */
    clearHistory(): void {
        this.cursorHistory = [];
    }

    /**
     * Get cursor history
     */
    getCursorHistory(): CursorMovement[] {
        return [...this.cursorHistory];
    }
}

// Singleton getter
export function getEditPatternAnalyzer(): EditPatternAnalyzer {
    return EditPatternAnalyzer.getInstance();
}
