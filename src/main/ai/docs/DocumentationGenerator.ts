/**
 * AI Documentation Generator
 * 
 * Auto-generate full documentation from codebase.
 * API references, tutorials, examples, kept in sync with code.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface DocSection {
    title: string;
    content: string;
    type: 'overview' | 'api' | 'tutorial' | 'example' | 'faq';
    file?: string;
    order: number;
}

export interface APIDoc {
    name: string;
    type: 'function' | 'class' | 'interface' | 'type' | 'constant';
    signature: string;
    description: string;
    params?: Array<{ name: string; type: string; description: string }>;
    returns?: { type: string; description: string };
    examples?: string[];
    file: string;
    line: number;
}

export interface Documentation {
    projectName: string;
    version: string;
    sections: DocSection[];
    api: APIDoc[];
    generatedAt: Date;
}

// ============================================================================
// DOCUMENTATION GENERATOR
// ============================================================================

export class DocumentationGenerator extends EventEmitter {
    private static instance: DocumentationGenerator;
    private modelManager: ModelManager;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): DocumentationGenerator {
        if (!DocumentationGenerator.instance) {
            DocumentationGenerator.instance = new DocumentationGenerator();
        }
        return DocumentationGenerator.instance;
    }

    // ========================================================================
    // GENERATION
    // ========================================================================

    /**
     * Generate full documentation for a project
     */
    async generateDocs(projectPath: string): Promise<Documentation> {
        this.emit('generation:started', { projectPath });

        // Read package.json for project info
        let projectName = 'Project';
        let version = '1.0.0';
        try {
            const pkg = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
            projectName = pkg.name || projectName;
            version = pkg.version || version;
        } catch { }

        // Generate sections
        const sections: DocSection[] = [];
        sections.push(await this.generateOverview(projectPath, projectName));
        sections.push(...await this.generateTutorials(projectPath));

        // Extract API docs
        const api = await this.extractAPI(projectPath);

        const docs: Documentation = {
            projectName,
            version,
            sections,
            api,
            generatedAt: new Date(),
        };

        this.emit('generation:completed', docs);
        return docs;
    }

    /**
     * Generate overview section
     */
    private async generateOverview(projectPath: string, projectName: string): Promise<DocSection> {
        let readme = '';
        try {
            readme = await fs.readFile(path.join(projectPath, 'README.md'), 'utf-8');
        } catch { }

        const prompt = `Generate a professional overview for the ${projectName} project.
${readme ? `Existing README:\n${readme.slice(0, 2000)}` : ''}

Include:
1. Brief description
2. Key features
3. Getting started
4. Installation

Keep it concise and professional.`;

        const content = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        return {
            title: 'Overview',
            content,
            type: 'overview',
            order: 0,
        };
    }

    /**
     * Generate tutorials
     */
    private async generateTutorials(projectPath: string): Promise<DocSection[]> {
        const tutorials: DocSection[] = [];

        // Generate quick start tutorial
        const quickStart = await this.generateTutorial(projectPath, 'Quick Start',
            'Create a basic quick start tutorial showing how to use this project.');
        tutorials.push(quickStart);

        return tutorials;
    }

    /**
     * Generate a tutorial section
     */
    private async generateTutorial(projectPath: string, title: string, description: string): Promise<DocSection> {
        const prompt = `${description}

Requirements:
1. Step-by-step instructions
2. Code examples
3. Expected outputs
4. Common pitfalls

Keep it practical and beginner-friendly.`;

        const content = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        return {
            title,
            content,
            type: 'tutorial',
            order: tutorials.length + 1,
        };
    }

    // ========================================================================
    // API EXTRACTION
    // ========================================================================

    /**
     * Extract API documentation from code
     */
    async extractAPI(projectPath: string): Promise<APIDoc[]> {
        const apiDocs: APIDoc[] = [];

        try {
            // Find TypeScript/JavaScript files
            const { stdout } = await import('child_process').then(cp =>
                require('util').promisify(cp.exec)(
                    'find . -name "*.ts" -not -path "./node_modules/*" | head -20',
                    { cwd: projectPath }
                )
            );

            const files = stdout.trim().split('\n').filter(Boolean);

            for (const file of files) {
                const filePath = path.join(projectPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const extracted = this.extractFromFile(content, file);
                apiDocs.push(...extracted);
            }
        } catch { }

        return apiDocs;
    }

    /**
     * Extract documentation from a single file
     */
    private extractFromFile(content: string, file: string): APIDoc[] {
        const docs: APIDoc[] = [];

        // Extract exported functions
        const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            const [, name, params, returnType] = match;
            const line = content.substring(0, match.index).split('\n').length;

            docs.push({
                name,
                type: 'function',
                signature: `function ${name}(${params})${returnType ? `: ${returnType.trim()}` : ''}`,
                description: this.extractJSDoc(content, match.index),
                file,
                line,
            });
        }

        // Extract exported classes
        const classRegex = /export\s+class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/g;
        while ((match = classRegex.exec(content)) !== null) {
            const [, name] = match;
            const line = content.substring(0, match.index).split('\n').length;

            docs.push({
                name,
                type: 'class',
                signature: `class ${name}`,
                description: this.extractJSDoc(content, match.index),
                file,
                line,
            });
        }

        // Extract interfaces
        const interfaceRegex = /export\s+interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*\{/g;
        while ((match = interfaceRegex.exec(content)) !== null) {
            const [, name] = match;
            const line = content.substring(0, match.index).split('\n').length;

            docs.push({
                name,
                type: 'interface',
                signature: `interface ${name}`,
                description: this.extractJSDoc(content, match.index),
                file,
                line,
            });
        }

        return docs;
    }

    private extractJSDoc(content: string, position: number): string {
        const before = content.substring(Math.max(0, position - 500), position);
        const jsdocMatch = before.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/);
        if (jsdocMatch) {
            return jsdocMatch[1].replace(/\s*\*\s*/g, ' ').trim();
        }
        return '';
    }

    // ========================================================================
    // OUTPUT
    // ========================================================================

    /**
     * Save documentation to files
     */
    async saveDocs(docs: Documentation, outputDir: string): Promise<void> {
        await fs.mkdir(outputDir, { recursive: true });

        // Save sections as markdown
        for (const section of docs.sections) {
            const filename = `${section.order.toString().padStart(2, '0')}-${section.title.toLowerCase().replace(/\s+/g, '-')}.md`;
            await fs.writeFile(
                path.join(outputDir, filename),
                `# ${section.title}\n\n${section.content}`
            );
        }

        // Save API reference
        let apiContent = '# API Reference\n\n';
        for (const api of docs.api) {
            apiContent += `## ${api.name}\n\n`;
            apiContent += `\`${api.signature}\`\n\n`;
            if (api.description) apiContent += `${api.description}\n\n`;
            apiContent += `*File: ${api.file}:${api.line}*\n\n---\n\n`;
        }
        await fs.writeFile(path.join(outputDir, 'api-reference.md'), apiContent);

        this.emit('docs:saved', { outputDir });
    }
}

const tutorials: any[] = [];

// Export singleton
export const documentationGenerator = DocumentationGenerator.getInstance();
