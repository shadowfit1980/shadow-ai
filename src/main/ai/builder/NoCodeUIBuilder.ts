/**
 * No-Code/Low-Code Hybrid UI Builder
 * Drag-drop UI builder that generates clean code
 * Grok Recommendation: No-Code/Low-Code Hybrid
 */
import { EventEmitter } from 'events';

interface DragDropComponent {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    properties: Record<string, unknown>;
    styles: Record<string, string>;
    children: DragDropComponent[];
    parentId?: string;
}

interface ComponentTemplate {
    type: string;
    displayName: string;
    category: 'layout' | 'input' | 'display' | 'navigation' | 'media' | 'data';
    defaultProps: Record<string, unknown>;
    defaultStyles: Record<string, string>;
    icon: string;
    canHaveChildren: boolean;
    allowedChildren?: string[];
}

interface UICanvas {
    id: string;
    name: string;
    width: number;
    height: number;
    components: DragDropComponent[];
    gridSize: number;
    snapToGrid: boolean;
    breakpoint: 'mobile' | 'tablet' | 'desktop';
}

interface CodeGenerationOptions {
    framework: 'react' | 'vue' | 'angular' | 'html' | 'svelte';
    cssFramework: 'tailwind' | 'vanilla' | 'styled-components' | 'css-modules';
    typescript: boolean;
    componentStyle: 'functional' | 'class';
}

interface HistoryEntry {
    timestamp: Date;
    action: 'add' | 'remove' | 'move' | 'resize' | 'style' | 'prop';
    componentId: string;
    before: DragDropComponent | null;
    after: DragDropComponent | null;
}

export class NoCodeUIBuilder extends EventEmitter {
    private static instance: NoCodeUIBuilder;
    private canvas: UICanvas;
    private templates: Map<string, ComponentTemplate> = new Map();
    private history: HistoryEntry[] = [];
    private historyIndex: number = -1;
    private selectedComponent: string | null = null;
    private clipboard: DragDropComponent | null = null;

    private constructor() {
        super();
        this.canvas = this.createDefaultCanvas();
        this.registerDefaultTemplates();
    }

    static getInstance(): NoCodeUIBuilder {
        if (!NoCodeUIBuilder.instance) {
            NoCodeUIBuilder.instance = new NoCodeUIBuilder();
        }
        return NoCodeUIBuilder.instance;
    }

    private createDefaultCanvas(): UICanvas {
        return {
            id: `canvas_${Date.now()}`,
            name: 'Untitled Project',
            width: 1920,
            height: 1080,
            components: [],
            gridSize: 8,
            snapToGrid: true,
            breakpoint: 'desktop'
        };
    }

