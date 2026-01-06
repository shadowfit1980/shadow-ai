/**
 * Audio Command Processor
 * 
 * Process voice commands and audio input for coding
 * Enables hands-free development and voice-driven workflows
 */

import { ModelManager } from '../ModelManager';

export interface AudioCommand {
    id: string;
    transcript: string;
    intent: 'code' | 'refactor' | 'explain' | 'navigate' | 'test' | 'debug' | 'search';
    confidence: number;
    parameters: Record<string, any>;
    timestamp: Date;
}

export interface VoiceCodeResult {
    code: string;
    language: string;
    explanation: string;
    confidence: number;
}

export class AudioCommandProcessor {
    private static instance: AudioCommandProcessor;
    private modelManager: ModelManager;

    // Common voice command patterns
    private commandPatterns = new Map<string, RegExp>();

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.initializePatterns();
    }

    static getInstance(): AudioCommandProcessor {
        if (!AudioCommandProcessor.instance) {
            AudioCommandProcessor.instance = new AudioCommandProcessor();
        }
        return AudioCommandProcessor.instance;
    }

    /**
     * Process audio transcript to command
     */
    async processAudio(transcript: string): Promise<AudioCommand> {
        console.log('🎤 Processing audio command...');

        // Determine intent
        const intent = this.detectIntent(transcript);

        // Extract parameters
        const parameters = await this.extractParameters(transcript, intent);

        const command: AudioCommand = {
            id: `audio-${Date.now()}`,
            transcript,
            intent,
            confidence: 0.85,
            parameters,
            timestamp: new Date()
        };

        console.log(`✅ Detected intent: ${intent}`);
        return command;
    }

    /**
     * Voice-to-code: Convert spoken description to code
     */
    async voiceToCode(description: string, language: string = 'typescript'): Promise<VoiceCodeResult> {
        console.log('🗣️  Converting voice to code...');

        const prompt = `Convert this spoken description to ${language} code:

"${description}"

Generate:
1. Clean, working code
2. Appropriate comments
3. Best practices
4. Error handling

Response in JSON:
\`\`\`json
{
  "code": "// Generated code here",
  "language": "${language}",
  "explanation": "What the code does",
  "confidence": 0.9
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseVoiceCodeResponse(response);

        console.log(`✅ Generated ${language} code`);
        return {
            code: parsed.code || '',
            language: parsed.language || language,
            explanation: parsed.explanation || 'Code generated from voice',
            confidence: parsed.confidence || 0.8
        };
    }

    /**
     * Execute voice command
     */
    async executeCommand(command: AudioCommand): Promise<{
        success: boolean;
        result: any;
        message: string;
    }> {
        console.log(`⚡ Executing command: ${command.intent}`);

        switch (command.intent) {
            case 'code':
                const codeResult = await this.voiceToCode(
                    command.transcript,
                    command.parameters.language || 'typescript'
                );
                return {
                    success: true,
                    result: codeResult,
                    message: 'Code generated successfully'
                };

            case 'refactor':
                return {
                    success: true,
                    result: { suggestion: 'Refactoring analysis needed' },
                    message: 'Refactoring command recognized'
                };

            case 'explain':
                return {
                    success: true,
                    result: { explanation: 'Explanation needed for: ' + command.parameters.target },
                    message: 'Explain command recognized'
                };

            case 'navigate':
                return {
                    success: true,
                    result: { file: command.parameters.file, line: command.parameters.line },
                    message: 'Navigation command recognized'
                };

            case 'test':
                return {
                    success: true,
                    result: { action: 'run-tests' },
                    message: 'Test command recognized'
                };

            case 'debug':
                return {
                    success: true,
                    result: { action: 'start-debugger' },
                    message: 'Debug command recognized'
                };

            case 'search':
                return {
                    success: true,
                    result: { query: command.parameters.query },
                    message: 'Search command recognized'
                };

            default:
                return {
                    success: false,
                    result: null,
                    message: 'Unknown command intent'
                };
        }
    }

    /**
     * Convert voice command to natural language query
     */
    async voiceToQuery(transcript: string): Promise<string> {
        console.log('🔍 Converting voice to query...');

        const prompt = `Convert this voice command to a clear search query or action:

Voice: "${transcript}"

Response in JSON:
\`\`\`json
{
  "query": "Clear, specific query or action description"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseQueryResponse(response);

        return parsed.query || transcript;
    }

    /**
     * Suggest voice commands based on context
     */
    suggestCommands(context: {
        currentFile?: string;
        recentActions?: string[];
        projectType?: string;
    }): Array<{
        command: string;
        description: string;
        example: string;
    }> {
        const suggestions: Array<{
            command: string;
            description: string;
            example: string;
        }> = [];

        // General commands always available
        suggestions.push(
            {
                command: 'Create function',
                description: 'Generate a new function',
                example: 'Create a function that calculates sum of array'
            },
            {
                command: 'Refactor this',
                description: 'Refactor selected code',
                example: 'Refactor this to use async await'
            },
            {
                command: 'Explain',
                description: 'Explain code or concept',
                example: 'Explain this algorithm'
            },
            {
                command: 'Run tests',
                description: 'Execute test suite',
                example: 'Run tests for user service'
            }
        );

        // Context-specific
        if (context.currentFile) {
            suggestions.push({
                command: 'Add tests',
                description: 'Generate tests for current file',
                example: 'Add tests for this component'
            });
        }

        return suggestions;
    }

    // Private methods

    private detectIntent(transcript: string): AudioCommand['intent'] {
        const lower = transcript.toLowerCase();

        // Pattern matching for intent detection
        if (this.matchesPattern(lower, ['create', 'write', 'generate', 'make', 'code'])) {
            return 'code';
        } else if (this.matchesPattern(lower, ['refactor', 'improve', 'optimize', 'clean up'])) {
            return 'refactor';
        } else if (this.matchesPattern(lower, ['explain', 'what is', 'how does', 'tell me'])) {
            return 'explain';
        } else if (this.matchesPattern(lower, ['go to', 'open', 'navigate', 'show'])) {
            return 'navigate';
        } else if (this.matchesPattern(lower, ['test', 'run tests', 'check'])) {
            return 'test';
        } else if (this.matchesPattern(lower, ['debug', 'fix', 'find bug'])) {
            return 'debug';
        } else if (this.matchesPattern(lower, ['search', 'find', 'look for'])) {
            return 'search';
        }

        return 'code'; // Default
    }

    private async extractParameters(transcript: string, intent: string): Promise<Record<string, any>> {
        const params: Record<string, any> = {};

        // Extract language if mentioned
        const languages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust'];
        for (const lang of languages) {
            if (transcript.toLowerCase().includes(lang)) {
                params.language = lang;
                break;
            }
        }

        // Extract file references
        const fileMatch = transcript.match(/(?:file|in)\s+([a-zA-Z0-9._/-]+)/i);
        if (fileMatch) {
            params.file = fileMatch[1];
        }

        // Extract line numbers
        const lineMatch = transcript.match(/line\s+(\d+)/i);
        if (lineMatch) {
            params.line = parseInt(lineMatch[1]);
        }

        // For search, extract query
        if (intent === 'search') {
            const searchMatch = transcript.match(/(?:search|find|look for)\s+(.+)/i);
            if (searchMatch) {
                params.query = searchMatch[1];
            }
        }

        return params;
    }

    private matchesPattern(text: string, keywords: string[]): boolean {
        return keywords.some(keyword => text.includes(keyword));
    }

    private initializePatterns(): void {
        this.commandPatterns.set('create-function', /create\s+(a\s+)?function/i);
        this.commandPatterns.set('refactor', /refactor\s+this/i);
        this.commandPatterns.set('explain', /explain\s+(this|what|how)/i);
        this.commandPatterns.set('navigate', /go\s+to\s+line/i);
    }

    private parseVoiceCodeResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseQueryResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { query: '' };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at understanding voice commands for coding and generating code from spoken descriptions.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
            return response;
        } catch (error) {
            console.error('Error calling model:', error);
            return '{}';
        }
    }
}

// Export singleton
export const audioCommandProcessor = AudioCommandProcessor.getInstance();
