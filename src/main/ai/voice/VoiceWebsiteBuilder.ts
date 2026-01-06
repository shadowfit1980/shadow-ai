/**
 * Voice Website Builder
 * Design websites and UIs using voice commands
 * Grok Recommendation: Voice-Designed Websites
 */
import { EventEmitter } from 'events';

interface VoiceCommand {
    raw: string;
    intent: string;
    entities: Record<string, string>;
    confidence: number;
}

interface UIComponent {
    id: string;
    type: 'header' | 'nav' | 'section' | 'footer' | 'hero' | 'card' | 'button' | 'form' | 'grid' | 'list' | 'image' | 'text';
    properties: Record<string, unknown>;
    children: UIComponent[];
    styles: Record<string, string>;
}

interface WebsiteSpec {
    name: string;
    pages: PageSpec[];
    globalStyles: Record<string, string>;
    colorScheme: ColorScheme;
    typography: Typography;
}

interface PageSpec {
    name: string;
    route: string;
    components: UIComponent[];
    layout: 'single-column' | 'two-column' | 'grid' | 'full-width';
}

interface ColorScheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
}

interface Typography {
    fontFamily: string;
    headingFont: string;
    baseFontSize: string;
    headingSizes: { h1: string; h2: string; h3: string; h4: string };
}

export class VoiceWebsiteBuilder extends EventEmitter {
    private static instance: VoiceWebsiteBuilder;
    private currentSpec: WebsiteSpec;
    private commandHistory: VoiceCommand[] = [];
    private colorPresets: Map<string, ColorScheme> = new Map();

    private constructor() {
        super();
        this.currentSpec = this.createDefaultSpec();
        this.initializeColorPresets();
    }

    static getInstance(): VoiceWebsiteBuilder {
        if (!VoiceWebsiteBuilder.instance) {
            VoiceWebsiteBuilder.instance = new VoiceWebsiteBuilder();
        }
        return VoiceWebsiteBuilder.instance;
    }

    private createDefaultSpec(): WebsiteSpec {
        return {
            name: 'Untitled Website',
            pages: [{
                name: 'Home',
                route: '/',
                components: [],
                layout: 'single-column'
            }],
            globalStyles: {},
            colorScheme: {
                primary: '#3b82f6',
                secondary: '#8b5cf6',
                accent: '#f59e0b',
                background: '#0f172a',
                text: '#f8fafc',
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#ef4444'
            },
            typography: {
                fontFamily: 'Inter, sans-serif',
                headingFont: 'Inter, sans-serif',
                baseFontSize: '16px',
                headingSizes: { h1: '3rem', h2: '2.25rem', h3: '1.875rem', h4: '1.5rem' }
            }
        };
    }

    private initializeColorPresets(): void {
        this.colorPresets.set('cyberpunk', {
            primary: '#00ff9f', secondary: '#ff00ff', accent: '#00d4ff',
            background: '#0a0a0a', text: '#ffffff', success: '#00ff9f', warning: '#ffff00', error: '#ff0055'
        });
        this.colorPresets.set('dark', {
            primary: '#3b82f6', secondary: '#6366f1', accent: '#ec4899',
            background: '#0f172a', text: '#f8fafc', success: '#22c55e', warning: '#f59e0b', error: '#ef4444'
        });
        this.colorPresets.set('light', {
            primary: '#2563eb', secondary: '#7c3aed', accent: '#db2777',
            background: '#ffffff', text: '#0f172a', success: '#16a34a', warning: '#d97706', error: '#dc2626'
        });
        this.colorPresets.set('ocean', {
            primary: '#0ea5e9', secondary: '#06b6d4', accent: '#14b8a6',
            background: '#0c4a6e', text: '#f0f9ff', success: '#22d3ee', warning: '#fcd34d', error: '#f87171'
        });
        this.colorPresets.set('forest', {
            primary: '#22c55e', secondary: '#16a34a', accent: '#84cc16',
            background: '#14532d', text: '#f0fdf4', success: '#4ade80', warning: '#facc15', error: '#f87171'
        });
    }

