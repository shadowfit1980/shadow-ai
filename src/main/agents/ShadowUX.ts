import { BaseAgent } from './BaseAgent';

/**
 * Shadow UX Agent
 * Specializes in UI/UX design, component creation, and design optimization
 */
export class ShadowUX extends BaseAgent {
    constructor() {
        const systemPrompt = `You are Shadow UX, an expert UI/UX designer and front-end specialist.

Your responsibilities:
- Design beautiful, modern user interfaces
- Create React/Vue components with TailwindCSS
- Optimize user experience and accessibility
- Suggest color palettes and typography
- Design responsive layouts
- Convert designs to code

Design principles:
- Modern, clean aesthetics
- Excellent accessibility (WCAG 2.1 AA)
- Mobile-first responsive design
- Smooth animations and transitions
- Intuitive user flows

Always provide production-ready, well-styled components.
Use TailwindCSS for styling unless otherwise specified.
Consider dark mode and theme support.`;

        super('ux', systemPrompt);
    }

    async execute(task: string, context?: any): Promise<any> {
        const response = await this.chat(task, context);

        // Extract component code and design tokens
        const components = this.extractComponents(response);
        const designTokens = this.extractDesignTokens(response);

        return {
            response,
            components,
            designTokens,
            agentType: this.agentType,
        };
    }

    /**
     * Extract React/Vue components from response
     */
    private extractComponents(response: string): Array<{ name: string; code: string }> {
        const componentRegex = /```(?:tsx|jsx|vue)\s*(?:\/\/\s*(.+?))?\n([\s\S]*?)```/g;
        const components: Array<{ name: string; code: string }> = [];
        let match;

        while ((match = componentRegex.exec(response)) !== null) {
            components.push({
                name: match[1] || 'Component',
                code: match[2],
            });
        }

        return components;
    }

    /**
     * Extract design tokens (colors, spacing, etc.)
     */
    private extractDesignTokens(response: string): Record<string, any> {
        const tokens: Record<string, any> = {};

        // Extract color palette
        const colorRegex = /(?:color|palette):\s*{([^}]+)}/gi;
        const colorMatch = colorRegex.exec(response);
        if (colorMatch) {
            tokens.colors = colorMatch[1];
        }

        return tokens;
    }

    getCapabilities(): string[] {
        return [
            'UI/UX design',
            'React/Vue component creation',
            'TailwindCSS styling',
            'Responsive design',
            'Accessibility optimization',
            'Design system creation',
            'Figma/Canva integration',
        ];
    }
}
