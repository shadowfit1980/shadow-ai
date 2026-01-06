/**
 * Multi-Modal Context Fusion
 * 
 * Combines inputs from multiple modalities (text, vision, audio, diagrams)
 * Creates unified understanding for complex tasks
 */

import { ModelManager } from '../ModelManager';
import { visionProcessor } from './VisionProcessor';
import { audioCommandProcessor } from './AudioCommandProcessor';
import { diagramGenerator } from './DiagramGenerator';

export interface MultiModalInput {
    text?: string;
    images?: string[]; // File paths
    audio?: string;    // Transcript
    diagrams?: string[]; // Diagram codes
    code?: string;
    context?: Record<string, any>;
}

export interface FusedUnderstanding {
    summary: string;
    intents: string[];
    entities: Array<{
        type: string;
        value: string;
        source: 'text' | 'vision' | 'audio' | 'diagram';
    }>;
    actionPlan: Array<{
        step: string;
        type: 'code' | 'design' | 'architecture' | 'refactor';
        priority: number;
    }>;
    confidence: number;
}

export class MultiModalFusion {
    private static instance: MultiModalFusion;
    private modelManager: ModelManager;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): MultiModalFusion {
        if (!MultiModalFusion.instance) {
            MultiModalFusion.instance = new MultiModalFusion();
        }
        return MultiModalFusion.instance;
    }

    /**
     * Fuse multi-modal inputs into unified understanding
     */
    async fuseInputs(inputs: MultiModalInput): Promise<FusedUnderstanding> {
        console.log('🔀 Fusing multi-modal inputs...');

        const analyses: string[] = [];
        const entities: FusedUnderstanding['entities'] = [];

        // Process text
        if (inputs.text) {
            analyses.push(`**Text Input**: ${inputs.text}`);
            // Extract entities from text
            const textEntities = this.extractTextEntities(inputs.text);
            entities.push(...textEntities.map(e => ({ ...e, source: 'text' as const })));
        }

        // Process images
        if (inputs.images && inputs.images.length > 0) {
            for (const image of inputs.images) {
                const visionAnalysis = await visionProcessor.analyzeImage(image);
                analyses.push(`**Image ${image}**: Detected ${visionAnalysis.components.length} UI components`);

                // Extract entities from vision
                visionAnalysis.components.forEach(comp => {
                    entities.push({
                        type: 'ui-component',
                        value: comp.type,
                        source: 'vision'
                    });
                });
            }
        }

        // Process audio
        if (inputs.audio) {
            const audioCommand = await audioCommandProcessor.processAudio(inputs.audio);
            analyses.push(`**Audio**: Intent=${audioCommand.intent}, Command="${audioCommand.transcript}"`);

            entities.push({
                type: 'command',
                value: audioCommand.intent,
                source: 'audio'
            });
        }

        // Process diagrams
        if (inputs.diagrams) {
            analyses.push(`**Diagrams**: ${inputs.diagrams.length} diagram(s) provided`);
            entities.push({
                type: 'diagram',
                value: 'architecture-diagram',
                source: 'diagram'
            });
        }

        // Process code
        if (inputs.code) {
            analyses.push(`**Code**: ${inputs.code.split('\n').length} lines provided`);
        }

        // Fuse everything together
        const fusedUnderstanding = await this.synthesizeUnderstanding(analyses, entities, inputs);

        console.log(`✅ Fused ${analyses.length} inputs into unified understanding`);
        return fusedUnderstanding;
    }

    /**
     * Generate comprehensive response from multi-modal inputs
     */
    async generateResponse(inputs: MultiModalInput): Promise<{
        text: string;
        code?: string;
        diagram?: string;
        suggestions: string[];
    }> {
        console.log('💬 Generating multi-modal response...');

        const understanding = await this.fuseInputs(inputs);

        const prompt = `Based on this multi-modal understanding, generate a comprehensive response:

## Summary
${understanding.summary}

## Detected Intents
${understanding.intents.join(', ')}

## Action Plan
${understanding.actionPlan.map((a, i) => `${i + 1}. ${a.step} (${a.type})`).join('\n')}

Generate:
1. Clear text response
2. Code if needed
3. Diagram if needed
4. Practical suggestions

Response in JSON:
\`\`\`json
{
  "text": "Comprehensive response",
  "code": "// Generated code if applicable",
  "diagram": "mermaid diagram if needed",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseResponseData(response);

        return {
            text: parsed.text || understanding.summary,
            code: parsed.code,
            diagram: parsed.diagram,
            suggestions: parsed.suggestions || []
        };
    }

    /**
     * Combine text description + UI mockup → Full implementation
     */
    async textPlusVisionToImplementation(
        description: string,
        mockupPath: string
    ): Promise<{
        code: string;
        styles: string;
        tests: string;
        documentation: string;
    }> {
        console.log('🎨📝 Combining text + vision for implementation...');

        // Get vision analysis
        const visionAnalysis = await visionProcessor.analyzeImage(mockupPath);

        const prompt = `Create a complete implementation combining:

## Text Description
${description}

## Visual Design
- Components: ${visionAnalysis.components.length}
- Layout: ${visionAnalysis.layout.type}
- Colors: ${JSON.stringify(visionAnalysis.colorScheme)}

Generate:
1. Complete code implementation
2. Styles (CSS/styled-components)
3. Unit tests
4. Documentation

Response in JSON:
\`\`\`json
{
  "code": "// Full implementation",
  "styles": "/* Complete styles */",
  "tests": "// Comprehensive tests",
  "documentation": "# Documentation"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseImplementationResponse(response);

        return {
            code: parsed.code || '',
            styles: parsed.styles || '',
            tests: parsed.tests || '',
            documentation: parsed.documentation || ''
        };
    }

    /**
     * Voice + Code → Intelligent refactoring
     */
    async voicePlusCodeToRefactoring(
        voiceCommand: string,
        code: string
    ): Promise<{
        refactoredCode: string;
        explanation: string;
        improvements: string[];
    }> {
        console.log('🗣️💻 Combining voice + code for refactoring...');

        const audioCommand = await audioCommandProcessor.processAudio(voiceCommand);

        const prompt = `Refactor code based on voice command:

## Voice Command
"${voiceCommand}"
Intent: ${audioCommand.intent}

## Current Code
\`\`\`
${code}
\`\`\`

Response in JSON:
\`\`\`json
{
  "refactoredCode": "// Refactored code",
  "explanation": "What was changed and why",
  "improvements": ["Improvement 1", "Improvement 2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseRefactoringResponse(response);

        return {
            refactoredCode: parsed.refactoredCode || code,
            explanation: parsed.explanation || 'No changes made',
            improvements: parsed.improvements || []
        };
    }

    // Private methods

    private async synthesizeUnderstanding(
        analyses: string[],
        entities: FusedUnderstanding['entities'],
        inputs: MultiModalInput
    ): Promise<FusedUnderstanding> {
        const prompt = `Synthesize understanding from multi-modal inputs:

${analyses.join('\n\n')}

Identify:
1. Overall intent
2. Key entities
3. Action plan
4. Confidence level

Response in JSON:
\`\`\`json
{
  "summary": "Unified understanding",
  "intents": ["intent1", "intent2"],
  "actionPlan": [
    {
      "step": "Step description",
      "type": "code",
      "priority": 1
    }
  ],
  "confidence": 0.85
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseUnderstandingResponse(response);

        return {
            summary: parsed.summary || 'Multi-modal input processed',
            intents: parsed.intents || [],
            entities,
            actionPlan: parsed.actionPlan || [],
            confidence: parsed.confidence || 0.7
        };
    }

    private extractTextEntities(text: string): Array<{ type: string; value: string }> {
        const entities: Array<{ type: string; value: string }> = [];

        // Simple entity extraction
        const functionPattern = /function\s+(\w+)/g;
        let match;
        while ((match = functionPattern.exec(text)) !== null) {
            entities.push({ type: 'function', value: match[1] });
        }

        const classPattern = /class\s+(\w+)/g;
        while ((match = classPattern.exec(text)) !== null) {
            entities.push({ type: 'class', value: match[1] });
        }

        return entities;
    }

    private parseResponseData(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseImplementationResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseRefactoringResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseUnderstandingResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at synthesizing information from multiple modalities to create unified understanding.',
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
export const multiModalFusion = MultiModalFusion.getInstance();
