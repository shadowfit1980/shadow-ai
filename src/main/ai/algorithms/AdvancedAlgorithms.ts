/**
 * Advanced AI Algorithms
 * 
 * Implements cutting-edge features from top AI agents:
 * - Interleaved Thinking (Minimax M2)
 * - Agent RL (Alibaba Qwen)
 * - Stream JSON (Qwen)
 * - Agentic Intelligence (Kimi K2)
 * - Code-Run-Fix Loops (Minimax)
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface ThinkingStep {
    type: 'thinking' | 'action' | 'observation' | 'conclusion';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface AgentAction {
    tool: string;
    params: Record<string, any>;
    reasoning: string;
}

export interface CodeRunResult {
    code: string;
    output: string;
    error?: string;
    iteration: number;
    fixed: boolean;
}

export interface StreamChunk {
    type: 'token' | 'json_partial' | 'json_complete';
    content: string;
    isValid: boolean;
}

// ============================================================================
// INTERLEAVED THINKING ENGINE
// ============================================================================

/**
 * Implements Interleaved Thinking format from Minimax M2
 * Separates internal reasoning from final output
 */
export class InterleavedThinking extends EventEmitter {
    private static instance: InterleavedThinking;
    private modelManager: ModelManager;
    private thinkingHistory: ThinkingStep[] = [];

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): InterleavedThinking {
        if (!InterleavedThinking.instance) {
            InterleavedThinking.instance = new InterleavedThinking();
        }
        return InterleavedThinking.instance;
    }

    /**
     * Process with interleaved thinking
     */
    async think(task: string, context?: string): Promise<{
        thinking: ThinkingStep[];
        output: string;
    }> {
        const steps: ThinkingStep[] = [];

        // Initial thinking
        const thinkingPrompt = `<thinking>
Task: ${task}
${context ? `Context: ${context}` : ''}

Break this down step by step:
1. What is the core problem?
2. What information do I need?
3. What are possible approaches?
4. What's the best approach and why?
</thinking>`;

        const thinking = await this.modelManager.chat([
            { role: 'user', content: thinkingPrompt, timestamp: new Date() }
        ]);

        steps.push({
            type: 'thinking',
            content: thinking,
            timestamp: new Date(),
        });

        this.emit('thinking:step', steps[steps.length - 1]);

        // Action step
        const actionPrompt = `Based on my analysis:
${thinking}

Now provide the concrete action or solution:`;

        const action = await this.modelManager.chat([
            { role: 'user', content: actionPrompt, timestamp: new Date() }
        ]);

        steps.push({
            type: 'action',
            content: action,
            timestamp: new Date(),
        });

        this.emit('thinking:step', steps[steps.length - 1]);

        // Conclusion
        steps.push({
            type: 'conclusion',
            content: action,
            timestamp: new Date(),
        });

        this.thinkingHistory.push(...steps);

        return {
            thinking: steps,
            output: action,
        };
    }

    /**
     * Multi-turn thinking with observation
     */
    async observe(observation: string): Promise<ThinkingStep> {
        const step: ThinkingStep = {
            type: 'observation',
            content: observation,
            timestamp: new Date(),
        };

        this.thinkingHistory.push(step);
        this.emit('thinking:observation', step);

        return step;
    }

    getHistory(): ThinkingStep[] {
        return [...this.thinkingHistory];
    }

    clearHistory(): void {
        this.thinkingHistory = [];
    }
}

// ============================================================================
// AGENT REINFORCEMENT LEARNING
// ============================================================================

/**
 * Implements Agent RL from Alibaba Qwen
 * Enables autonomous planning, tool invocation, and self-correction
 */
