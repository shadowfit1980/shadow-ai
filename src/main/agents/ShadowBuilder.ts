import { BaseAgent } from './BaseAgent';
import { ProjectConfig, BuildResult } from '../types';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Shadow Builder Agent
 * Specializes in code generation, project building, and packaging
 */
export class ShadowBuilder extends BaseAgent {
    constructor() {
        const systemPrompt = `You are Shadow Builder, an expert software engineer and build specialist.

Your responsibilities:
- Generate production-ready code for various frameworks
- Build and package applications
- Optimize build configurations
- Create project scaffolding
- Write tests and documentation
- Handle dependencies and configurations

Supported frameworks: Next.js, React, Vue, Astro, Flask, Express, Rust, Go, Python
Always write clean, well-documented, production-ready code.
Follow best practices and modern coding standards.
Include error handling and edge cases.`;

        super('builder', systemPrompt);
    }

    async execute(task: string, context?: ProjectConfig): Promise<BuildResult> {
        try {
            const response = await this.chat(task, context);

            // If context includes a project config, actually build it
            if (context && context.type) {
                return await this.buildProject(context, response);
            }

            return {
                success: true,
                output: response,
            };
        } catch (error: any) {
            return {
                success: false,
                output: '',
                errors: [error.message],
            };
        }
    }

    /**
     * Build a project based on configuration
     */
    private async buildProject(
        config: ProjectConfig,
        aiResponse: string
    ): Promise<BuildResult> {
        const projectPath = config.path;

        try {
            // Create project directory
            if (!fs.existsSync(projectPath)) {
                fs.mkdirSync(projectPath, { recursive: true });
            }

            // Extract code blocks from AI response
            const codeBlocks = this.extractCodeBlocks(aiResponse);

            // Write files
            const artifacts: string[] = [];
            for (const block of codeBlocks) {
                if (block.filename) {
                    const filePath = path.join(projectPath, block.filename);
                    const dir = path.dirname(filePath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    fs.writeFileSync(filePath, block.code, 'utf8');
                    artifacts.push(filePath);
                }
            }

            // Run build command if specified
            let buildOutput = '';
            if (config.type === 'nextjs' || config.type === 'react') {
                const { stdout } = await execAsync('npm install', { cwd: projectPath });
                buildOutput = stdout;
            }

            return {
                success: true,
                output: aiResponse,
                artifacts,
            };
        } catch (error: any) {
            return {
                success: false,
                output: aiResponse,
                errors: [error.message],
            };
        }
    }

    /**
     * Extract code blocks from markdown
     */
    private extractCodeBlocks(markdown: string): Array<{ filename?: string; code: string; language?: string }> {
        const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+?))?\n([\s\S]*?)```/g;
        const blocks: Array<{ filename?: string; code: string; language?: string }> = [];
        let match;

        while ((match = codeBlockRegex.exec(markdown)) !== null) {
            blocks.push({
                language: match[1],
                filename: match[2],
                code: match[3],
            });
        }

        return blocks;
    }

    getCapabilities(): string[] {
        return [
            'Code generation (Next.js, React, Vue, Flask, etc.)',
            'Project scaffolding',
            'Build optimization',
            'Dependency management',
            'Test generation',
            'Documentation writing',
        ];
    }
}
