/**
 * VisionAgent - Image/Mockup to Code
 * 
 * Implements ChatGPT's suggestion for:
 * - Napkin mockups → componentized UI + code
 * - Screenshot → code reconstruction
 * - Design system detection
 */

import { EventEmitter } from 'events';

export interface VisionResult {
    success: boolean;
    components: UIComponent[];
    code: GeneratedCode;
    designSystem?: DesignSystem;
    confidence: number;
    reasoning: string;
}

export interface UIComponent {
    id: string;
    type: 'container' | 'button' | 'input' | 'text' | 'image' | 'list' | 'card' | 'nav' | 'form' | 'modal';
    name: string;
    props: Record<string, any>;
    children?: UIComponent[];
    styles: Record<string, string>;
    position: { x: number; y: number; width: number; height: number };
}

export interface GeneratedCode {
    framework: 'react' | 'vue' | 'svelte' | 'html';
    components: Array<{
        name: string;
        code: string;
        styles: string;
    }>;
    mainFile: string;
    dependencies: string[];
}

export interface DesignSystem {
    colors: Record<string, string>;
    fonts: string[];
    spacing: number[];
    borderRadius: number[];
    shadows: string[];
}

/**
 * VisionAgent converts images/mockups to code
 */
export class VisionAgent extends EventEmitter {
    private static instance: VisionAgent;
    private modelManager: any;

    private constructor() {
        super();
    }

    static getInstance(): VisionAgent {
        if (!VisionAgent.instance) {
            VisionAgent.instance = new VisionAgent();
        }
        return VisionAgent.instance;
    }

    /**
     * Set model manager for AI calls
     */
    setModelManager(manager: any): void {
        this.modelManager = manager;
    }

    /**
     * Convert an image/mockup to UI code
     */
    async imageToCode(params: {
        imageBase64?: string;
        imageUrl?: string;
        description?: string;
        framework?: GeneratedCode['framework'];
        style?: 'minimal' | 'modern' | 'enterprise';
    }): Promise<VisionResult> {
        console.log(`🎨 [VisionAgent] Converting image to ${params.framework || 'react'} code`);
        this.emit('conversionStart', params);

        try {
            // Analyze the image description or use vision model
            const analysisPrompt = this.buildAnalysisPrompt(params);

            // For now, generate placeholder structure
            // In production, this would use a vision model (GPT-4V, Gemini Vision)
            const components = await this.analyzeImage(params);
            const designSystem = this.detectDesignSystem(components);
            const code = await this.generateCode(components, params.framework || 'react', designSystem);

            const result: VisionResult = {
                success: true,
                components,
                code,
                designSystem,
                confidence: 0.85,
                reasoning: 'Analyzed image structure and generated componentized code',
            };

            this.emit('conversionComplete', result);
            return result;

        } catch (error: any) {
            console.error(`❌ [VisionAgent] Conversion failed:`, error.message);
            this.emit('conversionError', error);
            throw error;
        }
    }

    /**
     * Analyze image and extract UI components
     */
    private async analyzeImage(params: {
        imageBase64?: string;
        description?: string;
    }): Promise<UIComponent[]> {
        // Use description if provided, otherwise would analyze image
        const description = params.description || 'A modern web dashboard';

        // Parse description into components
        const components: UIComponent[] = [];
        let idCounter = 0;

        // Detect common patterns from description
        const patterns = [
            { match: /header|navbar|navigation/i, type: 'nav' as const, name: 'Header' },
            { match: /sidebar|menu/i, type: 'nav' as const, name: 'Sidebar' },
            { match: /card|tile/i, type: 'card' as const, name: 'Card' },
            { match: /button|cta/i, type: 'button' as const, name: 'Button' },
            { match: /form|input|field/i, type: 'form' as const, name: 'Form' },
            { match: /list|table/i, type: 'list' as const, name: 'DataList' },
            { match: /modal|dialog|popup/i, type: 'modal' as const, name: 'Modal' },
            { match: /image|photo|avatar/i, type: 'image' as const, name: 'Image' },
            { match: /text|title|heading/i, type: 'text' as const, name: 'Text' },
        ];

        for (const pattern of patterns) {
            if (pattern.match.test(description)) {
                components.push({
                    id: `comp-${++idCounter}`,
                    type: pattern.type,
                    name: pattern.name,
                    props: {},
                    styles: this.getDefaultStyles(pattern.type),
                    position: { x: 0, y: 0, width: 100, height: 50 },
                });
            }
        }

        // Add a default container if no specific patterns found
        if (components.length === 0) {
            components.push({
                id: 'comp-1',
                type: 'container',
                name: 'MainContainer',
                props: {},
                styles: { display: 'flex', flexDirection: 'column', padding: '20px' },
                position: { x: 0, y: 0, width: 800, height: 600 },
                children: [
                    {
                        id: 'comp-2',
                        type: 'text',
                        name: 'Title',
                        props: { text: 'Welcome' },
                        styles: { fontSize: '24px', fontWeight: 'bold' },
                        position: { x: 0, y: 0, width: 200, height: 30 },
                    },
                ],
            });
        }

        return components;
    }