export class AgentRL extends EventEmitter {
    private static instance: AgentRL;
    private modelManager: ModelManager;
    private feedbackHistory: Array<{ action: AgentAction; success: boolean; feedback: string }> = [];

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): AgentRL {
        if (!AgentRL.instance) {
            AgentRL.instance = new AgentRL();
        }
        return AgentRL.instance;
    }

    /**
     * Plan actions for a task
     */
    async planActions(task: string, availableTools: string[]): Promise<AgentAction[]> {
        const prompt = `You are an autonomous agent with reinforcement learning capabilities.

Task: ${task}

Available tools: ${availableTools.join(', ')}

Previous feedback I've learned from:
${this.feedbackHistory.slice(-5).map(f =>
            `- ${f.action.tool}: ${f.success ? 'Success' : 'Failed'} - ${f.feedback}`
        ).join('\n')}

Plan a sequence of actions to complete this task.
For each action, specify:
1. Which tool to use
2. Parameters for the tool
3. Reasoning for this choice

Respond in JSON:
\`\`\`json
{
    "actions": [
        {
            "tool": "tool_name",
            "params": {},
            "reasoning": "why this action"
        }
    ]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);
        return parsed.actions || [];
    }

    /**
     * Record feedback for learning
     */
    recordFeedback(action: AgentAction, success: boolean, feedback: string): void {
        this.feedbackHistory.push({ action, success, feedback });
        this.emit('feedback:recorded', { action, success, feedback });
    }

    /**
     * Self-correct based on error
     */
    async selfCorrect(action: AgentAction, error: string): Promise<AgentAction | null> {
        const prompt = `The following action failed:
Tool: ${action.tool}
Params: ${JSON.stringify(action.params)}
Error: ${error}

Analyze what went wrong and provide a corrected action.
Consider:
1. Were the parameters correct?
2. Is there an alternative approach?
3. Are there prerequisites that were missed?

Respond in JSON with the corrected action.`;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);
        if (parsed.tool) {
            this.recordFeedback(action, false, `Corrected to: ${parsed.tool}`);
            return parsed;
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

// ============================================================================
// CODE-RUN-FIX LOOP
// ============================================================================

/**
 * Implements iterative code-run-fix loops from Minimax
 * Generates, tests, and fixes code automatically
 */
export class CodeRunFix extends EventEmitter {
    private static instance: CodeRunFix;
    private modelManager: ModelManager;
    private maxIterations = 5;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): CodeRunFix {
        if (!CodeRunFix.instance) {
            CodeRunFix.instance = new CodeRunFix();
        }
        return CodeRunFix.instance;
    }

    /**
     * Execute code-run-fix loop
     */
    async execute(
        task: string,
        language: string,
        runner: (code: string) => Promise<{ output: string; error?: string }>
    ): Promise<CodeRunResult[]> {
        const results: CodeRunResult[] = [];
        let currentCode = '';
        let lastError: string | undefined;

        for (let i = 0; i < this.maxIterations; i++) {
            this.emit('iteration:start', { iteration: i + 1 });

            // Generate or fix code
            const prompt = lastError
                ? `Fix this ${language} code:
\`\`\`${language}
${currentCode}
\`\`\`

Error: ${lastError}

Provide the corrected code only.`
                : `Generate ${language} code for: ${task}

Provide working code only, no explanations.`;

            const response = await this.modelManager.chat([
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            // Extract code
            currentCode = this.extractCode(response, language);

            // Run code
            const { output, error } = await runner(currentCode);

            const result: CodeRunResult = {
                code: currentCode,
                output,
                error,
                iteration: i + 1,
                fixed: !error,
            };

            results.push(result);
            this.emit('iteration:complete', result);

            if (!error) {
                this.emit('success', result);
                break;
            }

            lastError = error;
        }

        return results;
    }

    private extractCode(text: string, language: string): string {
        const regex = new RegExp(`\`\`\`${language}?\\s*([\\s\\S]*?)\`\`\``, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : text.trim();
    }

    setMaxIterations(max: number): void {
        this.maxIterations = max;
    }
}

// ============================================================================
// STREAM JSON PARSER
// ============================================================================

/**
 * Implements Stream JSON from Qwen
 * Enables incremental, token-by-token JSON generation
 */
export class StreamJSON extends EventEmitter {
    private buffer = '';
    private depth = 0;
    private inString = false;
    private escape = false;

    /**
     * Process a stream chunk
     */
    processChunk(chunk: string): StreamChunk[] {
        const results: StreamChunk[] = [];

        for (const char of chunk) {
            this.buffer += char;

            if (!this.inString) {
                if (char === '{' || char === '[') this.depth++;
                if (char === '}' || char === ']') this.depth--;
            }

            // Track string state
            if (char === '"' && !this.escape) {
                this.inString = !this.inString;
            }
            this.escape = char === '\\' && !this.escape;

            // Check if we have valid JSON
            if (this.depth === 0 && this.buffer.trim()) {
                const isValid = this.isValidJSON(this.buffer);
                results.push({
                    type: isValid ? 'json_complete' : 'json_partial',
                    content: this.buffer,
                    isValid,
                });

                if (isValid) {
                    this.emit('json:complete', JSON.parse(this.buffer));
                    this.buffer = '';
                }
            }
        }

        return results;
    }

    /**
     * Parse partial JSON (best effort)
     */
    parsePartial(): any {
        try {
            // Try to complete the JSON
            let completed = this.buffer;

            // Add missing closing brackets
            const openBraces = (completed.match(/{/g) || []).length;
            const closeBraces = (completed.match(/}/g) || []).length;
            const openBrackets = (completed.match(/\[/g) || []).length;
            const closeBrackets = (completed.match(/]/g) || []).length;

            completed += '}'.repeat(openBraces - closeBraces);
            completed += ']'.repeat(openBrackets - closeBrackets);

            return JSON.parse(completed);
        } catch {
            return null;
        }
    }

    private isValidJSON(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    reset(): void {
        this.buffer = '';
        this.depth = 0;
        this.inString = false;
        this.escape = false;
    }

    getBuffer(): string {
        return this.buffer;
    }
}

// ============================================================================
// AGENTIC INTELLIGENCE
// ============================================================================

/**
 * Implements Agentic Intelligence from Kimi K2
 * "Don't just answer; act"
 */
export class AgenticIntelligence extends EventEmitter {
    private static instance: AgenticIntelligence;
    private modelManager: ModelManager;
    private tools: Map<string, (params: any) => Promise<any>> = new Map();

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): AgenticIntelligence {
        if (!AgenticIntelligence.instance) {
            AgenticIntelligence.instance = new AgenticIntelligence();
        }
        return AgenticIntelligence.instance;
    }

    /**
     * Register a tool that the agent can use
     */
    registerTool(name: string, handler: (params: any) => Promise<any>): void {
        this.tools.set(name, handler);
    }

    /**
     * Process a request with agentic behavior
     */
    async process(request: string): Promise<{
        thought: string;
        actions: Array<{ tool: string; result: any }>;
        response: string;
    }> {
        const toolList = Array.from(this.tools.keys());

        const prompt = `You are an agentic AI. Your principle: "Don't just answer; act."

Request: ${request}

Available tools: ${toolList.join(', ')}

For this request:
1. Think about what actions are needed
2. Determine which tools to use
3. Plan the execution order

Respond in JSON:
\`\`\`json
{
    "thought": "your reasoning",
    "actions": [
        {"tool": "tool_name", "params": {}}
    ],
    "response_template": "what to say after actions complete"
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);
        const actions: Array<{ tool: string; result: any }> = [];

        // Execute actions
        for (const action of parsed.actions || []) {
            const handler = this.tools.get(action.tool);
            if (handler) {
                this.emit('action:executing', action);
                try {
                    const result = await handler(action.params);
                    actions.push({ tool: action.tool, result });
                    this.emit('action:completed', { action, result });
                } catch (error: any) {
                    actions.push({ tool: action.tool, result: { error: error.message } });
                    this.emit('action:failed', { action, error });
                }
            }
        }

        return {
            thought: parsed.thought || '',
            actions,
            response: parsed.response_template || 'Task completed.',
        };
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

// Export singletons
export const interleavedThinking = InterleavedThinking.getInstance();
export const agentRL = AgentRL.getInstance();
export const codeRunFix = CodeRunFix.getInstance();
export const agenticIntelligence = AgenticIntelligence.getInstance();