    private registerDefaultTemplates(): void {
        const templates: ComponentTemplate[] = [
            // Layout
            { type: 'container', displayName: 'Container', category: 'layout', defaultProps: {}, defaultStyles: { display: 'flex', flexDirection: 'column', padding: '16px' }, icon: '📦', canHaveChildren: true },
            { type: 'row', displayName: 'Row', category: 'layout', defaultProps: {}, defaultStyles: { display: 'flex', flexDirection: 'row', gap: '16px' }, icon: '↔️', canHaveChildren: true },
            { type: 'column', displayName: 'Column', category: 'layout', defaultProps: {}, defaultStyles: { display: 'flex', flexDirection: 'column', gap: '8px' }, icon: '↕️', canHaveChildren: true },
            { type: 'grid', displayName: 'Grid', category: 'layout', defaultProps: { columns: 3 }, defaultStyles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }, icon: '⊞', canHaveChildren: true },
            { type: 'stack', displayName: 'Stack', category: 'layout', defaultProps: {}, defaultStyles: { position: 'relative' }, icon: '📚', canHaveChildren: true },

            // Input
            { type: 'button', displayName: 'Button', category: 'input', defaultProps: { label: 'Button', variant: 'primary' }, defaultStyles: { padding: '12px 24px', borderRadius: '8px', fontWeight: '600' }, icon: '🔘', canHaveChildren: false },
            { type: 'input', displayName: 'Text Input', category: 'input', defaultProps: { placeholder: 'Enter text...', type: 'text' }, defaultStyles: { padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }, icon: '✏️', canHaveChildren: false },
            { type: 'textarea', displayName: 'Text Area', category: 'input', defaultProps: { placeholder: 'Enter long text...', rows: 4 }, defaultStyles: { padding: '12px', borderRadius: '6px' }, icon: '📝', canHaveChildren: false },
            { type: 'checkbox', displayName: 'Checkbox', category: 'input', defaultProps: { label: 'Check me', checked: false }, defaultStyles: {}, icon: '☑️', canHaveChildren: false },
            { type: 'radio', displayName: 'Radio', category: 'input', defaultProps: { label: 'Option', name: 'group1' }, defaultStyles: {}, icon: '🔘', canHaveChildren: false },
            { type: 'select', displayName: 'Dropdown', category: 'input', defaultProps: { options: ['Option 1', 'Option 2', 'Option 3'] }, defaultStyles: { padding: '12px', borderRadius: '6px' }, icon: '▼', canHaveChildren: false },
            { type: 'slider', displayName: 'Slider', category: 'input', defaultProps: { min: 0, max: 100, value: 50 }, defaultStyles: { width: '100%' }, icon: '🎚️', canHaveChildren: false },
            { type: 'toggle', displayName: 'Toggle', category: 'input', defaultProps: { on: false }, defaultStyles: {}, icon: '🔀', canHaveChildren: false },

            // Display
            { type: 'text', displayName: 'Text', category: 'display', defaultProps: { content: 'Text content' }, defaultStyles: { fontSize: '16px', lineHeight: '1.5' }, icon: 'T', canHaveChildren: false },
            { type: 'heading', displayName: 'Heading', category: 'display', defaultProps: { content: 'Heading', level: 2 }, defaultStyles: { fontSize: '24px', fontWeight: '700' }, icon: 'H', canHaveChildren: false },
            { type: 'paragraph', displayName: 'Paragraph', category: 'display', defaultProps: { content: 'Lorem ipsum dolor sit amet...' }, defaultStyles: { fontSize: '16px', lineHeight: '1.6' }, icon: '¶', canHaveChildren: false },
            { type: 'badge', displayName: 'Badge', category: 'display', defaultProps: { label: 'New', variant: 'success' }, defaultStyles: { padding: '4px 8px', borderRadius: '9999px', fontSize: '12px' }, icon: '🏷️', canHaveChildren: false },
            { type: 'avatar', displayName: 'Avatar', category: 'display', defaultProps: { src: '', name: 'User' }, defaultStyles: { width: '40px', height: '40px', borderRadius: '50%' }, icon: '👤', canHaveChildren: false },
            { type: 'divider', displayName: 'Divider', category: 'display', defaultProps: {}, defaultStyles: { height: '1px', backgroundColor: '#e2e8f0', margin: '16px 0' }, icon: '—', canHaveChildren: false },
            { type: 'card', displayName: 'Card', category: 'display', defaultProps: {}, defaultStyles: { padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }, icon: '🃏', canHaveChildren: true },
            { type: 'modal', displayName: 'Modal', category: 'display', defaultProps: { title: 'Modal Title' }, defaultStyles: { padding: '24px', borderRadius: '12px', maxWidth: '500px' }, icon: '🪟', canHaveChildren: true },

            // Navigation
            { type: 'navbar', displayName: 'Navbar', category: 'navigation', defaultProps: { brand: 'Logo' }, defaultStyles: { display: 'flex', justifyContent: 'space-between', padding: '16px 32px' }, icon: '🧭', canHaveChildren: true },
            { type: 'sidebar', displayName: 'Sidebar', category: 'navigation', defaultProps: {}, defaultStyles: { width: '256px', height: '100%', padding: '16px' }, icon: '📑', canHaveChildren: true },
            { type: 'tabs', displayName: 'Tabs', category: 'navigation', defaultProps: { tabs: ['Tab 1', 'Tab 2', 'Tab 3'] }, defaultStyles: { display: 'flex', gap: '4px' }, icon: '🗂️', canHaveChildren: true },
            { type: 'breadcrumb', displayName: 'Breadcrumb', category: 'navigation', defaultProps: { items: ['Home', 'Products', 'Item'] }, defaultStyles: { display: 'flex', gap: '8px' }, icon: '🔗', canHaveChildren: false },
            { type: 'link', displayName: 'Link', category: 'navigation', defaultProps: { href: '#', label: 'Link' }, defaultStyles: { color: '#3b82f6', textDecoration: 'underline' }, icon: '🔗', canHaveChildren: false },

            // Media
            { type: 'image', displayName: 'Image', category: 'media', defaultProps: { src: '', alt: 'Image' }, defaultStyles: { maxWidth: '100%', height: 'auto', borderRadius: '8px' }, icon: '🖼️', canHaveChildren: false },
            { type: 'video', displayName: 'Video', category: 'media', defaultProps: { src: '', controls: true }, defaultStyles: { maxWidth: '100%', borderRadius: '8px' }, icon: '🎬', canHaveChildren: false },
            { type: 'icon', displayName: 'Icon', category: 'media', defaultProps: { name: 'star', size: 24 }, defaultStyles: {}, icon: '⭐', canHaveChildren: false },

            // Data
            { type: 'table', displayName: 'Table', category: 'data', defaultProps: { columns: ['Name', 'Value'], rows: [] }, defaultStyles: { width: '100%', borderCollapse: 'collapse' }, icon: '📊', canHaveChildren: false },
            { type: 'list', displayName: 'List', category: 'data', defaultProps: { items: ['Item 1', 'Item 2', 'Item 3'] }, defaultStyles: { listStyle: 'none', padding: '0' }, icon: '📋', canHaveChildren: false },
            { type: 'chart', displayName: 'Chart', category: 'data', defaultProps: { type: 'bar', data: [] }, defaultStyles: { width: '100%', height: '300px' }, icon: '📈', canHaveChildren: false },
            { type: 'progress', displayName: 'Progress Bar', category: 'data', defaultProps: { value: 50, max: 100 }, defaultStyles: { width: '100%', height: '8px', borderRadius: '4px' }, icon: '📊', canHaveChildren: false },
        ];

