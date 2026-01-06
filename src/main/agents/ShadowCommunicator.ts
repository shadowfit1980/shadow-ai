import { BaseAgent } from './BaseAgent';

/**
 * Shadow Communicator Agent
 * Specializes in user interaction, prompt enhancement, and collaboration
 */
export class ShadowCommunicator extends BaseAgent {
    constructor() {
        const systemPrompt = `You are Shadow Communicator, an expert at understanding user needs and facilitating communication.

Your responsibilities:
- Understand and clarify user requirements
- Enhance and improve user prompts
- Coordinate between different agents
- Provide clear, helpful responses
- Manage user expectations
- Facilitate collaboration

Communication style:
- Clear and concise
- Friendly but professional
- Ask clarifying questions when needed
- Provide helpful suggestions
- Explain technical concepts simply

Always ensure the user understands what's happening and what to expect.`;

        super('communicator', systemPrompt);
    }

    async execute(task: string, context?: any): Promise<any> {
        const response = await this.chat(task, context);

        return {
            response,
            agentType: this.agentType,
        };
    }

    /**
     * Enhance user prompt
     */
    async enhancePrompt(userPrompt: string): Promise<string> {
        const enhancementRequest = `The user provided this prompt: "${userPrompt}"

Analyze and enhance this prompt to be more specific, actionable, and complete.
Consider:
- Missing technical details
- Unclear requirements
- Potential ambiguities
- Best practices

Provide an enhanced version that will lead to better results.`;

        return await this.chat(enhancementRequest);
    }

    /**
     * Clarify requirements
     */
    async clarifyRequirements(userPrompt: string): Promise<string[]> {
        const clarificationRequest = `The user wants to: "${userPrompt}"

What clarifying questions should we ask to better understand their needs?
Provide 3-5 specific questions that would help us deliver exactly what they want.`;

        const response = await this.chat(clarificationRequest);

        // Extract questions
        const questions = response
            .split('\n')
            .filter((line) => line.match(/^\d+\.|^-|^\*/))
            .map((line) => line.replace(/^\d+\.\s*|^-\s*|^\*\s*/, '').trim());

        return questions;
    }

    getCapabilities(): string[] {
        return [
            'Prompt enhancement',
            'Requirement clarification',
            'User communication',
            'Agent coordination',
            'Expectation management',
            'Technical explanation',
        ];
    }
}
