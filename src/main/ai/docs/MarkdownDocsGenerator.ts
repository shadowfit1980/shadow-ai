/**
 * Markdown/Docs Generator
 * 
 * Generate documentation from code.
 */

import { EventEmitter } from 'events';

interface FunctionDoc {
    name: string;
    description: string;
    params: { name: string; type: string; description: string }[];
    returns: { type: string; description: string };
    example?: string;
}

export class MarkdownDocsGenerator extends EventEmitter {
    private static instance: MarkdownDocsGenerator;

    private constructor() { super(); }

    static getInstance(): MarkdownDocsGenerator {
        if (!MarkdownDocsGenerator.instance) {
            MarkdownDocsGenerator.instance = new MarkdownDocsGenerator();
        }
        return MarkdownDocsGenerator.instance;
    }

    generateFunctionDoc(fn: FunctionDoc): string {
        const params = fn.params.map(p => `| \`${p.name}\` | \`${p.type}\` | ${p.description} |`).join('\n');
        return `## ${fn.name}

${fn.description}

### Parameters

| Name | Type | Description |
|------|------|-------------|
${params}

### Returns

- **Type:** \`${fn.returns.type}\`
- **Description:** ${fn.returns.description}

${fn.example ? `### Example\n\n\`\`\`typescript\n${fn.example}\n\`\`\`` : ''}
`;
    }

    generateAPIDoc(endpoints: { method: string; path: string; description: string; body?: string; response?: string }[]): string {
        return endpoints.map(ep => `### ${ep.method.toUpperCase()} \`${ep.path}\`

${ep.description}

${ep.body ? `**Request Body:**\n\`\`\`json\n${ep.body}\n\`\`\`\n` : ''}
${ep.response ? `**Response:**\n\`\`\`json\n${ep.response}\n\`\`\`` : ''}
`).join('\n---\n\n');
    }

    generateChangelog(entries: { version: string; date: string; changes: { type: 'added' | 'changed' | 'fixed' | 'removed'; description: string }[] }[]): string {
        return `# Changelog

All notable changes to this project will be documented in this file.

${entries.map(e => `## [${e.version}] - ${e.date}

${e.changes.map(c => `### ${c.type.charAt(0).toUpperCase() + c.type.slice(1)}\n- ${c.description}`).join('\n\n')}`).join('\n\n')}
`;
    }

    generateContributing(): string {
        return `# Contributing

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: \`git clone https://github.com/YOUR_USERNAME/PROJECT\`
3. Create a branch: \`git checkout -b feature/your-feature\`
4. Make your changes
5. Run tests: \`npm test\`
6. Commit: \`git commit -m "feat: your feature"\`
7. Push: \`git push origin feature/your-feature\`
8. Open a Pull Request

## Code Style

- Use TypeScript
- Follow existing code style
- Write tests for new features
- Update documentation as needed

## Commit Messages

We follow [Conventional Commits](https://conventionalcommits.org/):

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation
- \`style:\` Formatting
- \`refactor:\` Code restructuring
- \`test:\` Tests
- \`chore:\` Maintenance
`;
    }

    generateReadmeTemplate(project: { name: string; description: string; features: string[] }): string {
        return `# ${project.name}

${project.description}

## Features

${project.features.map(f => `- ${f}`).join('\n')}

## Installation

\`\`\`bash
npm install ${project.name.toLowerCase()}
\`\`\`

## Quick Start

\`\`\`typescript
import { ${project.name} } from '${project.name.toLowerCase()}';

// Usage example
\`\`\`

## Documentation

See [docs](./docs) for full documentation.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
`;
    }
}

export const markdownDocsGenerator = MarkdownDocsGenerator.getInstance();
