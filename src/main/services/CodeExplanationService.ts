/**
 * 📝 CodeExplanationService
 * 
 * Advanced Dev Tools
 * AI code explanation
 */

import { EventEmitter } from 'events';

export class CodeExplanationService extends EventEmitter {
    private static instance: CodeExplanationService;
    private constructor() { super(); }
    static getInstance(): CodeExplanationService {
        if (!CodeExplanationService.instance) {
            CodeExplanationService.instance = new CodeExplanationService();
        }
        return CodeExplanationService.instance;
    }

    generate(): string {
        return `// Code Explanation Service
class CodeExplanation {
    async explainCode(code: string, level: string): Promise<Explanation> {
        const response = await llm.chat([{
            role: 'system',
            content: \`Explain this code at \${level} level (beginner/intermediate/expert).\`
        }, {
            role: 'user',
            content: code
        }]);
        return JSON.parse(response.content);
    }
    
    async generateComments(code: string): Promise<string> {
        const response = await llm.chat([{
            role: 'system',
            content: 'Add inline comments explaining what each section does.'
        }, {
            role: 'user',
            content: code
        }]);
        return response.content;
    }
}
export { CodeExplanation };
`;
    }
}

export const codeExplanationService = CodeExplanationService.getInstance();
