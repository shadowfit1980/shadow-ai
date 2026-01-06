/**
 * Project Creator
 * 
 * Generate complete project structures from natural language descriptions.
 * Supports multiple frameworks and tech stacks.
 */

import { mkdir, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type ProjectType =
    | 'react'
    | 'nextjs'
    | 'express'
    | 'fastapi'
    | 'electron'
    | 'cli'
    | 'library';

export interface ProjectConfig {
    name: string;
    type: ProjectType;
    description: string;
    features: string[];
    language: 'typescript' | 'javascript' | 'python';
    styling?: 'tailwind' | 'css' | 'scss' | 'styled-components';
    testing?: 'jest' | 'vitest' | 'pytest';
    database?: 'postgresql' | 'mongodb' | 'sqlite' | 'none';
    auth?: boolean;
    docker?: boolean;
}

export interface FileTemplate {
    path: string;
    content: string;
    isDirectory?: boolean;
}

export interface ProjectResult {
    success: boolean;
    projectPath: string;
    filesCreated: string[];
    commandsRun: string[];
    errors: string[];
}

// ============================================================================
// PROJECT TEMPLATES
// ============================================================================

const TEMPLATES: Record<string, FileTemplate[]> = {
    'react': [
        { path: 'src/App.tsx', content: '' },
        { path: 'src/index.tsx', content: '' },
        { path: 'src/index.css', content: '' },
        { path: 'public/index.html', content: '' },
        { path: 'package.json', content: '' },
        { path: 'tsconfig.json', content: '' },
        { path: 'vite.config.ts', content: '' },
    ],
    'nextjs': [
        { path: 'app/page.tsx', content: '' },
        { path: 'app/layout.tsx', content: '' },
        { path: 'app/globals.css', content: '' },
        { path: 'package.json', content: '' },
        { path: 'tsconfig.json', content: '' },
        { path: 'next.config.js', content: '' },
    ],
    'express': [
        { path: 'src/index.ts', content: '' },
        { path: 'src/routes/index.ts', content: '' },
        { path: 'src/middleware/index.ts', content: '' },
        { path: 'package.json', content: '' },
        { path: 'tsconfig.json', content: '' },
    ],
    'fastapi': [
        { path: 'app/main.py', content: '' },
        { path: 'app/routers/__init__.py', content: '' },
        { path: 'app/models/__init__.py', content: '' },
        { path: 'requirements.txt', content: '' },
        { path: 'pyproject.toml', content: '' },
    ],
    'cli': [
        { path: 'src/index.ts', content: '' },
        { path: 'src/commands/index.ts', content: '' },
        { path: 'package.json', content: '' },
        { path: 'tsconfig.json', content: '' },
    ]
};

// ============================================================================
// PROJECT CREATOR
// ============================================================================

export class ProjectCreator extends EventEmitter {
    private static instance: ProjectCreator;
    private modelManager: ModelManager;

    // Allowed commands for security - prevents shell injection
    private readonly ALLOWED_COMMANDS = [
        'npm install',
        'npm ci',
        'pip install -r requirements.txt',
        'python3 -m venv venv',
        './venv/bin/pip install -r requirements.txt',
        'git init',
        'git add .',
    ];

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): ProjectCreator {
        if (!ProjectCreator.instance) {
            ProjectCreator.instance = new ProjectCreator();
        }
        return ProjectCreator.instance;
    }

    // ========================================================================
    // PROJECT GENERATION
    // ========================================================================

    /**
     * Create a complete project from description
     */
    async createProject(description: string, outputDir: string): Promise<ProjectResult> {
        console.log('🏗️  Creating project from description...');
        this.emit('project:started', { description, outputDir });

        const filesCreated: string[] = [];
        const commandsRun: string[] = [];
        const errors: string[] = [];

        try {
            // Step 1: Analyze description and generate config
            const config = await this.analyzeDescription(description);
            console.log(`📋 Project type: ${config.type}, Language: ${config.language}`);

            // Step 2: Create project directory
            const projectPath = join(outputDir, config.name);
            await mkdir(projectPath, { recursive: true });

            // Step 3: Generate file contents
            const files = await this.generateProjectFiles(config);

            // Step 4: Write files
            for (const file of files) {
                const fullPath = join(projectPath, file.path);
                const dir = join(projectPath, file.path.split('/').slice(0, -1).join('/'));

                if (dir !== projectPath) {
                    await mkdir(dir, { recursive: true });
                }

                await writeFile(fullPath, file.content);
                filesCreated.push(file.path);
                this.emit('file:created', { path: file.path });
            }

            // Step 5: Run setup commands (with validation)
            const setupCommands = this.getSetupCommands(config);
            for (const cmd of setupCommands) {
                // SECURITY: Validate command against allow-list
                if (!this.validateCommand(cmd)) {
                    const error = `Security: Blocked unsafe command: ${cmd}`;
                    console.error(`❌ ${error}`);
                    errors.push(error);
                    continue;
                }

                try {
                    console.log(`  Running: ${cmd}`);
                    await execAsync(cmd, { cwd: projectPath });
                    commandsRun.push(cmd);
                } catch (error) {
                    errors.push(`Command failed: ${cmd}`);
                }
            }

            // Step 6: Initialize git
            try {
                await execAsync('git init', { cwd: projectPath });
                await execAsync('git add .', { cwd: projectPath });
                await execAsync('git commit -m "Initial commit"', { cwd: projectPath });
                commandsRun.push('git init && git add . && git commit');
            } catch {
                errors.push('Git initialization failed');
            }

            this.emit('project:completed', { projectPath, filesCreated });

            return {
                success: true,
                projectPath,
                filesCreated,
                commandsRun,
                errors
            };

        } catch (error) {
            errors.push((error as Error).message);
            this.emit('project:failed', { error: (error as Error).message });

            return {
                success: false,
                projectPath: outputDir,
                filesCreated,
                commandsRun,
                errors
            };
        }
    }

    /**
     * Analyze description and generate config
     */
    private async analyzeDescription(description: string): Promise<ProjectConfig> {
        const prompt = `Analyze this project description and generate a configuration.

Description: "${description}"

Generate a JSON configuration:
\`\`\`json
{
    "name": "project-name (lowercase, hyphens)",
    "type": "react|nextjs|express|fastapi|electron|cli|library",
    "description": "brief description",
    "features": ["list", "of", "features"],
    "language": "typescript|javascript|python",
    "styling": "tailwind|css|scss|styled-components|null",
    "testing": "jest|vitest|pytest|null",
    "database": "postgresql|mongodb|sqlite|none",
    "auth": true/false,
    "docker": true/false
}
\`\`\`

Choose the most appropriate options based on the description.`;

        const response = await this.callModel(prompt);
        const config = this.parseJSON(response);

        // Validate and set defaults
        return {
            name: config.name || 'my-project',
            type: config.type || 'react',
            description: config.description || description,
            features: config.features || [],
            language: config.language || 'typescript',
            styling: config.styling,
            testing: config.testing,
            database: config.database || 'none',
            auth: config.auth || false,
            docker: config.docker || false
        };
    }

    /**
     * Generate all project files with content
     */
    private async generateProjectFiles(config: ProjectConfig): Promise<FileTemplate[]> {
        const prompt = `Generate complete file contents for a ${config.type} project.

Project: ${config.name}
Type: ${config.type}
Language: ${config.language}
Features: ${config.features.join(', ')}
Styling: ${config.styling || 'default'}
Database: ${config.database}
Auth: ${config.auth}

Generate JSON with file paths and contents:
\`\`\`json
{
    "files": [
        {
            "path": "relative/path/to/file.ext",
            "content": "file contents here"
        }
    ]
}
\`\`\`

Include:
1. Entry point files
2. Configuration files (package.json, tsconfig, etc.)
3. Basic components/routes
4. README.md
5. .gitignore
6. Docker files if enabled`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        // Ensure we have base files
        const files = parsed.files || [];

        // Add .gitignore if not present
        if (!files.some((f: FileTemplate) => f.path === '.gitignore')) {
            files.push({
                path: '.gitignore',
                content: this.getGitignore(config.language)
            });
        }

        // Add README if not present
        if (!files.some((f: FileTemplate) => f.path === 'README.md')) {
            files.push({
                path: 'README.md',
                content: this.getReadme(config)
            });
        }

        return files;
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    /**
     * Validate command against allow-list to prevent shell injection
     */
    private validateCommand(cmd: string): boolean {
        const trimmed = cmd.trim();
        return this.ALLOWED_COMMANDS.some(allowed => trimmed === allowed);
    }

    private getSetupCommands(config: ProjectConfig): string[] {
        const commands: string[] = [];

        if (config.language === 'python') {
            commands.push('python3 -m venv venv');
            commands.push('./venv/bin/pip install -r requirements.txt');
        } else {
            commands.push('npm install');
        }

        return commands;
    }

    private getGitignore(language: string): string {
        const common = `
# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
`;

        if (language === 'python') {
            return common + `
# Python
__pycache__/
*.py[cod]
venv/
.env
*.egg-info/
dist/
build/
`;
        }

        return common + `
# Node
node_modules/
dist/
build/
.env
.env.local
*.tsbuildinfo
`;
    }

    private getReadme(config: ProjectConfig): string {
        return `# ${config.name}

${config.description}

## Features

${config.features.map(f => `- ${f}`).join('\n')}

## Getting Started

\`\`\`bash
${config.language === 'python' ? 'python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt' : 'npm install'}
\`\`\`

## Development

\`\`\`bash
${config.language === 'python' ? 'python -m app.main' : 'npm run dev'}
\`\`\`

## License

MIT
`;
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            return await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are a project scaffolding expert. Generate clean, production-ready code.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
        } catch {
            return '{}';
        }
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }

    // ========================================================================
    // QUICK TEMPLATES
    // ========================================================================

    /**
     * Create React + Vite project
     */
    async createReactProject(name: string, outputDir: string): Promise<ProjectResult> {
        return this.createProject(`React application named ${name} with TypeScript, Tailwind CSS, and modern best practices`, outputDir);
    }

    /**
     * Create Next.js project
     */
    async createNextProject(name: string, outputDir: string): Promise<ProjectResult> {
        return this.createProject(`Next.js 14 application named ${name} with TypeScript, App Router, and Tailwind CSS`, outputDir);
    }

    /**
     * Create Express API project
     */
    async createExpressProject(name: string, outputDir: string): Promise<ProjectResult> {
        return this.createProject(`Express.js REST API named ${name} with TypeScript, proper routing, and middleware`, outputDir);
    }

    /**
     * Create FastAPI project
     */
    async createFastAPIProject(name: string, outputDir: string): Promise<ProjectResult> {
        return this.createProject(`FastAPI application named ${name} with proper structure, routers, and models`, outputDir);
    }
}

// Export singleton
export const projectCreator = ProjectCreator.getInstance();
