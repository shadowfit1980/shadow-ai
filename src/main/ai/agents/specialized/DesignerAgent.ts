/**
 * DesignerAgent - UI/UX Design Specialist
 * 
 * Responsible for creating beautiful, accessible user interfaces
 */

import { BaseAgent } from '../BaseAgent';
import {
    AgentMetadata,
    ExecutionStep,
    AgentContext,
    ProjectContext,
    DesignOutput,
    UIComponent,
    DesignSystem,
    AccessibilityReport,
    Asset
} from '../types';

export class DesignerAgent extends BaseAgent {
    get metadata(): AgentMetadata {
        return {
            type: 'designer',
            name: 'Shadow Designer',
            specialty: 'UI/UX Design & User Experience',
            capabilities: [
                {
                    name: 'UI Design',
                    description: 'Create beautiful, intuitive user interfaces',
                    confidence: 0.90
                },
                {
                    name: 'Design Systems',
                    description: 'Build consistent design systems',
                    confidence: 0.92
                },
                {
                    name: 'Accessibility',
                    description: 'Ensure WCAG compliance',
                    confidence: 0.88
                },
                {
                    name: 'Responsive Design',
                    description: 'Design for all screen sizes',
                    confidence: 0.91
                },
                {
                    name: 'Component Libraries',
                    description: 'Create reusable component systems',
                    confidence: 0.89
                }
            ],
            preferredModel: 'gpt-4',
            fallbackModel: 'gemini-pro'
        };
    }

    protected async buildPrompt(
        step: ExecutionStep,
        context: AgentContext,
        memory: ProjectContext
    ): Promise<string> {
        const architecture = context.previousResults.find(r => r.agentType === 'architect')?.output;
        const existingStyles = memory.styles[0]?.metadata.patterns;

        return `You are ${this.metadata.name}, an expert UI/UX designer with deep knowledge of modern design principles.

## Task
${step.description}

## Requirements
${step.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Architecture Context
${architecture ? JSON.stringify(architecture.techStack?.frontend || [], null, 2) : 'No frontend stack specified'}

## Existing Design Patterns
${existingStyles ? JSON.stringify(existingStyles, null, 2) : 'No existing patterns - create new design system'}

## Your Mission
Create a complete UI/UX design covering:

### 1. Design System
- Color palette (primary, secondary, accent, neutrals)
- Typography (fonts, sizes, weights, hierarchy)
- Spacing system (consistent spacing units)
- Breakpoints (mobile, tablet, desktop)
- Shadows and elevations
- Border radius standards

### 2. Component Design
- Reusable UI components
- Component variants and states
- Props and customization
- Interaction patterns
- Animations and transitions

### 3. Accessibility
- WCAG 2.1 Level AA compliance
- Color contrast ratios
- Keyboard navigation
- Screen reader support
- Focus management

### 4. Responsive Design
- Mobile-first approach
- Flexible layouts
- Breakpoint strategy
- Touch-friendly interactions

### 5. Assets
- Icon system
- Illustrations
- Images (placeholders)
- Animations

## Design Principles
1. **Clarity**: Clear visual hierarchy and purpose
2. **Consistency**: Unified design language
3. **Simplicity**: Remove unnecessary complexity
4. **Accessibility**: Usable by everyone
5. **Performance**: Fast, lightweight designs

## Output Format
Return your design as a JSON object:

\`\`\`json
{
  "components": [
    {
      "name": "Button",
      "type": "button",
      "props": [
        {
          "name": "variant",
          "type": "primary|secondary|ghost",
          "required": false,
          "default": "primary"
        }
      ],
      "states": ["default", "hover", "active", "disabled"],
      "variants": ["primary", "secondary", "ghost", "danger"]
    }
  ],
  "designSystem": {
    "colors": {
      "primary": "#0066FF",
      "secondary": "#6B7280",
      "accent": "#10B981",
      "background": "#FFFFFF",
      "text": "#111827"
    },
    "typography": {
      "fontFamily": "Inter, system-ui, sans-serif",
      "sizes": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem"
      },
      "weights": {
        "normal": 400,
        "medium": 500,
        "semibold": 600,
        "bold": 700
      }
    },
    "spacing": [0, 4, 8, 12, 16, 24, 32, 48, 64],
    "breakpoints": [
      {"name": "mobile", "minWidth": 0},
      {"name": "tablet", "minWidth": 768},
      {"name": "desktop", "minWidth": 1024}
    ]
  },
  "accessibility": {
    "score": 95,
    "issues": [],
    "recommendations": ["Use semantic HTML", "Add ARIA labels"],
    "wcagLevel": "AA"
  },
  "assets": [
    {
      "type": "icon",
      "name": "menu-icon",
      "path": "/assets/icons/menu.svg",
      "format": "svg"
    }
  ]
}
\`\`\`

Create a beautiful, accessible, professional design system.`;
    }

