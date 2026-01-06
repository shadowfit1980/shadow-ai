import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GoogleStitchService
 * AI-powered UI design generation using Gemini 2.5 Flash
 * Simulates Google Stitch functionality with intelligent prompting
 */
export class GoogleStitchService {
    private static instance: GoogleStitchService;
    private genAI: GoogleGenerativeAI;
    private modelPro: any;
    private modelFlash: any;

    private constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelPro = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        this.modelFlash = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    static getInstance(apiKey?: string): GoogleStitchService {
        if (!GoogleStitchService.instance) {
            if (!apiKey) {
                throw new Error('API key required for first initialization');
            }
            GoogleStitchService.instance = new GoogleStitchService(apiKey);
        }
        return GoogleStitchService.instance;
    }

    /**
     * Generate UI design from text prompt
     */
    async generateUI(prompt: string, options: UIGenerationOptions = {}): Promise<UIDesignResult> {
        const {
            model = 'flash',
            variants = 1,
            style = 'modern',
            platform = 'responsive',
            framework = 'html'
        } = options;

        const selectedModel = model === 'pro' ? this.modelPro : this.modelFlash;

        const systemPrompt = this.buildUIPrompt(prompt, style, platform, framework);

        try {
            const result = await selectedModel.generateContent(systemPrompt);
            const response = result.response.text();

            return this.parseUIResponse(response, framework);
        } catch (error: any) {
            console.error('❌ Google Stitch error:', error.message);
            throw error;
        }
    }

    /**
     * Generate multiple UI variants
     */
    async generateVariants(prompt: string, count: number, options: UIGenerationOptions = {}): Promise<UIDesignResult[]> {
        const variants: UIDesignResult[] = [];

        for (let i = 0; i < Math.min(count, 5); i++) {
            try {
                const variant = await this.generateUI(prompt, {
                    ...options,
                    style: this.getVariantStyle(i)
                });
                variants.push(variant);
            } catch (error) {
                console.error(`Failed to generate variant ${i + 1}:`, error);
            }
        }

        return variants;
    }

    /**
     * Generate UI from wireframe/screenshot description
     */
    async generateFromImage(imageDescription: string, options: UIGenerationOptions = {}): Promise<UIDesignResult> {
        const enhancedPrompt = `Based on this wireframe/screenshot description: "${imageDescription}", 
        create a fully functional UI implementation with modern design principles.`;

        return this.generateUI(enhancedPrompt, options);
    }

    /**
     * Generate production-ready code
     */
    async generateCode(design: UIDesignResult, framework: string): Promise<CodeExport> {
        const prompt = `Convert this UI design into production-ready ${framework} code:
        
Design Description: ${design.description}
Components: ${design.components.join(', ')}

Generate:
1. Complete ${framework} code
2. Styling (CSS or Tailwind)
3. Necessary imports
4. Component structure

Return as a JSON object with format:
{
  "files": [
    { "name": "Component.jsx", "content": "..." },
    { "name": "styles.css", "content": "..." }
  ],
  "instructions": "Setup and usage instructions"
}`;

        try {
            const result = await this.modelFlash.generateContent(prompt);
            const response = result.response.text();
            return this.parseCodeResponse(response, framework);
        } catch (error: any) {
            console.error('Code generation error:', error.message);
            throw error;
        }
    }

    /**
     * Build comprehensive UI generation prompt
     */
    private buildUIPrompt(userPrompt: string, style: string, platform: string, framework: string): string {
        return `You are Google Stitch, an expert UI/UX design assistant.

Generate a complete, production-ready UI design based on this prompt: "${userPrompt}"

Requirements:
- Style: ${style}
- Platform: ${platform}
- Framework: ${framework}
- Follow modern design principles
- Include responsive design
- Ensure accessibility (WCAG 2.1)
- Use contemporary color schemes
- Include micro-interactions and animations

Return a JSON object with this exact structure:
{
  "description": "Detailed description of the design",
  "components": ["List of UI components"],
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "layout": "Description of layout structure",
  "html": "Complete HTML code",
  "css": "Complete CSS code with animations",
  "features": ["List of key features"],
  "accessibility": ["Accessibility features implemented"]
}

Focus on creating a stunning, modern design that would impress at first glance.`;
    }

