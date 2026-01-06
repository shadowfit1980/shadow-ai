/**
 * CoderAgent - Code Implementation Specialist
 * 
 * Responsible for writing clean, efficient code following architecture specs
 */

import { BaseAgent } from '../BaseAgent';
import {
    AgentMetadata,
    ExecutionStep,
    AgentContext,
    ProjectContext,
    CodeOutput,
    CodeFile,
    TestFile,
    Dependency
} from '../types';

export class CoderAgent extends BaseAgent {
    get metadata(): AgentMetadata {
        return {
            type: 'coder',
            name: 'Shadow Coder',
            specialty: 'Code Implementation & Development',
            capabilities: [
                {
                    name: 'Feature Implementation',
                    description: 'Implement features per architectural specifications',
                    confidence: 0.95
                },
                {
                    name: 'Unit Testing',
                    description: 'Write comprehensive unit tests',
                    confidence: 0.90
                },
                {
                    name: 'Code Documentation',
                    description: 'Create clear, helpful documentation',
                    confidence: 0.88
                },
                {
                    name: 'Refactoring',
                    description: 'Improve code quality and maintainability',
                    confidence: 0.85
                },
                {
                    name: 'Edge Case Handling',
                    description: 'Consider and handle edge cases',
                    confidence: 0.82
                }
            ],
            preferredModel: 'deepseek-coder',
            fallbackModel: 'claude-sonnet'
        };
    }

    protected async buildPrompt(
        step: ExecutionStep,
        context: AgentContext,
        memory: ProjectContext
    ): Promise<string> {
        const architecture = context.previousResults.find(r => r.agentType === 'architect')?.output;
        const styleGuide = memory.styles[0]?.metadata.patterns;
        const similarCode = memory.code.slice(0, 3);

        return `You are ${this.metadata.name}, an expert software developer.

## Task
${step.description}

## Requirements
${step.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Architecture Specification
${architecture ? JSON.stringify(architecture, null, 2) : 'No architecture provided - use best practices'}

## Coding Style Guide (MUST FOLLOW EXACTLY)
${styleGuide ? JSON.stringify(styleGuide, null, 2) : 'Use clean, modern coding standards'}

## Similar Code Examples (for reference)
${similarCode.map((code, i) => `
### Example ${i + 1}: ${code.metadata.file}
\`\`\`${code.metadata.language}
${code.content.substring(0, 500)}
\`\`\`
`).join('\n')}

## Your Mission
Write production-ready code that:
1. **Follows the coding style EXACTLY** (indentation, quotes, semicolons, naming)
2. Implements the architecture specification
3. Includes comprehensive error handling
4. Has proper input validation
5. Handles edge cases
6. Includes unit tests
7. Has clear documentation
8. Is optimized for performance
9. Follows DRY principles
10. Uses TypeScript best practices

## Output Format
Return your implementation as a JSON object with this EXACT structure:

\`\`\`json
{
  "files": [
    {
      "path": "relative/path/to/file",
      "name": "filename.ts",
      "content": "complete file content here",
      "language": "typescript"
    }
  ],
  "tests": [
    {
      "path": "relative/path/to/test",
      "name": "filename.test.ts",
      "content": "complete test file content",
      "framework": "jest"
    }
  ],
  "documentation": "Markdown documentation explaining the implementation, API usage, and examples",
  "dependencies": [
    {
      "name": "package-name",
      "version": "^1.0.0",
      "type": "production"
    }
  ]
}
\`\`\`

Be thorough, write clean maintainable code, and ensure everything is production-ready.`;
    }

    protected async parseResponse(response: string, step: ExecutionStep): Promise<CodeOutput> {
        const codeBlocks = this.extractCodeBlocks(response);

        let codeJSON: any = null;

        for (const block of codeBlocks) {
            if (block.language === 'json' || block.language === 'javascript') {
                try {
                    codeJSON = JSON.parse(block.code);
                    break;
                } catch {
                    continue;
                }
            }
        }

        if (!codeJSON) {
            codeJSON = this.extractJSON(response);
        }

        if (!codeJSON) {
            console.warn('⚠️  Could not parse JSON code output, using fallback');
            return this.fallbackParse(response, step);
        }

        return {
            files: this.parseCodeFiles(codeJSON.files || []),
            tests: this.parseTestFiles(codeJSON.tests || []),
            documentation: codeJSON.documentation || 'No documentation provided',
            dependencies: this.parseDependencies(codeJSON.dependencies || [])
        };
    }

    private parseCodeFiles(filesData: any[]): CodeFile[] {
        return filesData.map(file => ({
            path: file.path || 'src/',
            name: file.name || 'unnamed.ts',
            content: file.content || '// Empty file',
            language: file.language || 'typescript'
        }));
    }

    private parseTestFiles(testsData: any[]): TestFile[] {
        return testsData.map(test => ({
            path: test.path || 'src/__tests__/',
            name: test.name || 'unnamed.test.ts',
            content: test.content || '// Empty test',
            framework: test.framework || 'jest'
        }));
    }

    private parseDependencies(depsData: any[]): Dependency[] {
        return depsData.map(dep => ({
            name: dep.name || 'unknown',
            version: dep.version || 'latest',
            type: dep.type || 'production'
        }));
    }

    private fallbackParse(response: string, step: ExecutionStep): CodeOutput {
        const codeBlocks = this.extractCodeBlocks(response);
        const files: CodeFile[] = [];

        codeBlocks.forEach((block, i) => {
            if (block.language !== 'json') {
                files.push({
                    path: 'src/',
                    name: `generated-${i}.${this.getExtension(block.language)}`,
                    content: block.code,
                    language: block.language
                });
            }
        });

        return {
            files,
            tests: [],
            documentation: response.substring(0, 1000),
            dependencies: []
        };
    }

    private getExtension(language: string): string {
        const extMap: Record<string, string> = {
            'typescript': 'ts',
            'javascript': 'js',
            'python': 'py',
            'java': 'java',
            'go': 'go',
            'rust': 'rs'
        };
        return extMap[language] || 'txt';
    }

    protected async validateOutput(output: CodeOutput, step: ExecutionStep) {
        const issues: any[] = [];
        const warnings: any[] = [];

        if (!output.files || output.files.length === 0) {
            issues.push({
                severity: 'critical',
                description: 'No code files generated'
            });
        }

        output.files.forEach(file => {
            if (!file.content || file.content.trim().length < 10) {
                warnings.push({
                    severity: 'minor',
                    description: `File ${file.name} has very little content`
                });
            }
        });

        if (!output.tests || output.tests.length === 0) {
            warnings.push({
                severity: 'minor',
                description: 'No unit tests generated'
            });
        }

        if (!output.documentation || output.documentation.length < 50) {
            warnings.push({
                severity: 'minor',
                description: 'Documentation is too brief'
            });
        }

        return {
            valid: issues.length === 0,
            critical: issues.some(i => i.severity === 'critical'),
            issues,
            warnings
        };
    }

    protected calculateConfidence(output: CodeOutput): number {
        let score = 0.5;

        if (output.files.length > 0) score += 0.15;
        if (output.tests.length > 0) score += 0.15;
        if (output.documentation.length > 100) score += 0.1;
        if (output.dependencies.length > 0) score += 0.05;

        // Bonus for substantial code
        const totalCodeLines = output.files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
        if (totalCodeLines > 50) score += 0.05;

        return Math.min(score, 1.0);
    }
}