    protected async parseResponse(response: string, step: ExecutionStep): Promise<DesignOutput> {
        const codeBlocks = this.extractCodeBlocks(response);

        let designJSON: any = null;

        for (const block of codeBlocks) {
            if (block.language === 'json' || block.language === 'javascript') {
                try {
                    designJSON = JSON.parse(block.code);
                    break;
                } catch {
                    continue;
                }
            }
        }

        if (!designJSON) {
            designJSON = this.extractJSON(response);
        }

        if (!designJSON) {
            console.warn('⚠️  Could not parse JSON design output, using fallback');
            return this.fallbackParse(response);
        }

        return {
            components: this.parseComponents(designJSON.components || []),
            designSystem: this.parseDesignSystem(designJSON.designSystem || {}),
            accessibility: this.parseAccessibility(designJSON.accessibility || {}),
            assets: this.parseAssets(designJSON.assets || [])
        };
    }

    private parseComponents(componentsData: any[]): UIComponent[] {
        return componentsData.map(comp => ({
            name: comp.name || 'UnnamedComponent',
            type: comp.type || 'div',
            props: Array.isArray(comp.props) ? comp.props.map((p: any) => ({
                name: p.name || 'prop',
                type: p.type || 'string',
                required: p.required === true,
                default: p.default
            })) : [],
            states: Array.isArray(comp.states) ? comp.states : ['default'],
            variants: Array.isArray(comp.variants) ? comp.variants : []
        }));
    }

    private parseDesignSystem(systemData: any): DesignSystem {
        return {
            colors: systemData.colors || {
                primary: '#0066FF',
                secondary: '#6B7280',
                accent: '#10B981',
                background: '#FFFFFF',
                text: '#111827'
            },
            typography: systemData.typography || {
                fontFamily: 'Inter, system-ui, sans-serif',
                sizes: {
                    base: '1rem',
                    lg: '1.125rem',
                    xl: '1.25rem'
                },
                weights: {
                    normal: 400,
                    medium: 500,
                    bold: 700
                }
            },
            spacing: Array.isArray(systemData.spacing) ? systemData.spacing : [0, 4, 8, 16, 24, 32],
            breakpoints: Array.isArray(systemData.breakpoints) ? systemData.breakpoints.map((bp: any) => ({
                name: bp.name || 'breakpoint',
                minWidth: bp.minWidth || 0
            })) : [
                { name: 'mobile', minWidth: 0 },
                { name: 'desktop', minWidth: 1024 }
            ]
        };
    }

    private parseAccessibility(accessData: any): AccessibilityReport {
        return {
            score: accessData.score || 0,
            issues: Array.isArray(accessData.issues) ? accessData.issues : [],
            recommendations: Array.isArray(accessData.recommendations) ? accessData.recommendations : [],
            wcagLevel: accessData.wcagLevel || 'A'
        };
    }

    private parseAssets(assetsData: any[]): Asset[] {
        return assetsData.map(asset => ({
            type: asset.type || 'image',
            name: asset.name || 'unnamed',
            path: asset.path || '/assets/',
            format: asset.format || 'png'
        }));
    }

    private fallbackParse(response: string): DesignOutput {
        return {
            components: [{
                name: 'Container',
                type: 'div',
                props: [],
                states: ['default'],
                variants: []
            }],
            designSystem: {
                colors: {
                    primary: '#0066FF',
                    secondary: '#6B7280',
                    accent: '#10B981',
                    background: '#FFFFFF',
                    text: '#111827'
                },
                typography: {
                    fontFamily: 'Inter, system-ui, sans-serif',
                    sizes: { base: '1rem' },
                    weights: { normal: 400 }
                },
                spacing: [0, 4, 8, 16, 24, 32],
                breakpoints: [
                    { name: 'mobile', minWidth: 0 },
                    { name: 'desktop', minWidth: 1024 }
                ]
            },
            accessibility: {
                score: 0,
                issues: ['Could not parse accessibility report'],
                recommendations: [],
                wcagLevel: 'A'
            },
            assets: []
        };
    }

    protected async validateOutput(output: DesignOutput, step: ExecutionStep) {
        const issues: any[] = [];
        const warnings: any[] = [];

        if (!output.components || output.components.length === 0) {
            warnings.push({
                severity: 'major',
                description: 'No UI components defined'
            });
        }

        if (output.accessibility.score < 80) {
            warnings.push({
                severity: 'minor',
                description: `Accessibility score is ${output.accessibility.score}/100`
            });
        }

        if (!output.designSystem.colors.primary) {
            issues.push({
                severity: 'major',
                description: 'No primary color defined in design system'
            });
        }

        return {
            valid: issues.length === 0,
            critical: false,
            issues,
            warnings
        };
    }

    protected calculateConfidence(output: DesignOutput): number {
        let score = 0.5;

        if (output.components.length > 0) score += 0.15;
        if (output.designSystem.colors.primary) score += 0.1;
        if (output.accessibility.score > 80) score += 0.1;
        if (output.assets.length > 0) score += 0.05;
        if (output.designSystem.breakpoints.length > 1) score += 0.1;

        return Math.min(score, 1.0);
    }
}