        templates.forEach(t => this.templates.set(t.type, t));
    }

    addComponent(type: string, x: number, y: number, parentId?: string): DragDropComponent | null {
        const template = this.templates.get(type);
        if (!template) return null;

        const component: DragDropComponent = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            x: this.canvas.snapToGrid ? this.snapToGrid(x) : x,
            y: this.canvas.snapToGrid ? this.snapToGrid(y) : y,
            width: 200,
            height: 100,
            properties: { ...template.defaultProps },
            styles: { ...template.defaultStyles },
            children: [],
            parentId
        };

        if (parentId) {
            const parent = this.findComponent(parentId);
            if (parent && this.canAddChild(parent.type, type)) {
                parent.children.push(component);
            } else {
                return null;
            }
        } else {
            this.canvas.components.push(component);
        }

        this.addToHistory('add', component.id, null, component);
        this.emit('componentAdded', component);
        return component;
    }

    private snapToGrid(value: number): number {
        return Math.round(value / this.canvas.gridSize) * this.canvas.gridSize;
    }

    private canAddChild(parentType: string, childType: string): boolean {
        const template = this.templates.get(parentType);
        if (!template?.canHaveChildren) return false;
        if (!template.allowedChildren) return true;
        return template.allowedChildren.includes(childType);
    }

    moveComponent(id: string, x: number, y: number): boolean {
        const component = this.findComponent(id);
        if (!component) return false;

        const before = { ...component };
        component.x = this.canvas.snapToGrid ? this.snapToGrid(x) : x;
        component.y = this.canvas.snapToGrid ? this.snapToGrid(y) : y;

        this.addToHistory('move', id, before, { ...component });
        this.emit('componentMoved', component);
        return true;
    }

    resizeComponent(id: string, width: number, height: number): boolean {
        const component = this.findComponent(id);
        if (!component) return false;

        const before = { ...component };
        component.width = Math.max(20, width);
        component.height = Math.max(20, height);

        this.addToHistory('resize', id, before, { ...component });
        this.emit('componentResized', component);
        return true;
    }

    updateStyle(id: string, styles: Record<string, string>): boolean {
        const component = this.findComponent(id);
        if (!component) return false;

        const before = { ...component };
        component.styles = { ...component.styles, ...styles };

        this.addToHistory('style', id, before, { ...component });
        this.emit('componentStyled', component);
        return true;
    }

    updateProperty(id: string, key: string, value: unknown): boolean {
        const component = this.findComponent(id);
        if (!component) return false;

        const before = { ...component };
        component.properties[key] = value;

        this.addToHistory('prop', id, before, { ...component });
        this.emit('componentUpdated', component);
        return true;
    }

    removeComponent(id: string): boolean {
        const component = this.findComponent(id);
        if (!component) return false;

        const before = { ...component };

        if (component.parentId) {
            const parent = this.findComponent(component.parentId);
            if (parent) {
                parent.children = parent.children.filter(c => c.id !== id);
            }
        } else {
            this.canvas.components = this.canvas.components.filter(c => c.id !== id);
        }

        this.addToHistory('remove', id, before, null);
        this.emit('componentRemoved', component);
        return true;
    }

    private findComponent(id: string): DragDropComponent | null {
        const search = (components: DragDropComponent[]): DragDropComponent | null => {
            for (const comp of components) {
                if (comp.id === id) return comp;
                const found = search(comp.children);
                if (found) return found;
            }
            return null;
        };
        return search(this.canvas.components);
    }

    selectComponent(id: string | null): void {
        this.selectedComponent = id;
        this.emit('selectionChanged', id);
    }

    copyComponent(id: string): boolean {
        const component = this.findComponent(id);
        if (!component) return false;
        this.clipboard = JSON.parse(JSON.stringify(component));
        return true;
    }

    pasteComponent(x: number, y: number): DragDropComponent | null {
        if (!this.clipboard) return null;

        const newComponent: DragDropComponent = {
            ...JSON.parse(JSON.stringify(this.clipboard)),
            id: `${this.clipboard.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            x: this.canvas.snapToGrid ? this.snapToGrid(x) : x,
            y: this.canvas.snapToGrid ? this.snapToGrid(y) : y,
            parentId: undefined
        };

        this.canvas.components.push(newComponent);
        this.addToHistory('add', newComponent.id, null, newComponent);
        this.emit('componentPasted', newComponent);
        return newComponent;
    }

    private addToHistory(action: HistoryEntry['action'], componentId: string, before: DragDropComponent | null, after: DragDropComponent | null): void {
        // Remove any redo history
        this.history = this.history.slice(0, this.historyIndex + 1);

        this.history.push({
            timestamp: new Date(),
            action,
            componentId,
            before: before ? JSON.parse(JSON.stringify(before)) : null,
            after: after ? JSON.parse(JSON.stringify(after)) : null
        });

        this.historyIndex = this.history.length - 1;
    }

    undo(): boolean {
        if (this.historyIndex < 0) return false;

        const entry = this.history[this.historyIndex];

        if (entry.action === 'add' && entry.after) {
            this.removeComponentDirect(entry.after.id);
        } else if (entry.action === 'remove' && entry.before) {
            this.restoreComponent(entry.before);
        } else if (entry.before) {
            this.replaceComponent(entry.componentId, entry.before);
        }

        this.historyIndex--;
        this.emit('undo', entry);
        return true;
    }

    redo(): boolean {
        if (this.historyIndex >= this.history.length - 1) return false;

        this.historyIndex++;
        const entry = this.history[this.historyIndex];

        if (entry.action === 'add' && entry.after) {
            this.restoreComponent(entry.after);
        } else if (entry.action === 'remove') {
            this.removeComponentDirect(entry.componentId);
        } else if (entry.after) {
            this.replaceComponent(entry.componentId, entry.after);
        }

        this.emit('redo', entry);
        return true;
    }

    private removeComponentDirect(id: string): void {
        this.canvas.components = this.canvas.components.filter(c => c.id !== id);
    }

    private restoreComponent(component: DragDropComponent): void {
        this.canvas.components.push(JSON.parse(JSON.stringify(component)));
    }

    private replaceComponent(id: string, replacement: DragDropComponent): void {
        const index = this.canvas.components.findIndex(c => c.id === id);
        if (index !== -1) {
            this.canvas.components[index] = JSON.parse(JSON.stringify(replacement));
        }
    }

    generateCode(options: CodeGenerationOptions): string {
        switch (options.framework) {
            case 'react':
                return this.generateReactCode(options);
            case 'vue':
                return this.generateVueCode(options);
            case 'html':
                return this.generateHTMLCode(options);
            default:
                return this.generateReactCode(options);
        }
    }

    private generateReactCode(options: CodeGenerationOptions): string {
        const ext = options.typescript ? 'tsx' : 'jsx';
        const componentName = this.canvas.name.replace(/\s+/g, '');

        const imports = new Set<string>();
        const renderComponents = this.canvas.components.map(c => this.generateReactComponent(c, options, imports)).join('\n      ');

        const typeAnnotation = options.typescript ? ': React.FC' : '';

        return `import React from 'react';
${options.cssFramework === 'styled-components' ? "import styled from 'styled-components';" : ''}
${Array.from(imports).join('\n')}

const ${componentName}${typeAnnotation} = () => {
  return (
    <div className="canvas" style={{ position: 'relative', width: '${this.canvas.width}px', height: '${this.canvas.height}px' }}>
      ${renderComponents}
    </div>
  );
};

export default ${componentName};
`;
    }

    private generateReactComponent(comp: DragDropComponent, options: CodeGenerationOptions, imports: Set<string>): string {
        const styleString = this.generateStyleString(comp, options);
        const childrenCode = comp.children.length > 0
            ? comp.children.map(c => this.generateReactComponent(c, options, imports)).join('\n        ')
            : '';

        switch (comp.type) {
            case 'button':
                return `<button ${styleString}>${comp.properties.label || 'Button'}</button>`;
            case 'input':
                return `<input type="${comp.properties.type || 'text'}" placeholder="${comp.properties.placeholder || ''}" ${styleString} />`;
            case 'text':
            case 'paragraph':
                return `<p ${styleString}>${comp.properties.content || ''}</p>`;
            case 'heading':
                const level = comp.properties.level || 2;
                return `<h${level} ${styleString}>${comp.properties.content || 'Heading'}</h${level}>`;
            case 'image':
                return `<img src="${comp.properties.src || ''}" alt="${comp.properties.alt || ''}" ${styleString} />`;
            case 'container':
            case 'row':
            case 'column':
            case 'card':
                return `<div ${styleString}>\n        ${childrenCode}\n      </div>`;
            default:
                return `<div ${styleString}>${comp.type}</div>`;
        }
    }

    private generateStyleString(comp: DragDropComponent, options: CodeGenerationOptions): string {
        if (options.cssFramework === 'tailwind') {
            return `className="${this.stylesToTailwind(comp.styles)}"`;
        }
        const styleObj = JSON.stringify({ ...comp.styles, position: 'absolute', left: `${comp.x}px`, top: `${comp.y}px`, width: `${comp.width}px`, height: `${comp.height}px` });
        return `style={${styleObj}}`;
    }

    private stylesToTailwind(styles: Record<string, string>): string {
        const mapping: Record<string, (v: string) => string> = {
            display: (v) => v === 'flex' ? 'flex' : v === 'grid' ? 'grid' : '',
            flexDirection: (v) => v === 'column' ? 'flex-col' : 'flex-row',
            padding: (v) => `p-${Math.round(parseInt(v) / 4)}`,
            gap: (v) => `gap-${Math.round(parseInt(v) / 4)}`,
            borderRadius: (v) => parseInt(v) >= 9999 ? 'rounded-full' : `rounded-lg`,
        };

        return Object.entries(styles)
            .map(([k, v]) => mapping[k]?.(v) || '')
            .filter(Boolean)
            .join(' ');
    }

    private generateVueCode(options: CodeGenerationOptions): string {
        const componentName = this.canvas.name.replace(/\s+/g, '');
        const template = this.canvas.components.map(c => this.generateVueComponent(c)).join('\n    ');

        return `<template>
  <div class="canvas">
    ${template}
  </div>
</template>

<script${options.typescript ? ' lang="ts"' : ''}>
export default {
  name: '${componentName}'
}
</script>

<style scoped>
.canvas {
  position: relative;
  width: ${this.canvas.width}px;
  height: ${this.canvas.height}px;
}
</style>
`;
    }

    private generateVueComponent(comp: DragDropComponent): string {
        const style = Object.entries(comp.styles).map(([k, v]) => `${this.camelToKebab(k)}: ${v}`).join('; ');
        return `<div style="position: absolute; left: ${comp.x}px; top: ${comp.y}px; ${style}">${comp.type}</div>`;
    }

    private generateHTMLCode(options: CodeGenerationOptions): string {
        const components = this.canvas.components.map(c => this.generateHTMLComponent(c)).join('\n    ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.canvas.name}</title>
  ${options.cssFramework === 'tailwind' ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  <style>
    .canvas { position: relative; width: ${this.canvas.width}px; height: ${this.canvas.height}px; }
  </style>
</head>
<body>
  <div class="canvas">
    ${components}
  </div>
</body>
</html>`;
    }

    private generateHTMLComponent(comp: DragDropComponent): string {
        const style = Object.entries(comp.styles).map(([k, v]) => `${this.camelToKebab(k)}: ${v}`).join('; ');
        return `<div style="position: absolute; left: ${comp.x}px; top: ${comp.y}px; width: ${comp.width}px; height: ${comp.height}px; ${style}">${comp.properties.content || comp.type}</div>`;
    }

    private camelToKebab(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    getCanvas(): UICanvas {
        return this.canvas;
    }

    getTemplates(): ComponentTemplate[] {
        return Array.from(this.templates.values());
    }

    getTemplatesByCategory(category: ComponentTemplate['category']): ComponentTemplate[] {
        return Array.from(this.templates.values()).filter(t => t.category === category);
    }

    setBreakpoint(breakpoint: UICanvas['breakpoint']): void {
        this.canvas.breakpoint = breakpoint;
        const widths = { mobile: 375, tablet: 768, desktop: 1920 };
        this.canvas.width = widths[breakpoint];
        this.emit('breakpointChanged', breakpoint);
    }

    exportCanvas(): string {
        return JSON.stringify(this.canvas, null, 2);
    }

    importCanvas(json: string): boolean {
        try {
            this.canvas = JSON.parse(json);
            this.emit('canvasImported', this.canvas);
            return true;
        } catch {
            return false;
        }
    }

    clearCanvas(): void {
        this.canvas = this.createDefaultCanvas();
        this.history = [];
        this.historyIndex = -1;
        this.emit('canvasCleared');
    }
}

export const noCodeUIBuilder = NoCodeUIBuilder.getInstance();