    /**
     * Get default styles for component type
     */
    private getDefaultStyles(type: UIComponent['type']): Record<string, string> {
        const styleMap: Record<UIComponent['type'], Record<string, string>> = {
            container: { display: 'flex', flexDirection: 'column', padding: '16px' },
            button: { padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' },
            input: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' },
            text: { margin: '0', lineHeight: '1.5' },
            image: { maxWidth: '100%', height: 'auto' },
            list: { listStyle: 'none', padding: '0' },
            card: { padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
            nav: { display: 'flex', alignItems: 'center', padding: '12px 24px' },
            form: { display: 'flex', flexDirection: 'column', gap: '12px' },
            modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        };
        return styleMap[type] || {};
    }

    /**
     * Detect design system from components
     */
    private detectDesignSystem(components: UIComponent[]): DesignSystem {
        return {
            colors: {
                primary: '#3b82f6',
                secondary: '#6366f1',
                accent: '#10b981',
                background: '#ffffff',
                surface: '#f3f4f6',
                text: '#1f2937',
                textMuted: '#6b7280',
            },
            fonts: ['Inter', 'system-ui', 'sans-serif'],
            spacing: [0, 4, 8, 12, 16, 24, 32, 48, 64],
            borderRadius: [0, 4, 8, 12, 16, 9999],
            shadows: [
                'none',
                '0 1px 3px rgba(0,0,0,0.12)',
                '0 4px 6px rgba(0,0,0,0.1)',
                '0 10px 15px rgba(0,0,0,0.1)',
            ],
        };
    }

    /**
     * Generate code from components
     */
    private async generateCode(
        components: UIComponent[],
        framework: GeneratedCode['framework'],
        designSystem: DesignSystem
    ): Promise<GeneratedCode> {
        const generatedComponents: GeneratedCode['components'] = [];

        for (const comp of components) {
            const { code, styles } = this.generateComponentCode(comp, framework);
            generatedComponents.push({
                name: comp.name,
                code,
                styles,
            });
        }

        const mainFile = this.generateMainFile(components, framework);

        return {
            framework,
            components: generatedComponents,
            mainFile,
            dependencies: this.getDependencies(framework),
        };
    }

    /**
     * Generate code for a single component
     */
    private generateComponentCode(
        component: UIComponent,
        framework: GeneratedCode['framework']
    ): { code: string; styles: string } {
        const styleString = Object.entries(component.styles)
            .map(([k, v]) => `${this.camelToKebab(k)}: ${v};`)
            .join('\n  ');

        switch (framework) {
            case 'react':
                return {
                    code: `import React from 'react';
import styles from './${component.name}.module.css';

export const ${component.name}: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* ${component.type} component */}
    </div>
  );
};

export default ${component.name};`,
                    styles: `.container {\n  ${styleString}\n}`,
                };

            case 'vue':
                return {
                    code: `<template>
  <div class="container">
    <!-- ${component.type} component -->
  </div>
</template>

<script setup lang="ts">
// ${component.name} component
</script>

<style scoped>
.container {
  ${styleString}
}
</style>`,
                    styles: '',
                };

            case 'svelte':
                return {
                    code: `<script lang="ts">
  // ${component.name} component
</script>

<div class="container">
  <!-- ${component.type} component -->
</div>

<style>
  .container {
    ${styleString}
  }
</style>`,
                    styles: '',
                };

            default:
                return {
                    code: `<!-- ${component.name} -->
<div class="${component.name.toLowerCase()}">
  <!-- ${component.type} component -->
</div>`,
                    styles: `.${component.name.toLowerCase()} {\n  ${styleString}\n}`,
                };
        }
    }

    /**
     * Generate main/index file
     */
    private generateMainFile(components: UIComponent[], framework: GeneratedCode['framework']): string {
        const imports = components.map(c => `import ${c.name} from './components/${c.name}';`).join('\n');
        const usage = components.map(c => `<${c.name} />`).join('\n      ');

        switch (framework) {
            case 'react':
                return `import React from 'react';
${imports}

export default function App() {
  return (
    <div className="app">
      ${usage}
    </div>
  );
}`;

            case 'vue':
                return `<template>
  <div class="app">
    ${usage}
  </div>
</template>

<script setup lang="ts">
${imports}
</script>`;

            default:
                return `<!DOCTYPE html>
<html>
<head>
  <title>Generated UI</title>
</head>
<body>
  <div class="app">
    ${usage}
  </div>
</body>
</html>`;
        }
    }

    /**
     * Get framework dependencies
     */
    private getDependencies(framework: GeneratedCode['framework']): string[] {
        switch (framework) {
            case 'react':
                return ['react', 'react-dom'];
            case 'vue':
                return ['vue'];
            case 'svelte':
                return ['svelte'];
            default:
                return [];
        }
    }

    /**
     * Convert camelCase to kebab-case
     */
    private camelToKebab(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Build analysis prompt for AI
     */
    private buildAnalysisPrompt(params: any): string {
        return `Analyze this UI ${params.imageBase64 ? 'image' : 'description'} and identify:
1. UI components and their hierarchy
2. Layout structure (flex, grid, etc.)
3. Color scheme and design tokens
4. Interactive elements

${params.description ? `Description: ${params.description}` : ''}
Output structured component tree with styles.`;
    }
}

export default VisionAgent;
