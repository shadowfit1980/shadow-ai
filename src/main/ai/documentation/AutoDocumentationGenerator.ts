/**
 * Automatic Documentation Generator
 * 
 * Generates comprehensive documentation for code including
 * JSDoc, README, API docs, and architecture diagrams.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface FunctionDoc {
    name: string;
    description: string;
    params: Array<{ name: string; type: string; description: string }>;
    returns: { type: string; description: string };
    examples?: string[];
    throws?: string[];
}

interface ClassDoc {
    name: string;
    description: string;
    methods: FunctionDoc[];
    properties: Array<{ name: string; type: string; description: string }>;
}

interface ModuleDoc {
    name: string;
    description: string;
    exports: Array<{ name: string; type: string }>;
    dependencies: string[];
}

interface DocumentationResult {
    type: 'jsdoc' | 'markdown' | 'readme' | 'api';
    content: string;
    file?: string;
}

// ============================================================================
// AUTOMATIC DOCUMENTATION GENERATOR
// ============================================================================

export class AutoDocumentationGenerator extends EventEmitter {
    private static instance: AutoDocumentationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): AutoDocumentationGenerator {
        if (!AutoDocumentationGenerator.instance) {
            AutoDocumentationGenerator.instance = new AutoDocumentationGenerator();
        }
        return AutoDocumentationGenerator.instance;
    }

    // ========================================================================
    // JSDOC GENERATION
    // ========================================================================

    generateJSDoc(code: string): DocumentationResult {
        const lines = code.split('\n');
        const documentedCode: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if function needs documentation
            const funcMatch = line.match(/^\s*(export\s+)?(async\s+)?function\s+(\w+)\s*\((.*?)\)/);
            if (funcMatch) {
                const [, , isAsync, name, params] = funcMatch;
                const doc = this.generateFunctionDoc(name, params, isAsync ? 'Promise<any>' : 'any');
                documentedCode.push(doc);
            }

            // Check for arrow functions
            const arrowMatch = line.match(/^\s*(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\((.*?)\)\s*=>/);
            if (arrowMatch) {
                const [, , name, isAsync, params] = arrowMatch;
                const doc = this.generateFunctionDoc(name, params, isAsync ? 'Promise<any>' : 'any');
                documentedCode.push(doc);
            }

            // Check for class
            const classMatch = line.match(/^\s*(export\s+)?class\s+(\w+)/);
            if (classMatch) {
                const [, , name] = classMatch;
                const doc = this.generateClassDoc(name);
                documentedCode.push(doc);
            }

            // Check for interface/type
            const typeMatch = line.match(/^\s*(export\s+)?(interface|type)\s+(\w+)/);
            if (typeMatch) {
                const [, , kind, name] = typeMatch;
                const doc = this.generateTypeDoc(name, kind);
                documentedCode.push(doc);
            }

            documentedCode.push(line);
        }

        return {
            type: 'jsdoc',
            content: documentedCode.join('\n'),
        };
    }

    private generateFunctionDoc(name: string, params: string, returnType: string): string {
        const paramList = params.split(',').filter(p => p.trim());
        const paramDocs = paramList.map(p => {
            const [paramName, paramType] = p.split(':').map(s => s.trim());
            return ` * @param {${paramType || 'any'}} ${paramName.replace(/[?=].*/, '')} - Description`;
        });

        return `/**
 * ${this.generateDescription(name)}
${paramDocs.join('\n')}
 * @returns {${returnType}} Description of return value
 */`;
    }

    private generateClassDoc(name: string): string {
        return `/**
 * ${this.generateDescription(name)}
 * @class ${name}
 */`;
    }

    private generateTypeDoc(name: string, kind: string): string {
        return `/**
 * ${this.generateDescription(name)}
 * @${kind === 'interface' ? 'interface' : 'typedef'} ${name}
 */`;
    }

    private generateDescription(name: string): string {
        // Convert camelCase/PascalCase to readable description
        const words = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
        return words.charAt(0).toUpperCase() + words.slice(1);
    }

    // ========================================================================
    // README GENERATION
    // ========================================================================

    generateReadme(projectInfo: {
        name: string;
        description: string;
        features?: string[];
        installation?: string;
        usage?: string;
        scripts?: Record<string, string>;
        dependencies?: string[];
    }): DocumentationResult {
        let content = `# ${projectInfo.name}\n\n`;
        content += `${projectInfo.description}\n\n`;

        if (projectInfo.features?.length) {
            content += `## Features\n\n`;
            projectInfo.features.forEach(f => {
                content += `- ${f}\n`;
            });
            content += '\n';
        }

        content += `## Installation\n\n\`\`\`bash\n`;
        content += projectInfo.installation || `npm install ${projectInfo.name.toLowerCase()}`;
        content += `\n\`\`\`\n\n`;

        if (projectInfo.usage) {
            content += `## Usage\n\n\`\`\`javascript\n${projectInfo.usage}\n\`\`\`\n\n`;
        }

        if (projectInfo.scripts) {
            content += `## Scripts\n\n`;
            Object.entries(projectInfo.scripts).forEach(([key, value]) => {
                content += `- \`npm run ${key}\` - ${value}\n`;
            });
            content += '\n';
        }

        if (projectInfo.dependencies?.length) {
            content += `## Dependencies\n\n`;
            projectInfo.dependencies.forEach(d => {
                content += `- ${d}\n`;
            });
            content += '\n';
        }

        content += `## License\n\nMIT\n`;

        return {
            type: 'readme',
            content,
            file: 'README.md',
        };
    }

    // ========================================================================
    // API DOCUMENTATION
    // ========================================================================

    generateAPIDoc(endpoints: Array<{
        method: string;
        path: string;
        description: string;
        params?: Array<{ name: string; type: string; required: boolean }>;
        body?: Record<string, any>;
        response?: Record<string, any>;
    }>): DocumentationResult {
        let content = `# API Documentation\n\n`;
        content += `## Endpoints\n\n`;

        endpoints.forEach(endpoint => {
            content += `### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
            content += `${endpoint.description}\n\n`;

            if (endpoint.params?.length) {
                content += `**Parameters**\n\n`;
                content += `| Name | Type | Required | Description |\n`;
                content += `|------|------|----------|-------------|\n`;
                endpoint.params.forEach(p => {
                    content += `| ${p.name} | ${p.type} | ${p.required ? 'Yes' : 'No'} | - |\n`;
                });
                content += '\n';
            }

            if (endpoint.body) {
                content += `**Request Body**\n\n\`\`\`json\n${JSON.stringify(endpoint.body, null, 2)}\n\`\`\`\n\n`;
            }

            if (endpoint.response) {
                content += `**Response**\n\n\`\`\`json\n${JSON.stringify(endpoint.response, null, 2)}\n\`\`\`\n\n`;
            }

            content += '---\n\n';
        });

        return {
            type: 'api',
            content,
            file: 'API.md',
        };
    }

    // ========================================================================
    // MODULE DOCUMENTATION
    // ========================================================================

    generateModuleDoc(code: string, moduleName: string): DocumentationResult {
        const exports = this.extractExports(code);
        const dependencies = this.extractDependencies(code);

        let content = `# ${moduleName}\n\n`;
        content += `## Overview\n\n`;
        content += `This module provides ${exports.length} exports.\n\n`;

        content += `## Exports\n\n`;
        exports.forEach(exp => {
            content += `### ${exp.name}\n\n`;
            content += `Type: \`${exp.type}\`\n\n`;
        });

        if (dependencies.length) {
            content += `## Dependencies\n\n`;
            dependencies.forEach(dep => {
                content += `- \`${dep}\`\n`;
            });
        }

        return {
            type: 'markdown',
            content,
            file: `${moduleName}.md`,
        };
    }

    private extractExports(code: string): Array<{ name: string; type: string }> {
        const exports: Array<{ name: string; type: string }> = [];

        // Named exports
        const namedExports = code.match(/export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g) || [];
        for (const exp of namedExports) {
            const match = exp.match(/export\s+(const|let|var|function|class|interface|type)\s+(\w+)/);
            if (match) {
                exports.push({ name: match[2], type: match[1] });
            }
        }

        return exports;
    }

    private extractDependencies(code: string): string[] {
        const imports = code.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];
        return imports.map(imp => {
            const match = imp.match(/from\s+['"]([^'"]+)['"]/);
            return match ? match[1] : '';
        }).filter(d => d && !d.startsWith('.'));
    }

    // ========================================================================
    // TYPESCRIPT DECLARATION
    // ========================================================================

    generateTypeDeclaration(code: string): DocumentationResult {
        let declarations = '';

        // Extract interfaces and types
        const interfaces = code.match(/interface\s+\w+[^}]+}/gs) || [];
        const types = code.match(/type\s+\w+\s*=[^;]+;/g) || [];

        interfaces.forEach(i => {
            declarations += i + '\n\n';
        });

        types.forEach(t => {
            declarations += t + '\n\n';
        });

        // Generate declarations for functions
        const functions = code.match(/export\s+(?:async\s+)?function\s+\w+[^{]+/g) || [];
        for (const f of functions) {
            declarations += `declare ${f.replace('export ', '')};\n`;
        }

        return {
            type: 'markdown',
            content: declarations,
            file: 'index.d.ts',
        };
    }

    // ========================================================================
    // CHANGELOG GENERATION
    // ========================================================================

    generateChangelog(entries: Array<{
        version: string;
        date: string;
        changes: Array<{ type: 'added' | 'changed' | 'fixed' | 'removed'; description: string }>;
    }>): DocumentationResult {
        let content = `# Changelog\n\n`;
        content += `All notable changes to this project will be documented in this file.\n\n`;

        entries.forEach(entry => {
            content += `## [${entry.version}] - ${entry.date}\n\n`;

            const grouped = {
                added: entry.changes.filter(c => c.type === 'added'),
                changed: entry.changes.filter(c => c.type === 'changed'),
                fixed: entry.changes.filter(c => c.type === 'fixed'),
                removed: entry.changes.filter(c => c.type === 'removed'),
            };

            if (grouped.added.length) {
                content += `### Added\n`;
                grouped.added.forEach(c => content += `- ${c.description}\n`);
                content += '\n';
            }

            if (grouped.changed.length) {
                content += `### Changed\n`;
                grouped.changed.forEach(c => content += `- ${c.description}\n`);
                content += '\n';
            }

            if (grouped.fixed.length) {
                content += `### Fixed\n`;
                grouped.fixed.forEach(c => content += `- ${c.description}\n`);
                content += '\n';
            }

            if (grouped.removed.length) {
                content += `### Removed\n`;
                grouped.removed.forEach(c => content += `- ${c.description}\n`);
                content += '\n';
            }
        });

        return {
            type: 'markdown',
            content,
            file: 'CHANGELOG.md',
        };
    }
}

export const autoDocumentationGenerator = AutoDocumentationGenerator.getInstance();
