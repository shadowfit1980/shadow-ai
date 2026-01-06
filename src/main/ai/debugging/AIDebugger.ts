/**
 * AI-Powered Debugging
 * 
 * Automatic breakpoint suggestions, root cause analysis,
 * and fix suggestions with confidence scores.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface BreakpointSuggestion {
    file: string;
    line: number;
    reason: string;
    confidence: number;
    type: 'exception' | 'logic' | 'data' | 'performance';
}

export interface RootCauseAnalysis {
    error: string;
    stackTrace: string[];
    rootCause: string;
    explanation: string;
    relatedCode: Array<{ file: string; line: number; code: string }>;
    confidence: number;
}

export interface FixSuggestion {
    id: string;
    description: string;
    code: string;
    file: string;
    line: number;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    sideEffects?: string[];
}

export interface DebugSession {
    id: string;
    error: string;
    analysis?: RootCauseAnalysis;
    fixes: FixSuggestion[];
    status: 'analyzing' | 'waiting' | 'resolved';
    startedAt: Date;
}

// ============================================================================
// AI DEBUGGER
// ============================================================================

export class AIDebugger extends EventEmitter {
    private static instance: AIDebugger;
    private modelManager: ModelManager;
    private sessions: Map<string, DebugSession> = new Map();
    private breakpointHistory: BreakpointSuggestion[] = [];

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): AIDebugger {
        if (!AIDebugger.instance) {
            AIDebugger.instance = new AIDebugger();
        }
        return AIDebugger.instance;
    }

    // ========================================================================
    // BREAKPOINT SUGGESTIONS
    // ========================================================================

    /**
     * Suggest breakpoints based on code analysis
     */
    async suggestBreakpoints(code: string, file: string): Promise<BreakpointSuggestion[]> {
        const prompt = `Analyze this code and suggest optimal breakpoint locations for debugging.

File: ${file}
\`\`\`
${code}
\`\`\`

For each suggestion provide:
1. Line number
2. Reason for breakpoint
3. Confidence (0-1)
4. Type (exception, logic, data, performance)

Respond in JSON:
\`\`\`json
{
    "breakpoints": [
        { "line": 10, "reason": "...", "confidence": 0.9, "type": "exception" }
    ]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);
        const suggestions: BreakpointSuggestion[] = (parsed.breakpoints || []).map((b: any) => ({
            file,
            line: b.line,
            reason: b.reason,
            confidence: b.confidence,
            type: b.type,
        }));

        this.breakpointHistory.push(...suggestions);
        this.emit('breakpoints:suggested', suggestions);

        return suggestions;
    }

    // ========================================================================
    // ROOT CAUSE ANALYSIS
    // ========================================================================

    /**
     * Analyze an error and find root cause
     */
    async analyzeError(error: string, stackTrace: string, code?: string): Promise<RootCauseAnalysis> {
        const prompt = `Analyze this error and provide a root cause analysis.

Error: ${error}

Stack Trace:
${stackTrace}

${code ? `Related Code:\n\`\`\`\n${code}\n\`\`\`` : ''}

Provide:
1. Root cause explanation
2. Why this error occurred
3. Related code locations
4. Confidence level (0-1)

Respond in JSON:
\`\`\`json
{
    "rootCause": "The actual cause",
    "explanation": "Detailed explanation",
    "relatedCode": [
        { "file": "...", "line": 10, "code": "..." }
    ],
    "confidence": 0.85
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        const analysis: RootCauseAnalysis = {
            error,
            stackTrace: stackTrace.split('\n'),
            rootCause: parsed.rootCause || 'Unknown',
            explanation: parsed.explanation || '',
            relatedCode: parsed.relatedCode || [],
            confidence: parsed.confidence || 0.5,
        };

        this.emit('analysis:completed', analysis);
        return analysis;
    }

    // ========================================================================
    // FIX SUGGESTIONS
    // ========================================================================

    /**
     * Suggest fixes for an error
     */
    async suggestFixes(analysis: RootCauseAnalysis, code: string, file: string): Promise<FixSuggestion[]> {
        const prompt = `Based on this error analysis, suggest fixes.

Error: ${analysis.error}
Root Cause: ${analysis.rootCause}
Explanation: ${analysis.explanation}

Code:
\`\`\`
${code}
\`\`\`

Provide multiple fix options with:
1. Description of the fix
2. The corrected code
3. Line number to apply fix
4. Confidence (0-1)
5. Impact level
6. Potential side effects

Respond in JSON:
\`\`\`json
{
    "fixes": [
        {
            "description": "Fix description",
            "code": "corrected code",
            "line": 10,
            "confidence": 0.9,
            "impact": "low|medium|high",
            "sideEffects": ["possible effect"]
        }
    ]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        const fixes: FixSuggestion[] = (parsed.fixes || []).map((f: any, idx: number) => ({
            id: `fix_${Date.now()}_${idx}`,
            description: f.description,
            code: f.code,
            file,
            line: f.line,
            confidence: f.confidence,
            impact: f.impact,
            sideEffects: f.sideEffects,
        }));

        this.emit('fixes:suggested', fixes);
        return fixes;
    }

    // ========================================================================
    // DEBUG SESSION
    // ========================================================================

    /**
     * Start a debug session
     */
    async startDebugSession(error: string, stackTrace: string, code?: string): Promise<DebugSession> {
        const session: DebugSession = {
            id: `debug_${Date.now()}`,
            error,
            fixes: [],
            status: 'analyzing',
            startedAt: new Date(),
        };

        this.sessions.set(session.id, session);
        this.emit('session:started', session);

        try {
            // Analyze the error
            const analysis = await this.analyzeError(error, stackTrace, code);
            session.analysis = analysis;

            // Get fix suggestions
            if (code) {
                const fixes = await this.suggestFixes(analysis, code, 'unknown');
                session.fixes = fixes;
            }

            session.status = 'waiting';
            this.emit('session:ready', session);

        } catch (e: any) {
            session.status = 'waiting';
        }

        return session;
    }

    /**
     * Apply a fix
     */
    applyFix(sessionId: string, fixId: string): FixSuggestion | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const fix = session.fixes.find(f => f.id === fixId);
        if (!fix) return null;

        session.status = 'resolved';
        this.emit('fix:applied', { session, fix });

        return fix;
    }

    /**
     * Get session
     */
    getSession(id: string): DebugSession | undefined {
        return this.sessions.get(id);
    }

    // ========================================================================
    // QUICK FIXES
    // ========================================================================

    /**
     * Get quick fix for common errors
     */
    getQuickFix(error: string): string | null {
        const quickFixes: Record<string, string> = {
            'Cannot read property': 'Add null check before accessing property: `if (obj && obj.property)`',
            'is not a function': 'Verify the variable is a function before calling: `typeof fn === "function" && fn()`',
            'is undefined': 'Initialize the variable or add a fallback: `const value = myVar ?? defaultValue`',
            'is not defined': 'Ensure the variable is declared and in scope',
            'ENOENT': 'Check if file/directory exists before accessing',
            'EACCES': 'Check file permissions or run with appropriate privileges',
            'SyntaxError': 'Check for missing brackets, quotes, or commas',
            'TypeError': 'Verify types match expected values',
        };

        for (const [pattern, fix] of Object.entries(quickFixes)) {
            if (error.includes(pattern)) {
                return fix;
            }
        }

        return null;
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }
}

// Export singleton
export const aiDebugger = AIDebugger.getInstance();