    parseVoiceCommand(voiceText: string): VoiceCommand {
        const text = voiceText.toLowerCase().trim();
        let intent = 'unknown';
        const entities: Record<string, string> = {};
        let confidence = 0.5;

        // Layout commands
        if (/add\s+(a\s+)?(header|navigation|nav|footer|hero|section|card|button|form|grid|list|image|text)/i.test(text)) {
            intent = 'add_component';
            const match = text.match(/(header|navigation|nav|footer|hero|section|card|button|form|grid|list|image|text)/i);
            entities.component = match?.[1].toLowerCase() === 'navigation' ? 'nav' : match?.[1].toLowerCase() || '';
            confidence = 0.9;
        }
        else if (/create\s+(a\s+)?page\s+(called|named)?\s*(.+)/i.test(text)) {
            intent = 'create_page';
            const match = text.match(/page\s+(?:called|named)?\s*(.+)/i);
            entities.pageName = match?.[1].trim() || 'New Page';
            confidence = 0.85;
        }
        else if (/set\s+(the\s+)?color\s+(scheme|theme)?\s*(to\s+)?(.+)/i.test(text)) {
            intent = 'set_color_scheme';
            const match = text.match(/(cyberpunk|dark|light|ocean|forest)/i);
            entities.scheme = match?.[1].toLowerCase() || 'dark';
            confidence = 0.9;
        }
        else if (/change\s+(the\s+)?layout\s+(to\s+)?(.+)/i.test(text)) {
            intent = 'change_layout';
            const match = text.match(/(single|two|grid|full)/i);
            entities.layout = match?.[1].toLowerCase() || 'single-column';
            confidence = 0.85;
        }
        else if (/set\s+(the\s+)?primary\s+color\s+(to\s+)?(.+)/i.test(text)) {
            intent = 'set_primary_color';
            const match = text.match(/to\s+(.+)/i);
            entities.color = this.parseColor(match?.[1] || 'blue');
            confidence = 0.85;
        }
        else if (/make\s+(it|the\s+background)\s+(.+)/i.test(text)) {
            intent = 'set_background';
            const match = text.match(/make\s+(?:it|the\s+background)\s+(.+)/i);
            entities.color = this.parseColor(match?.[1] || 'dark');
            confidence = 0.8;
        }
        else if (/add\s+(some\s+)?text\s+(saying|that\s+says)?\s*(.+)/i.test(text)) {
            intent = 'add_text';
            const match = text.match(/(?:saying|says)?\s*["\']?(.+?)["\']?$/i);
            entities.content = match?.[1] || 'Sample text';
            confidence = 0.85;
        }
        else if (/remove\s+(the\s+)?(last|previous)\s+component/i.test(text)) {
            intent = 'remove_last';
            confidence = 0.9;
        }
        else if (/undo/i.test(text)) {
            intent = 'undo';
            confidence = 0.95;
        }
        else if (/generate\s+(the\s+)?code/i.test(text)) {
            intent = 'generate_code';
            confidence = 0.95;
        }
        else if (/preview/i.test(text)) {
            intent = 'preview';
            confidence = 0.95;
        }

        const command: VoiceCommand = { raw: voiceText, intent, entities, confidence };
        this.commandHistory.push(command);
        return command;
    }

    private parseColor(colorText: string): string {
        const colorMap: Record<string, string> = {
            'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e', 'yellow': '#fbbf24',
            'purple': '#8b5cf6', 'pink': '#ec4899', 'orange': '#f97316', 'cyan': '#06b6d4',
            'teal': '#14b8a6', 'indigo': '#6366f1', 'dark': '#0f172a', 'light': '#f8fafc',
            'black': '#000000', 'white': '#ffffff', 'gray': '#6b7280', 'grey': '#6b7280',
            'neon green': '#00ff9f', 'neon pink': '#ff00ff', 'neon blue': '#00d4ff'
        };
        return colorMap[colorText.toLowerCase()] || colorText;
    }

    executeCommand(command: VoiceCommand): { success: boolean; message: string; spec?: WebsiteSpec } {
        switch (command.intent) {
            case 'add_component':
                return this.addComponent(command.entities.component);
            case 'create_page':
                return this.createPage(command.entities.pageName);
            case 'set_color_scheme':
                return this.setColorScheme(command.entities.scheme);
            case 'change_layout':
                return this.changeLayout(command.entities.layout);
            case 'set_primary_color':
                return this.setPrimaryColor(command.entities.color);
            case 'set_background':
                return this.setBackgroundColor(command.entities.color);
            case 'add_text':
                return this.addTextComponent(command.entities.content);
            case 'remove_last':
                return this.removeLastComponent();
            case 'generate_code':
                return { success: true, message: 'Code generation ready', spec: this.currentSpec };
            case 'preview':
                return { success: true, message: 'Preview ready', spec: this.currentSpec };
            default:
                return { success: false, message: `Unknown command: ${command.raw}` };
        }
    }

    private addComponent(componentType: string): { success: boolean; message: string } {
        const id = `${componentType}_${Date.now()}`;
        const component: UIComponent = {
            id,
            type: componentType as UIComponent['type'],
            properties: {},
            children: [],
            styles: this.getDefaultStyles(componentType)
        };

        const currentPage = this.currentSpec.pages[0];
        currentPage.components.push(component);
        this.emit('componentAdded', component);

        return { success: true, message: `Added ${componentType} component` };
    }

    private getDefaultStyles(componentType: string): Record<string, string> {
        const baseStyles: Record<string, Record<string, string>> = {
            header: { padding: '1rem 2rem', backgroundColor: 'var(--bg-secondary)' },
            nav: { display: 'flex', gap: '1rem', padding: '1rem' },
            hero: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
            section: { padding: '4rem 2rem' },
            card: { padding: '1.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)' },
            button: { padding: '0.75rem 1.5rem', borderRadius: '0.375rem', backgroundColor: 'var(--primary)' },
            form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
            footer: { padding: '2rem', backgroundColor: 'var(--bg-secondary)' }
        };
        return baseStyles[componentType] || {};
    }

    private createPage(pageName: string): { success: boolean; message: string } {
        const route = '/' + pageName.toLowerCase().replace(/\s+/g, '-');
        const page: PageSpec = {
            name: pageName,
            route,
            components: [],
            layout: 'single-column'
        };
        this.currentSpec.pages.push(page);
        this.emit('pageCreated', page);
        return { success: true, message: `Created page: ${pageName}` };
    }

    private setColorScheme(schemeName: string): { success: boolean; message: string } {
        const scheme = this.colorPresets.get(schemeName);
        if (scheme) {
            this.currentSpec.colorScheme = { ...scheme };
            this.emit('colorSchemeChanged', scheme);
            return { success: true, message: `Applied ${schemeName} color scheme` };
        }
        return { success: false, message: `Unknown color scheme: ${schemeName}` };
    }

    private changeLayout(layout: string): { success: boolean; message: string } {
        const layoutMap: Record<string, PageSpec['layout']> = {
            'single': 'single-column',
            'two': 'two-column',
            'grid': 'grid',
            'full': 'full-width'
        };
        const layoutType = layoutMap[layout] || 'single-column';
        this.currentSpec.pages[0].layout = layoutType;
        this.emit('layoutChanged', layoutType);
        return { success: true, message: `Changed layout to ${layoutType}` };
    }

    private setPrimaryColor(color: string): { success: boolean; message: string } {
        this.currentSpec.colorScheme.primary = color;
        this.emit('colorChanged', { type: 'primary', color });
        return { success: true, message: `Set primary color to ${color}` };
    }

    private setBackgroundColor(color: string): { success: boolean; message: string } {
        this.currentSpec.colorScheme.background = color;
        this.emit('colorChanged', { type: 'background', color });
        return { success: true, message: `Set background color to ${color}` };
    }

    private addTextComponent(content: string): { success: boolean; message: string } {
        const component: UIComponent = {
            id: `text_${Date.now()}`,
            type: 'text',
            properties: { content },
            children: [],
            styles: { fontSize: '1rem', lineHeight: '1.6' }
        };
        this.currentSpec.pages[0].components.push(component);
        return { success: true, message: 'Added text component' };
    }

    private removeLastComponent(): { success: boolean; message: string } {
        const components = this.currentSpec.pages[0].components;
        if (components.length > 0) {
            const removed = components.pop();
            this.emit('componentRemoved', removed);
            return { success: true, message: 'Removed last component' };
        }
        return { success: false, message: 'No components to remove' };
    }

    generateCode(framework: 'react' | 'html' | 'vue' = 'react'): string {
        switch (framework) {
            case 'react':
                return this.generateReactCode();
            case 'html':
                return this.generateHTMLCode();
            case 'vue':
                return this.generateVueCode();
            default:
                return this.generateReactCode();
        }
    }

    private generateReactCode(): string {
        const { colorScheme, pages, typography } = this.currentSpec;
        const page = pages[0];

        const cssVars = `
:root {
  --primary: ${colorScheme.primary};
  --secondary: ${colorScheme.secondary};
  --accent: ${colorScheme.accent};
  --background: ${colorScheme.background};
  --text: ${colorScheme.text};
  --font-family: ${typography.fontFamily};
}`;

        const componentCode = page.components.map(comp => this.generateReactComponent(comp)).join('\n      ');

        return `import React from 'react';
import './styles.css';

${cssVars}

export default function ${page.name.replace(/\s+/g, '')}Page() {
  return (
    <div className="page ${page.layout}">
      ${componentCode || '<!-- Add components using voice commands -->'}
    </div>
  );
}`;
    }

    private generateReactComponent(comp: UIComponent): string {
        const style = Object.entries(comp.styles).map(([k, v]) => `${k}: '${v}'`).join(', ');

        switch (comp.type) {
            case 'header':
                return `<header style={{ ${style} }}><h1>Header</h1></header>`;
            case 'nav':
                return `<nav style={{ ${style} }}><a href="/">Home</a><a href="/about">About</a></nav>`;
            case 'hero':
                return `<section className="hero" style={{ ${style} }}><h1>Welcome</h1><p>Your amazing website</p></section>`;
            case 'section':
                return `<section style={{ ${style} }}><h2>Section Title</h2></section>`;
            case 'card':
                return `<div className="card" style={{ ${style} }}><h3>Card Title</h3><p>Card content</p></div>`;
            case 'button':
                return `<button style={{ ${style} }}>Click Me</button>`;
            case 'footer':
                return `<footer style={{ ${style} }}><p>© 2025 Your Company</p></footer>`;
            case 'text':
                return `<p style={{ ${style} }}>${comp.properties.content || 'Text content'}</p>`;
            default:
                return `<div style={{ ${style} }}>${comp.type}</div>`;
        }
    }

    private generateHTMLCode(): string {
        const { colorScheme, pages, typography } = this.currentSpec;
        const page = pages[0];

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.currentSpec.name}</title>
  <style>
    :root {
      --primary: ${colorScheme.primary};
      --secondary: ${colorScheme.secondary};
      --accent: ${colorScheme.accent};
      --background: ${colorScheme.background};
      --text: ${colorScheme.text};
    }
    body {
      font-family: ${typography.fontFamily};
      background: var(--background);
      color: var(--text);
      margin: 0;
    }
  </style>
</head>
<body>
  ${page.components.map(c => this.generateHTMLComponent(c)).join('\n  ')}
</body>
</html>`;
    }

    private generateHTMLComponent(comp: UIComponent): string {
        const style = Object.entries(comp.styles).map(([k, v]) => `${this.camelToKebab(k)}: ${v}`).join('; ');

        switch (comp.type) {
            case 'header': return `<header style="${style}"><h1>Header</h1></header>`;
            case 'hero': return `<section class="hero" style="${style}"><h1>Welcome</h1></section>`;
            case 'footer': return `<footer style="${style}"><p>© 2025</p></footer>`;
            default: return `<div style="${style}">${comp.type}</div>`;
        }
    }

    private generateVueCode(): string {
        return `<template>
  <div class="page">
    <!-- Generated components will appear here -->
  </div>
</template>

<script setup>
// Vue 3 Composition API
</script>

<style scoped>
.page {
  background: ${this.currentSpec.colorScheme.background};
  color: ${this.currentSpec.colorScheme.text};
}
</style>`;
    }

    private camelToKebab(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    getSpec(): WebsiteSpec {
        return this.currentSpec;
    }

    resetSpec(): void {
        this.currentSpec = this.createDefaultSpec();
        this.commandHistory = [];
        this.emit('specReset');
    }

    processVoice(voiceText: string): { success: boolean; message: string; spec?: WebsiteSpec } {
        const command = this.parseVoiceCommand(voiceText);
        return this.executeCommand(command);
    }
}

export const voiceWebsiteBuilder = VoiceWebsiteBuilder.getInstance();
