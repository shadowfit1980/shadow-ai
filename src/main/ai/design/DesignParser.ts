/**
 * Design Parser
 * 
 * Convert designs to code using AI vision capabilities.
 * Supports Figma API integration and screenshot-to-code.
 * Inspired by Lovable and Firebase Studio.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface DesignSource {
    type: 'figma' | 'screenshot' | 'url' | 'file';
    source: string; // Figma URL, file path, or image URL
    name?: string;
}

export interface ParsedComponent {
    name: string;
    type: 'page' | 'component' | 'layout' | 'element';
    code: string;
    styles: string;
    children: ParsedComponent[];
    props?: Record<string, string>;
}

export interface DesignParseResult {
    success: boolean;
    components: ParsedComponent[];
    styles: string;
    assets: string[];
    suggestions: string[];
    error?: string;
}

export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: FigmaNode[];
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    fills?: Array<{
        type: string;
        color?: { r: number; g: number; b: number; a: number };
    }>;
    strokes?: Array<{
        type: string;
        color?: { r: number; g: number; b: number; a: number };
    }>;
    effects?: Array<{
        type: string;
        radius?: number;
    }>;
}

// ============================================================================
// DESIGN PARSER
// ============================================================================

export class DesignParser extends EventEmitter {
    private static instance: DesignParser;
    private modelManager: ModelManager;
    private figmaToken?: string;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): DesignParser {
        if (!DesignParser.instance) {
            DesignParser.instance = new DesignParser();
        }
        return DesignParser.instance;
    }

    /**
     * Set Figma API token
     */
    setFigmaToken(token: string): void {
        this.figmaToken = token;
    }

    // ========================================================================
    // MAIN PARSING METHODS
    // ========================================================================

    /**
     * Parse a design source and generate code
     */
    async parseDesign(source: DesignSource, options: {
        framework?: 'react' | 'vue' | 'svelte' | 'html';
        styling?: 'tailwind' | 'css' | 'styled-components';
        responsive?: boolean;
    } = {}): Promise<DesignParseResult> {
        const { framework = 'react', styling = 'tailwind', responsive = true } = options;

        this.emit('parse:started', { source, options });

        try {
            let imageData: string;

            switch (source.type) {
                case 'figma':
                    imageData = await this.getFigmaImage(source.source);
                    break;
                case 'screenshot':
                case 'file':
                    imageData = await this.loadImageFile(source.source);
                    break;
                case 'url':
                    imageData = await this.fetchImageUrl(source.source);
                    break;
                default:
                    throw new Error(`Unknown source type: ${source.type}`);
            }

            // Use AI to analyze the design
            const analysis = await this.analyzeDesign(imageData, framework, styling, responsive);

            this.emit('parse:completed', analysis);
            return analysis;

        } catch (error: any) {
            const result: DesignParseResult = {
                success: false,
                components: [],
                styles: '',
                assets: [],
                suggestions: [],
                error: error.message,
            };
            this.emit('parse:failed', result);
            return result;
        }
    }

    /**
     * Parse design from screenshot/image using AI vision
     */
    async screenshotToCode(imagePath: string, options: {
        framework?: 'react' | 'vue' | 'svelte' | 'html';
        styling?: 'tailwind' | 'css';
        componentName?: string;
    } = {}): Promise<DesignParseResult> {
        const { framework = 'react', styling = 'tailwind', componentName = 'GeneratedComponent' } = options;

        try {
            // Read image file
            const imageBuffer = await fs.readFile(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = this.getMimeType(imagePath);

            // Generate code using AI vision
            const prompt = `Analyze this UI screenshot and generate ${framework} code with ${styling} styling.

Requirements:
1. Create a pixel-perfect recreation of the UI
2. Use semantic HTML elements
3. Make it responsive
4. Extract colors, fonts, and spacing accurately
5. Name the main component: ${componentName}

Respond in JSON:
\`\`\`json
{
    "components": [
        {
            "name": "ComponentName",
            "type": "component",
            "code": "full component code",
            "styles": "additional CSS if needed"
        }
    ],
    "globalStyles": "global CSS variables and base styles",
    "colorPalette": ["#hex1", "#hex2"],
    "suggestions": ["improvement suggestions"]
}
\`\`\``;

            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert UI developer. Convert screenshots into clean, production-ready code.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            const parsed = this.parseJSON(response);

            return {
                success: true,
                components: parsed.components || [],
                styles: parsed.globalStyles || '',
                assets: [],
                suggestions: parsed.suggestions || [],
            };

        } catch (error: any) {
            return {
                success: false,
                components: [],
                styles: '',
                assets: [],
                suggestions: [],
                error: error.message,
            };
        }
    }

    // ========================================================================
    // FIGMA INTEGRATION
    // ========================================================================

    /**
     * Parse Figma file and generate components
     */
    async parseFigmaFile(fileUrl: string): Promise<DesignParseResult> {
        if (!this.figmaToken) {
            return {
                success: false,
                components: [],
                styles: '',
                assets: [],
                suggestions: ['Set Figma API token using setFigmaToken()'],
                error: 'Figma API token not configured',
            };
        }

        try {
            // Extract file key from URL
            const fileKey = this.extractFigmaFileKey(fileUrl);
            if (!fileKey) {
                throw new Error('Invalid Figma URL');
            }

            // Fetch file data from Figma API
            const fileData = await this.fetchFigmaFile(fileKey);

            // Convert Figma nodes to components
            const components = await this.convertFigmaNodes(fileData.document.children);

            // Extract colors and styles
            const styles = this.extractFigmaStyles(fileData);

            return {
                success: true,
                components,
                styles,
                assets: [],
                suggestions: [
                    'Review generated components for accuracy',
                    'Add interactivity and state management',
                    'Test responsive behavior',
                ],
            };

        } catch (error: any) {
            return {
                success: false,
                components: [],
                styles: '',
                assets: [],
                suggestions: [],
                error: error.message,
            };
        }
    }

    private extractFigmaFileKey(url: string): string | null {
        const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    private async fetchFigmaFile(fileKey: string): Promise<any> {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
            headers: {
                'X-Figma-Token': this.figmaToken!,
            },
        });

        if (!response.ok) {
            throw new Error(`Figma API error: ${response.statusText}`);
        }

        return response.json();
    }

    private async getFigmaImage(url: string): Promise<string> {
        const fileKey = this.extractFigmaFileKey(url);
        if (!fileKey || !this.figmaToken) {
            throw new Error('Invalid Figma URL or missing token');
        }

        // Get image export from Figma
        const response = await fetch(
            `https://api.figma.com/v1/images/${fileKey}?format=png`,
            {
                headers: { 'X-Figma-Token': this.figmaToken },
            }
        );

        const data = await response.json();
        return data.images?.[Object.keys(data.images)[0]] || '';
    }

    private async convertFigmaNodes(nodes: FigmaNode[]): Promise<ParsedComponent[]> {
        const components: ParsedComponent[] = [];

        for (const node of nodes) {
            const component = await this.nodeToComponent(node);
            if (component) {
                components.push(component);
            }
        }

        return components;
    }

    private async nodeToComponent(node: FigmaNode): Promise<ParsedComponent | null> {
        // Skip non-visual nodes
        if (['DOCUMENT', 'CANVAS'].includes(node.type)) {
            const children: ParsedComponent[] = [];
            if (node.children) {
                for (const child of node.children) {
                    const comp = await this.nodeToComponent(child);
                    if (comp) children.push(comp);
                }
            }
            return children.length > 0 ? {
                name: node.name,
                type: 'layout',
                code: '',
                styles: '',
                children,
            } : null;
        }

        // Generate component using AI
        const prompt = `Convert this Figma node to a React component:
Node: ${JSON.stringify(node, null, 2)}

Generate clean React + Tailwind code.`;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        return {
            name: this.toPascalCase(node.name),
            type: 'component',
            code: response,
            styles: '',
            children: [],
        };
    }

    private extractFigmaStyles(fileData: any): string {
        const colors: string[] = [];
        const fonts: string[] = [];

        // Extract from styles
        if (fileData.styles) {
            Object.values(fileData.styles as Record<string, any>).forEach((style: any) => {
                if (style.styleType === 'FILL') {
                    colors.push(style.name);
                }
                if (style.styleType === 'TEXT') {
                    fonts.push(style.name);
                }
            });
        }

        return `/* Figma Design Tokens */
:root {
  /* Colors from Figma */
  ${colors.map((c, i) => `--color-${i + 1}: /* ${c} */;`).join('\n  ')}
  
  /* Typography from Figma */
  ${fonts.map((f, i) => `--font-${i + 1}: /* ${f} */;`).join('\n  ')}
}`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async loadImageFile(filePath: string): Promise<string> {
        const buffer = await fs.readFile(filePath);
        const mimeType = this.getMimeType(filePath);
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    private async fetchImageUrl(url: string): Promise<string> {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/png';
        return `data:${mimeType};base64,${base64}`;
    }

    private async analyzeDesign(
        imageData: string,
        framework: string,
        styling: string,
        responsive: boolean
    ): Promise<DesignParseResult> {
        const prompt = `Analyze this UI design and generate ${framework} code.

Framework: ${framework}
Styling: ${styling}
Responsive: ${responsive}

Generate production-ready code that matches the design.`;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        return {
            success: true,
            components: [{
                name: 'GeneratedUI',
                type: 'page',
                code: response,
                styles: '',
                children: [],
            }],
            styles: '',
            assets: [],
            suggestions: [],
        };
    }

    private getMimeType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
        };
        return mimeTypes[ext] || 'image/png';
    }

    private toPascalCase(str: string): string {
        return str
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
            .replace(/^./, char => char.toUpperCase());
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
export const designParser = DesignParser.getInstance();
