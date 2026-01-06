/**
 * Prompt Library & Templates
 * 
 * Curated collection of prompts, templates,
 * and chains for common AI tasks.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    category: PromptCategory;
    template: string;
    variables: PromptVariable[];
    examples: PromptExample[];
    tags: string[];
    rating: number;
    usageCount: number;
    createdBy: string;
    createdAt: Date;
}

export type PromptCategory =
    | 'code'
    | 'writing'
    | 'analysis'
    | 'creative'
    | 'business'
    | 'education'
    | 'research'
    | 'chat'
    | 'custom';

export interface PromptVariable {
    name: string;
    description: string;
    type: 'string' | 'number' | 'array' | 'code' | 'file';
    required: boolean;
    default?: string;
}

export interface PromptExample {
    inputs: Record<string, string>;
    output: string;
}

export interface PromptChain {
    id: string;
    name: string;
    description: string;
    steps: ChainStep[];
    createdAt: Date;
}

export interface ChainStep {
    id: string;
    promptId?: string;
    customPrompt?: string;
    inputMapping: Record<string, string>;
    outputVariable: string;
    condition?: string;
}

export interface RenderedPrompt {
    text: string;
    variables: Record<string, string>;
    tokenEstimate: number;
}

// ============================================================================
// PROMPT LIBRARY
// ============================================================================

export class PromptLibrary extends EventEmitter {
    private static instance: PromptLibrary;
    private templates: Map<string, PromptTemplate> = new Map();
    private chains: Map<string, PromptChain> = new Map();
    private userFavorites: Set<string> = new Set();

    private constructor() {
        super();
        this.loadDefaultTemplates();
    }

    static getInstance(): PromptLibrary {
        if (!PromptLibrary.instance) {
            PromptLibrary.instance = new PromptLibrary();
        }
        return PromptLibrary.instance;
    }

    // ========================================================================
    // DEFAULT TEMPLATES
    // ========================================================================

    private loadDefaultTemplates(): void {
        const defaults: Array<Omit<PromptTemplate, 'id' | 'rating' | 'usageCount' | 'createdAt'>> = [
            // Code Templates
            {
                name: 'Code Review',
                description: 'Perform a comprehensive code review',
                category: 'code',
                template: `Review the following {{language}} code for:
1. Bugs and potential issues
2. Performance improvements
3. Code style and best practices
4. Security vulnerabilities

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Provide specific, actionable feedback.`,
                variables: [
                    { name: 'language', description: 'Programming language', type: 'string', required: true },
                    { name: 'code', description: 'Code to review', type: 'code', required: true },
                ],
                examples: [],
                tags: ['code', 'review', 'quality'],
                createdBy: 'system',
            },
            {
                name: 'Explain Code',
                description: 'Get a detailed explanation of code',
                category: 'code',
                template: `Explain the following {{language}} code in detail:

\`\`\`{{language}}
{{code}}
\`\`\`

Include:
1. What the code does overall
2. How each part works
3. Any important patterns or techniques used
4. Potential improvements`,
                variables: [
                    { name: 'language', description: 'Programming language', type: 'string', required: true },
                    { name: 'code', description: 'Code to explain', type: 'code', required: true },
                ],
                examples: [],
                tags: ['code', 'explanation', 'learning'],
                createdBy: 'system',
            },
            {
                name: 'Refactor Code',
                description: 'Refactor code with improvements',
                category: 'code',
                template: `Refactor the following {{language}} code to improve:
{{#if focus}}
Focus on: {{focus}}
{{else}}
- Readability
- Performance
- Maintainability
{{/if}}

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Provide the refactored code with explanations.`,
                variables: [
                    { name: 'language', description: 'Programming language', type: 'string', required: true },
                    { name: 'code', description: 'Code to refactor', type: 'code', required: true },
                    { name: 'focus', description: 'Specific focus area', type: 'string', required: false },
                ],
                examples: [],
                tags: ['code', 'refactor', 'improvement'],
                createdBy: 'system',
            },
            {
                name: 'Generate Tests',
                description: 'Generate unit tests for code',
                category: 'code',
                template: `Generate comprehensive unit tests for the following {{language}} code using {{testFramework}}:

\`\`\`{{language}}
{{code}}
\`\`\`

Include:
- Happy path tests
- Edge cases
- Error handling tests
- Mock setup if needed`,
                variables: [
                    { name: 'language', description: 'Programming language', type: 'string', required: true },
                    { name: 'code', description: 'Code to test', type: 'code', required: true },
                    { name: 'testFramework', description: 'Testing framework', type: 'string', required: true, default: 'jest' },
                ],
                examples: [],
                tags: ['code', 'testing', 'unit-tests'],
                createdBy: 'system',
            },

            // Writing Templates
            {
                name: 'Technical Documentation',
                description: 'Generate technical documentation',
                category: 'writing',
                template: `Create technical documentation for:

Topic: {{topic}}
Audience: {{audience}}
{{#if format}}Format: {{format}}{{/if}}

Include:
- Overview
- Key concepts
- Examples
- Best practices
- Common pitfalls`,
                variables: [
                    { name: 'topic', description: 'Documentation topic', type: 'string', required: true },
                    { name: 'audience', description: 'Target audience', type: 'string', required: true, default: 'developers' },
                    { name: 'format', description: 'Output format', type: 'string', required: false },
                ],
                examples: [],
                tags: ['documentation', 'technical', 'writing'],
                createdBy: 'system',
            },
            {
                name: 'README Generator',
                description: 'Generate a README for a project',
                category: 'writing',
                template: `Generate a comprehensive README.md for the following project:

Project Name: {{projectName}}
Description: {{description}}
Technologies: {{technologies}}
{{#if features}}Features: {{features}}{{/if}}

Include:
- Project title and badges
- Description
- Features
- Installation instructions
- Usage examples
- Configuration
- Contributing guidelines
- License`,
                variables: [
                    { name: 'projectName', description: 'Project name', type: 'string', required: true },
                    { name: 'description', description: 'Project description', type: 'string', required: true },
                    { name: 'technologies', description: 'Technologies used', type: 'array', required: true },
                    { name: 'features', description: 'Key features', type: 'array', required: false },
                ],
                examples: [],
                tags: ['readme', 'documentation', 'project'],
                createdBy: 'system',
            },

            // Analysis Templates
            {
                name: 'Data Analysis',
                description: 'Analyze data and provide insights',
                category: 'analysis',
                template: `Analyze the following data and provide insights:

Data:
{{data}}

Analysis goals:
{{#if goals}}{{goals}}{{else}}
- Key trends and patterns
- Statistical summary
- Anomalies or outliers
- Recommendations
{{/if}}`,
                variables: [
                    { name: 'data', description: 'Data to analyze', type: 'string', required: true },
                    { name: 'goals', description: 'Analysis goals', type: 'string', required: false },
                ],
                examples: [],
                tags: ['analysis', 'data', 'insights'],
                createdBy: 'system',
            },

            // Research Templates
            {
                name: 'Research Summary',
                description: 'Summarize research on a topic',
                category: 'research',
                template: `Provide a comprehensive research summary on:

Topic: {{topic}}
Depth: {{depth}}

Include:
- Overview and background
- Current state of research
- Key findings
- Open questions
- Future directions
- References`,
                variables: [
                    { name: 'topic', description: 'Research topic', type: 'string', required: true },
                    { name: 'depth', description: 'Research depth', type: 'string', required: true, default: 'comprehensive' },
                ],
                examples: [],
                tags: ['research', 'summary', 'academic'],
                createdBy: 'system',
            },

            // Business Templates
            {
                name: 'Business Proposal',
                description: 'Generate a business proposal',
                category: 'business',
                template: `Create a business proposal for:

Project: {{projectName}}
Client: {{clientName}}
Budget: {{budget}}
Timeline: {{timeline}}

Include:
- Executive summary
- Problem statement
- Proposed solution
- Deliverables
- Timeline and milestones
- Pricing
- Terms and conditions`,
                variables: [
                    { name: 'projectName', description: 'Project name', type: 'string', required: true },
                    { name: 'clientName', description: 'Client name', type: 'string', required: true },
                    { name: 'budget', description: 'Budget range', type: 'string', required: false },
                    { name: 'timeline', description: 'Timeline', type: 'string', required: false },
                ],
                examples: [],
                tags: ['business', 'proposal', 'professional'],
                createdBy: 'system',
            },
        ];

        defaults.forEach(template => {
            const fullTemplate: PromptTemplate = {
                ...template,
                id: `prompt_${template.name.toLowerCase().replace(/\s/g, '_')}`,
                rating: 4.5,
                usageCount: 0,
                createdAt: new Date(),
            };
            this.templates.set(fullTemplate.id, fullTemplate);
        });
    }

    // ========================================================================
    // TEMPLATE MANAGEMENT
    // ========================================================================

    createTemplate(template: Omit<PromptTemplate, 'id' | 'rating' | 'usageCount' | 'createdAt'>): PromptTemplate {
        const fullTemplate: PromptTemplate = {
            ...template,
            id: `prompt_${Date.now()}`,
            rating: 0,
            usageCount: 0,
            createdAt: new Date(),
        };

        this.templates.set(fullTemplate.id, fullTemplate);
        this.emit('templateCreated', fullTemplate);
        return fullTemplate;
    }

    getTemplate(id: string): PromptTemplate | undefined {
        return this.templates.get(id);
    }

    updateTemplate(id: string, updates: Partial<PromptTemplate>): PromptTemplate | null {
        const template = this.templates.get(id);
        if (!template) return null;

        const updated = { ...template, ...updates };
        this.templates.set(id, updated);
        this.emit('templateUpdated', updated);
        return updated;
    }

    deleteTemplate(id: string): boolean {
        const deleted = this.templates.delete(id);
        if (deleted) {
            this.emit('templateDeleted', id);
        }
        return deleted;
    }

    listTemplates(options?: {
        category?: PromptCategory;
        tags?: string[];
        search?: string;
    }): PromptTemplate[] {
        let templates = Array.from(this.templates.values());

        if (options?.category) {
            templates = templates.filter(t => t.category === options.category);
        }

        if (options?.tags && options.tags.length > 0) {
            templates = templates.filter(t =>
                options.tags!.some(tag => t.tags.includes(tag))
            );
        }

        if (options?.search) {
            const searchLower = options.search.toLowerCase();
            templates = templates.filter(t =>
                t.name.toLowerCase().includes(searchLower) ||
                t.description.toLowerCase().includes(searchLower)
            );
        }

        return templates.sort((a, b) => b.usageCount - a.usageCount);
    }

    // ========================================================================
    // PROMPT RENDERING
    // ========================================================================

    render(templateId: string, variables: Record<string, string>): RenderedPrompt {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Validate required variables
        for (const variable of template.variables) {
            if (variable.required && !variables[variable.name]) {
                if (variable.default) {
                    variables[variable.name] = variable.default;
                } else {
                    throw new Error(`Missing required variable: ${variable.name}`);
                }
            }
        }

        // Render template
        let text = template.template;

        // Replace {{variable}} patterns
        for (const [name, value] of Object.entries(variables)) {
            text = text.replace(new RegExp(`{{${name}}}`, 'g'), value);
        }

        // Handle conditionals {{#if variable}}...{{/if}}
        text = text.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_, varName, content) => {
            return variables[varName] ? content : '';
        });

        // Handle {{#if variable}}...{{else}}...{{/if}}
        text = text.replace(/{{#if (\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, (_, varName, ifContent, elseContent) => {
            return variables[varName] ? ifContent : elseContent;
        });

        // Update usage count
        template.usageCount++;

        // Estimate tokens (rough: 4 chars per token)
        const tokenEstimate = Math.ceil(text.length / 4);

        return { text: text.trim(), variables, tokenEstimate };
    }

    // ========================================================================
    // PROMPT CHAINS
    // ========================================================================

    createChain(chain: Omit<PromptChain, 'id' | 'createdAt'>): PromptChain {
        const fullChain: PromptChain = {
            ...chain,
            id: `chain_${Date.now()}`,
            createdAt: new Date(),
        };

        this.chains.set(fullChain.id, fullChain);
        this.emit('chainCreated', fullChain);
        return fullChain;
    }

    async executeChain(
        chainId: string,
        initialVariables: Record<string, string>,
        executor: (prompt: string) => Promise<string>
    ): Promise<Record<string, string>> {
        const chain = this.chains.get(chainId);
        if (!chain) throw new Error('Chain not found');

        const variables = { ...initialVariables };

        for (const step of chain.steps) {
            // Check condition
            if (step.condition) {
                const conditionMet = this.evaluateCondition(step.condition, variables);
                if (!conditionMet) continue;
            }

            // Build prompt
            let promptText: string;
            if (step.promptId) {
                const rendered = this.render(step.promptId, this.mapInputs(step.inputMapping, variables));
                promptText = rendered.text;
            } else if (step.customPrompt) {
                promptText = this.interpolate(step.customPrompt, variables);
            } else {
                throw new Error('Step must have promptId or customPrompt');
            }

            // Execute
            const result = await executor(promptText);
            variables[step.outputVariable] = result;

            this.emit('chainStepComplete', { chainId, stepId: step.id, result });
        }

        return variables;
    }

    private mapInputs(
        mapping: Record<string, string>,
        variables: Record<string, string>
    ): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [targetVar, sourceVar] of Object.entries(mapping)) {
            result[targetVar] = variables[sourceVar] || '';
        }
        return result;
    }

    private interpolate(text: string, variables: Record<string, string>): string {
        return text.replace(/{{(\w+)}}/g, (_, name) => variables[name] || '');
    }

    private evaluateCondition(condition: string, variables: Record<string, string>): boolean {
        // Simple condition evaluation
        const parts = condition.split(/\s+(==|!=|>|<)\s+/);
        if (parts.length !== 3) return Boolean(variables[condition]);

        const [left, op, right] = parts;
        const leftVal = variables[left] || left;
        const rightVal = variables[right] || right;

        switch (op) {
            case '==': return leftVal === rightVal;
            case '!=': return leftVal !== rightVal;
            case '>': return parseFloat(leftVal) > parseFloat(rightVal);
            case '<': return parseFloat(leftVal) < parseFloat(rightVal);
            default: return false;
        }
    }

    // ========================================================================
    // FAVORITES
    // ========================================================================

    addFavorite(templateId: string): void {
        this.userFavorites.add(templateId);
        this.emit('favoriteAdded', templateId);
    }

    removeFavorite(templateId: string): void {
        this.userFavorites.delete(templateId);
        this.emit('favoriteRemoved', templateId);
    }

    getFavorites(): PromptTemplate[] {
        return Array.from(this.userFavorites)
            .map(id => this.templates.get(id))
            .filter(Boolean) as PromptTemplate[];
    }
}

export const promptLibrary = PromptLibrary.getInstance();