    /**
     * Parse UI generation response
     */
    private parseUIResponse(response: string, framework: string): UIDesignResult {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    description: parsed.description || 'UI Design',
                    components: parsed.components || [],
                    colors: parsed.colors || this.getDefaultColors(),
                    layout: parsed.layout || '',
                    html: parsed.html || '',
                    css: parsed.css || '',
                    features: parsed.features || [],
                    accessibility: parsed.accessibility || [],
                    framework
                };
            }

            // Fallback parsing
            return this.fallbackParse(response, framework);
        } catch (error) {
            console.warn('Failed to parse UI response, using fallback');
            return this.fallbackParse(response, framework);
        }
    }

    /**
     * Parse code generation response
     */
    private parseCodeResponse(response: string, framework: string): CodeExport {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    files: parsed.files || [],
                    instructions: parsed.instructions || '',
                    framework
                };
            }

            // Extract code blocks
            const files = [];
            const codeBlocks = response.matchAll(/```(\w+)?\n([\s\S]*?)```/g);

            for (const match of codeBlocks) {
                const lang = match[1] || 'txt';
                const content = match[2].trim();
                const extension = this.getExtension(lang, framework);

                files.push({
                    name: `Component.${extension}`,
                    content
                });
            }

            return {
                files,
                instructions: 'See generated files for implementation',
                framework
            };
        } catch (error) {
            console.error('Code parsing error:', error);
            return {
                files: [{ name: 'code.txt', content: response }],
                instructions: 'Manual parsing required',
                framework
            };
        }
    }

    /**
     * Get variant style based on index
     */
    private getVariantStyle(index: number): 'modern' | 'minimal' | 'vibrant' | 'professional' | 'creative' {
        const styles: Array<'modern' | 'minimal' | 'vibrant' | 'professional' | 'creative'> =
            ['modern', 'minimal', 'vibrant', 'professional', 'creative'];
        return styles[index % styles.length];
    }

    /**
     * Fallback parser when JSON parsing fails
     */
    private fallbackParse(response: string, framework: string): UIDesignResult {
        // Extract HTML
        const htmlMatch = response.match(/```html\n([\s\S]*?)```/);
        const html = htmlMatch ? htmlMatch[1].trim() : '';

        // Extract CSS
        const cssMatch = response.match(/```css\n([\s\S]*?)```/);
        const css = cssMatch ? cssMatch[1].trim() : '';

        return {
            description: 'Generated UI Design',
            components: ['Main Component'],
            colors: this.getDefaultColors(),
            layout: 'Responsive layout',
            html,
            css,
            features: ['Responsive design', 'Modern styling'],
            accessibility: ['Semantic HTML', 'ARIA labels'],
            framework
        };
    }

    /**
     * Get default color scheme
     */
    private getDefaultColors() {
        return {
            primary: '#06b6d4',
            secondary: '#8b5cf6',
            accent: '#f59e0b',
            background: '#0a0a0a',
            text: '#ffffff'
        };
    }

    /**
     * Get file extension based on language and framework
     */
    private getExtension(lang: string, framework: string): string {
        const extensions: Record<string, string> = {
            'javascript': 'js',
            'typescript': 'ts',
            'html': 'html',
            'css': 'css',
            'react': 'jsx',
            'vue': 'vue',
            'angular': 'component.ts'
        };

        return extensions[lang] || extensions[framework] || 'txt';
    }
}

// Types
export interface UIGenerationOptions {
    model?: 'pro' | 'flash';
    variants?: number;
    style?: 'modern' | 'minimal' | 'vibrant' | 'professional' | 'creative';
    platform?: 'web' | 'mobile' | 'responsive';
    framework?: 'html' | 'react' | 'vue' | 'angular';
}

export interface UIDesignResult {
    description: string;
    components: string[];
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    layout: string;
    html: string;
    css: string;
    features: string[];
    accessibility: string[];
    framework: string;
}

export interface CodeExport {
    files: Array<{ name: string; content: string }>;
    instructions: string;
    framework: string;
}

// Export singleton getter
export function getGoogleStitchService(apiKey?: string): GoogleStitchService {
    return GoogleStitchService.getInstance(apiKey);
}
